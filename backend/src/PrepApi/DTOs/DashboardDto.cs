namespace PrepApi.DTOs
{
    public class DashboardDto
    {
        public int TotalActas { get; set; }
        public int Pending { get; set; }
        public int InReview { get; set; }
        public int Approved { get; set; }
        public int Rejected { get; set; }
        public int HighQueue { get; set; }
        public int StandardQueue { get; set; }
        public int WithArithmeticErrors { get; set; }
        public int WithLowConfidence { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}