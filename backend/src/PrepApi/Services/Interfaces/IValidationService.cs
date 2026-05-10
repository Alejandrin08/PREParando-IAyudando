using PrepApi.Models;

namespace PrepApi.Services.Interfaces
{
    public interface IValidationService
    {
        List<ActaValidation> Validate(ExtractionResult extraction);
    }
}