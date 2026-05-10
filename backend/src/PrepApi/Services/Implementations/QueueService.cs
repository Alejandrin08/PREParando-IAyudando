using PrepApi.Models;
using PrepApi.Services.Interfaces;

namespace PrepApi.Services.Implementations
{
    public class QueueService : IQueueService
    {
        public string AssignQueue(ExtractionResult extraction, List<ActaValidation> validations)
        {
            var hasFailedValidation = validations.Any(v => !v.Passed);
            if (hasFailedValidation)
                return "High";

            return extraction.GlobalLevel switch
            {
                ConfidenceLevel.High => "Standard",
                ConfidenceLevel.Medium => "High",
                ConfidenceLevel.Low => "High",
                _ => "High"
            };
        }
    }
}