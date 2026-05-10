namespace PrepApi.Models
{
    public class BatchAnalysisStatus
    {
        public string OperationId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int TotalDocuments { get; set; }
        public int SucceededDocuments { get; set; }
        public int FailedDocuments { get; set; }
        public List<BatchDocumentResult> Results { get; set; } = new();
    }

    public class BatchDocumentResult
    {
        public string FileName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public ExtractionResult? ExtractionResult { get; set; }
    }
}