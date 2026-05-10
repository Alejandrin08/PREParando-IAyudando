namespace PrepApi.DTOs
{
    public class BatchStatusDto
    {
        public string OperationId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int TotalDocuments { get; set; }
        public int SucceededDocuments { get; set; }
        public int FailedDocuments { get; set; }
    }
}