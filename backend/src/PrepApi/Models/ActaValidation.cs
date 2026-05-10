using System.ComponentModel.DataAnnotations;

namespace PrepApi.Models
{
    public class ActaValidation
    {
        public int Id { get; set; }
        public int ActaId { get; set; }

        [MaxLength(100)]
        public string RuleName { get; set; } = string.Empty;

        public bool Passed { get; set; }

        [MaxLength(300)]
        public string? Detail { get; set; }

        public DateTime CheckedAt { get; set; } = DateTime.UtcNow;

        public Acta Acta { get; set; } = null!;
    }
}