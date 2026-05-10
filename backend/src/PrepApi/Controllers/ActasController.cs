using Microsoft.AspNetCore.Mvc;
using PrepApi.DTOs;
using PrepApi.Services;
using PrepApi.Services.Interfaces;

namespace PrepApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ActasController : ControllerBase
    {
        private readonly IActaOrchestrationService _orchestration;

        public ActasController(IActaOrchestrationService orchestration)
        {
            _orchestration = orchestration;
        }

        [HttpPost("batch")]
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
        public async Task<IActionResult> RejectActa(
            int id,
            [FromBody] ApproveActaDto dto)
        {
            if (string.IsNullOrEmpty(dto.ApprovedBy))
                return BadRequest("RejectedBy is required");

            var acta = await _orchestration.RejectActaAsync(id, dto.ApprovedBy);
            if (acta == null) return NotFound();
            return Ok(acta);
        }
    }
}