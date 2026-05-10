using PrepApi.Models;

namespace PrepApi.Services.Interfaces
{
    public interface IDocumentIntelligenceService
    {
        Task<ExtractionResult> ExtractActaAsync(string actaId, byte[] imageBytes);
        Task<string> StartBatchAnalysisAsync(string containerUrl, string resultContainerUrl);
        Task<BatchAnalysisStatus> GetBatchStatusAsync(string operationLocation);
    }
}