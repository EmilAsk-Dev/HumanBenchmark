using System.Security.Claims;
using Api.Features.Attempts.Dtos;
using Api.Features.Attempts.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Features.Attempts.Controllers;

[ApiController]
[Route("attempts/reaction")]
[Authorize]
[Tags("Attempts")]
public class ReactionAttemptsController : ControllerBase
{
    private readonly AttemptWriter _writer;

    public ReactionAttemptsController(AttemptWriter writer)
    {
        _writer = writer;
    }

    [HttpPost]
    public async Task<ActionResult<AttemptDto>> Create(CreateReactionAttemptRequest req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var created = await _writer.CreateReactionAsync(userId, req);
        return Ok(created);
    }
}
