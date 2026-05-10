using System.ComponentModel.DataAnnotations;

namespace PrepApi.Models
{

    public class ActaField
    {
        public int Id { get; set; }
        public int ActaId { get; set; }
        [MaxLength(100)]
        public string FieldName { get; set; } = string.Empty;
        public int? NumericValue { get; set; }
        public string? TextValue { get; set; }
        public float Confidence { get; set; }
        public ConfidenceLevel ConfidenceLevel { get; set; }
        public string? BoundingRegion { get; set; }
        public Acta Acta { get; set; } = null!;
    }
}