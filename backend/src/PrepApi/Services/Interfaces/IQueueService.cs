using PrepApi.Models;

namespace PrepApi.Services.Interfaces
{
    public interface IQueueService
    {
        string AssignQueue(ExtractionResult extraction, List<ActaValidation> validations);
    }
}