namespace PrepApi.Models
{
    public class ExtractionResult
    {
        public string ActaId { get; set; } = string.Empty;
        public List<ExtractedField> Fields { get; set; } = new();
        public float GlobalConfidence { get; set; }
        public ConfidenceLevel GlobalLevel { get; set; }
        public bool RequiresPriorityReview { get; set; }
        public List<string> Alerts { get; set; } = new();
    }
}