using PrepApi.Models;
using PrepApi.Services.Interfaces;

namespace PrepApi.Services.Implementations
{
    public class QueueService : IQueueService
    {
        public string AssignQueue(ExtractionResult extraction, List<ActaValidation> validations)
        {
            var exceedsNominal = validations.Any(v =>
                v.RuleName == "TotalVotesExceedNominal" && !v.Passed);

            var lowConfidence = extraction.GlobalConfidence < 0.70;

            if (exceedsNominal || lowConfidence)
                return "High";

            return "Standard";
        }
    }
}