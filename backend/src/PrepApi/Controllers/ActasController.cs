using Microsoft.AspNetCore.Mvc;
using PrepApi.DTOs;
using PrepApi.Services;
using Microsoft.AspNetCore.Authorization;
using PrepApi.Services.Interfaces;

namespace PrepApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Capturista,Verificador")]
    public class ActasController : ControllerBase
    {
        private readonly IActaOrchestrationService _orchestration;

        public ActasController(IActaOrchestrationService orchestration)
        {
            _orchestration = orchestration;
        }

        [HttpPost("batch")]
        [Authorize(Roles = "Admin")]
        [RequestSizeLimit(100_000_000)]
        public async Task<IActionResult> UploadBatch(IFormFileCollection images)
        {
            if (images == null || images.Count == 0)
                return BadRequest("No images provided");

            var result = await _orchestration.StartBatchAsync(images.ToList());
            return Accepted(result);
        }

        [HttpGet("queue")]
        public async Task<IActionResult> GetQueue(
            [FromQuery] string? queue,
            [FromQuery] string? status)
        {
            var actas = await _orchestration.GetQueueAsync(queue, status);
            return Ok(actas);
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var dashboard = await _orchestration.GetDashboardAsync();
            return Ok(dashboard);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetActa(int id)
        {
            var acta = await _orchestration.GetActaAsync(id);
            if (acta == null) return NotFound();
            return Ok(acta);
        }

        [HttpPut("{id:int}/approve")]
        public async Task<IActionResult> ApproveActa(
            int id,
            [FromBody] ApproveActaDto dto)
        {
            if (string.IsNullOrEmpty(dto.ApprovedBy))
                return BadRequest("ApprovedBy is required");

            var acta = await _orchestration.ApproveActaAsync(id, dto.ApprovedBy);
            if (acta == null) return NotFound();
            return Ok(acta);
        }

        [HttpPut("{id:int}/correct")]
        public async Task<IActionResult> CorrectField(
            int id,
            [FromBody] CorrectFieldDto dto)
        {
            if (string.IsNullOrEmpty(dto.FieldName) || string.IsNullOrEmpty(dto.NewValue))
                return BadRequest("FieldName and NewValue are required");

            var acta = await _orchestration.CorrectFieldAsync(id, dto);
            if (acta == null) return NotFound();
            return Ok(acta);
        }

        [HttpPut("{id:int}/reject")]
        [Authorize(Roles = "Admin,Capturista")]
        public async Task<IActionResult> RejectActa(int id, [FromBody] ApproveActaDto dto)
        {
            if (string.IsNullOrEmpty(dto.ApprovedBy))
                return BadRequest("RejectedBy is required");

            var acta = await _orchestration.RejectByCapturistaAsync(id, dto.ApprovedBy);
            if (acta == null) return NotFound();
            return Ok(acta);
        }

        [HttpGet("verificador-queue")]
        [Authorize(Roles = "Admin,Verificador")]
        public async Task<IActionResult> GetVerificadorQueue([FromQuery] string? status)
        {
            var actas = await _orchestration.GetVerificadorQueueAsync(status);
            return Ok(actas);
        }

        [HttpPut("{id:int}/verify-approve")]
        [Authorize(Roles = "Admin,Verificador")]
        public async Task<IActionResult> VerifyApprove(int id, [FromBody] ApproveActaDto dto)
        {
            if (string.IsNullOrEmpty(dto.ApprovedBy))
                return BadRequest("VerifiedBy is required");

            var acta = await _orchestration.VerifyApproveAsync(id, dto.ApprovedBy);
            if (acta == null) return NotFound();
            return Ok(acta);
        }

        [HttpPut("{id:int}/verify-reject")]
        [Authorize(Roles = "Admin,Verificador")]
        public async Task<IActionResult> VerifyReject(int id, [FromBody] VerifyActaDto dto)
        {
            if (string.IsNullOrEmpty(dto.VerifiedBy))
                return BadRequest("VerifiedBy is required");
            if (string.IsNullOrEmpty(dto.RejectionReason) || string.IsNullOrEmpty(dto.RejectionCategory))
                return BadRequest("RejectionReason and RejectionCategory are required");

            var acta = await _orchestration.VerifyRejectAsync(id, dto);
            if (acta == null) return NotFound();
            return Ok(acta);
        }
    }
}