using PrepApi.DTOs;

namespace PrepApi.Services.Interfaces
{
    public interface IPublicResultsService
    {
        Task<List<PublicResultDto>> GetResultsAsync(
            string? entity,
            string? municipality,
            string? section,
            string? party,
            string? status);

        Task<List<EntitySummaryDto>> GetResultsByEntityAsync();

        Task<PublicResultDto?> GetResultDetailAsync(int id);
    }
}