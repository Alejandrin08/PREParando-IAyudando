namespace PrepApi.DTOs
{
    public class EntitySummaryDto
    {
        public string Entity { get; set; } = string.Empty;
        public int TotalSections { get; set; }
        public int ApprovedSections { get; set; }
        public int PendingSections { get; set; }
        public int RejectedSections { get; set; }
        public int InReviewSections { get; set; }
        public int TotalVotes { get; set; }
        public List<PartyTotalDto> PartyTotals { get; set; } = new();
        public PartyTotalDto? FirstPlace { get; set; }
        public PartyTotalDto? SecondPlace { get; set; }
        public PartyTotalDto? ThirdPlace { get; set; }
    }

    public class PartyTotalDto
    {
        public string FieldName { get; set; } = string.Empty;
        public int TotalVotes { get; set; }
        public float Percentage { get; set; }
    }
}