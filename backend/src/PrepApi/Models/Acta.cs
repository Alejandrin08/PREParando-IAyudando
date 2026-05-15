using System.ComponentModel.DataAnnotations;

namespace PrepApi.Models
{
    public class Acta
    {
        public int Id { get; set; }

        [MaxLength(100)]
        public string ActaId { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Entity { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Municipality { get; set; } = string.Empty;

        [MaxLength(20)]
        public string Section { get; set; } = string.Empty;

        public string? RejectionReason { get; set; }

        public string? RejectionCategory { get; set; }

        public float GlobalConfidence { get; set; }
        public ConfidenceLevel ConfidenceLevel { get; set; }

        public bool ArithmeticValidationOk { get; set; }

        public DateTime IngestedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(20)]
        public string Status { get; set; } = "Pending";

        [MaxLength(10)]
        public string AssignedQueue { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? ApprovedBy { get; set; }

        public DateTime? ApprovedAt { get; set; }

        public List<ActaField> Fields { get; set; } = new();
        public List<ActaValidation> Validations { get; set; } = new();
    }
}