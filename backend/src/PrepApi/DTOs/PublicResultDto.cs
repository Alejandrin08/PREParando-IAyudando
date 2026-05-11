namespace PrepApi.DTOs
{
    public class PublicResultDto
    {
        public int Id { get; set; }
        public string Entity { get; set; } = string.Empty;
        public string Municipality { get; set; } = string.Empty;
        public string Section { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string PublicStatus { get; set; } = string.Empty;
        public string? PublicStatusDetail { get; set; }
        public string? ImageUrl { get; set; }
        public float GlobalConfidence { get; set; }
        public DateTime IngestedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public List<PartyResultDto> PartyResults { get; set; } = new();
        public List<ControlFieldDto> ControlFields { get; set; } = new();
    }

    public class PartyResultDto
    {
        public string FieldName { get; set; } = string.Empty;
        public int? Votes { get; set; }
        public float Confidence { get; set; }
    }

    public class ControlFieldDto
    {
        public string FieldName { get; set; } = string.Empty;
        public int? Value { get; set; }
    }
}