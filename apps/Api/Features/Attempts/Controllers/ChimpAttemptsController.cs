using System.Security.Claims;
using Api.Features.Attempts.Dtos;
using Api.Features.Attempts.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Features.Attempts.Controllers;

[ApiController]
[Route("api/attempts/chimp")]
[Authorize]
[Tags("Attempts")]
public class ChimpAttemptsController : ControllerBase
{
    private readonly AttemptWriter _writer;

    public ChimpAttemptsController(AttemptWriter writer)
    {
        _writer = writer;
    }

    [HttpPost]
    public async Task<ActionResult<AttemptDto>> Create(CreateChimpAttemptRequest req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var created = await _writer.CreateChimpAsync(userId, req);
        return Ok(created);
    }
}
