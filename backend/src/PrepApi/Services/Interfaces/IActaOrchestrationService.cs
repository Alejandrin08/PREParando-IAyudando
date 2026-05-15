using PrepApi.DTOs;

namespace PrepApi.Services.Interfaces
{
    public interface IActaOrchestrationService
    {
        Task<BatchStatusDto> StartBatchAsync(List<IFormFile> images);
        Task<ActaResponseDto?> GetActaAsync(int id);
        Task<List<ActaResponseDto>> GetQueueAsync(string? queue, string? status);
        Task<ActaResponseDto?> ApproveActaAsync(int id, string approvedBy);
        Task<ActaResponseDto?> CorrectFieldAsync(int id, CorrectFieldDto dto);
        Task<ActaResponseDto?> RejectActaAsync(int id, string rejectedBy);
        Task<DashboardDto> GetDashboardAsync();
        Task<ActaResponseDto?> RejectByCapturistaAsync(int id, string rejectedBy);
        Task<ActaResponseDto?> VerifyApproveAsync(int id, string verifiedBy);
        Task<ActaResponseDto?> VerifyRejectAsync(int id, VerifyActaDto dto);
        Task<List<ActaResponseDto>> GetVerificadorQueueAsync(string? status);
    }
}