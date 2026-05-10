namespace PrepApi.DTOs
{
    public class ActaResponseDto
    {
        public int Id { get; set; }
        public string ActaId { get; set; } = string.Empty;
        public string Entity { get; set; } = string.Empty;
        public string Municipality { get; set; } = string.Empty;
        public string Section { get; set; } = string.Empty;
        public float GlobalConfidence { get; set; }
        public string ConfidenceLevel { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string AssignedQueue { get; set; } = string.Empty;
        public bool ArithmeticValidationOk { get; set; }
        public DateTime IngestedAt { get; set; }
        public string? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public List<FieldResponseDto> Fields { get; set; } = new();
        public List<ValidationResponseDto> Validations { get; set; } = new();
        public string? ImageUrl { get; set; }
        public List<string> Alerts { get; set; } = new();
    }

    public class FieldResponseDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Value { get; set; }
        public float Confidence { get; set; }
        public string ConfidenceLevel { get; set; } = string.Empty;
        public string? BoundingRegion { get; set; }
    }

    public class ValidationResponseDto
    {
        public string RuleName { get; set; } = string.Empty;
        public bool Passed { get; set; }
        public string? Detail { get; set; }
    }
}