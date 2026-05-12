using Microsoft.AspNetCore.Mvc;
using PrepApi.Services;
using PrepApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace PrepApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class PublicResultsController : ControllerBase
    {
        private readonly IPublicResultsService _service;

        public PublicResultsController(IPublicResultsService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetResults(
            [FromQuery] string? entity,
            [FromQuery] string? municipality,
            [FromQuery] string? section,
            [FromQuery] string? party,
            [FromQuery] string? status)
        {
            var results = await _service.GetResultsAsync(entity, municipality, section, party, status);
            return Ok(results);
        }

        [HttpGet("by-entity")]
        public async Task<IActionResult> GetByEntity()
        {
            var results = await _service.GetResultsByEntityAsync();
            return Ok(results);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var result = await _service.GetResultDetailAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }
    }
}