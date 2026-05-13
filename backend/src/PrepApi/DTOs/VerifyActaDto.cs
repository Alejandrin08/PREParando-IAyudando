namespace PrepApi.DTOs
{
    public class VerifyActaDto
    {
        public string VerifiedBy { get; set; } = string.Empty;

        public string? RejectionReason { get; set; }
        public string? RejectionCategory { get; set; }
    }
}