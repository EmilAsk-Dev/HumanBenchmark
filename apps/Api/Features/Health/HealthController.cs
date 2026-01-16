using Microsoft.AspNetCore.Mvc;
using Api.Features.Health.Dtos;

namespace Api.Features.Health;

[ApiController]
[Route("health")]
[Tags("Health")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new HealthDto("healthy"));
    }
}
