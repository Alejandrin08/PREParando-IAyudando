using System.Text.Json;
using Azure;
using Azure.AI.DocumentIntelligence;
using PrepApi.Models;
using PrepApi.Services.Interfaces;

namespace PrepApi.Services.Implementations
{
    public class DocumentIntelligenceService : IDocumentIntelligenceService
    {
        private readonly DocumentIntelligenceClient _client;
        private readonly string _modelId;
        private readonly ILogger<DocumentIntelligenceService> _logger;
        private readonly HttpClient _httpClient;

        public DocumentIntelligenceService(
            IConfiguration configuration,
            ILogger<DocumentIntelligenceService> logger,
            IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();

            var endpoint = configuration["AzureDocumentIntelligence:Endpoint"]!;
            var key = configuration["AzureDocumentIntelligence:Key"]!;
            _modelId = configuration["AzureDocumentIntelligence:ModelId"]!;

            _httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", key);

            _client = new DocumentIntelligenceClient(new Uri(endpoint), new AzureKeyCredential(key));
        }

        public async Task<ExtractionResult> ExtractActaAsync(string actaId, byte[] imageBytes)
        {
            var content = new
            {
                Base64Source = BinaryData.FromBytes(imageBytes)
            };

            var operation = await _client.AnalyzeDocumentAsync(
                            WaitUntil.Completed,
                            _modelId,
                            BinaryData.FromBytes(imageBytes));

            return ParseAnalyzeResult(actaId, operation.Value);
        }

        public async Task<string> StartBatchAnalysisAsync(
            string containerUrl,
            string resultContainerUrl)
        {
            var endpoint = _client.Pipeline.ToString();

            var requestBody = new
            {
                azureBlobSource = new { containerUrl },
                resultContainerUrl,
                overwriteExisting = true
            };

            var url = $"{_client.ToString()}/documentintelligence/documentModels/{_modelId}:analyzeBatch?api-version=2024-11-30";

            var response = await _httpClient.PostAsJsonAsync(url, requestBody);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Batch analysis failed to start: {error}");
            }

            var operationLocation = response.Headers.GetValues("Operation-Location").First();

            _logger.LogInformation("Batch analysis started, operation location: {Location}", operationLocation);

            return operationLocation;
        }

        public async Task<BatchAnalysisStatus> GetBatchStatusAsync(string operationLocation)
        {
            var response = await _httpClient.GetAsync(operationLocation);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var status = root.GetProperty("status").GetString() ?? "unknown";
            var result = new BatchAnalysisStatus
            {
                OperationId = operationLocation,
                Status = status
            };

            if (status == "succeeded" && root.TryGetProperty("result", out var resultProp))
            {
                if (resultProp.TryGetProperty("details", out var details))
                {
                    foreach (var detail in details.EnumerateArray())
                    {
                        var docResult = new BatchDocumentResult
                        {
                            FileName = detail.TryGetProperty("sourceUrl", out var src)
                                ? Path.GetFileName(src.GetString() ?? "")
                                : "unknown",
                            Status = detail.TryGetProperty("status", out var s)
                                ? s.GetString() ?? "unknown"
                                : "unknown"
                        };

                        result.Results.Add(docResult);
                    }
                }
            }

            return result;
        }

        private ExtractionResult ParseAnalyzeResult(string actaId, AnalyzeResult analyzeResult)
        {
            var extractedFields = new List<ExtractedField>();
            var alerts = new List<string>();

            foreach (var document in analyzeResult.Documents)
            {
                foreach (var (fieldName, field) in document.Fields)
                {
                    var confidence = field.Confidence ?? 0f;
                    var level = ClassifyConfidence(confidence);

                    if (level == ConfidenceLevel.Low)
                        alerts.Add($"Field '{fieldName}' has low confidence ({confidence:P0})");

                    string? boundingRegion = null;
                    if (field.BoundingRegions?.Count > 0)
                    {
                        var region = field.BoundingRegions[0];
                        boundingRegion = JsonSerializer.Serialize(new
                        {
                            page = region.PageNumber,
                            polygon = region.Polygon
                        });
                    }

                    extractedFields.Add(new ExtractedField
                    {
                        Name = fieldName,
                        Value = field.ValueInt64?.ToString() ?? field.Content,
                        RawConfidence = confidence,
                        Level = level,
                        BoundingRegion = boundingRegion
                    });
                }
            }

            var globalConfidence = extractedFields.Count > 0
                ? extractedFields.Average(f => f.RawConfidence)
                : 0f;

            var globalLevel = ClassifyConfidence(globalConfidence);

            return new ExtractionResult
            {
                ActaId = actaId,
                Fields = extractedFields,
                GlobalConfidence = globalConfidence,
                GlobalLevel = globalLevel,
                RequiresPriorityReview = globalLevel != ConfidenceLevel.High,
                Alerts = alerts
            };
        }

        private static ConfidenceLevel ClassifyConfidence(float confidence) => confidence switch
        {
            >= 0.85f => ConfidenceLevel.High,
            >= 0.60f => ConfidenceLevel.Medium,
            _ => ConfidenceLevel.Low
        };
    }
}