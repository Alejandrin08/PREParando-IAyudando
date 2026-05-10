namespace PrepApi.Models
{
    public class ExtractedField
    {
        public string Name { get; set; } = string.Empty;
        public string? Value { get; set; }
        public float RawConfidence { get; set; }
        public ConfidenceLevel Level { get; set; }
        public string? BoundingRegion { get; set; }
    }
}