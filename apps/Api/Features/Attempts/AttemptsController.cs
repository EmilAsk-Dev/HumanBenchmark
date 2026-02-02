using System.Security.Claims;
using Api.Features.Attempts.Dtos;
using Api.Features.Attempts.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Features.Attempts.Controllers;

[ApiController]
[Route("api/attempts")]
[Authorize]
[Tags("Attempts")]
public class AttemptsController : ControllerBase
{
    private readonly AttemptWriter _writer;

    public AttemptsController(AttemptWriter writer)
    {
        _writer = writer;
    }

    [HttpPost]
    public async Task<ActionResult<AttemptDto>> Create([FromBody] CreateAttemptRequest req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var game = (req.Game ?? "").Trim().ToLowerInvariant();

        if (game == "reaction")
        {
            if (req.Reaction == null) return BadRequest("Reaction details missing");
            return Ok(await _writer.CreateReactionAsync(userId, req.Value, req.Reaction));
        }

        if (game == "chimp")
        {
            if (req.Chimp == null) return BadRequest("Chimp details missing");
            return Ok(await _writer.CreateChimpAsync(userId, req.Value, req.Chimp));
        }

        if (game == "typing")
        {
            if (req.Typing == null) return BadRequest("Typing details missing");
            return Ok(await _writer.CreateTypingAsync(userId, req.Value, req.Typing));
        }

        if (game == "sequence")
        {
            if (req.Sequence == null) return BadRequest("Sequence details missing");
            return Ok(await _writer.CreateSequenceAsync(userId, req.Value, req.Sequence));
        }

        return BadRequest("Invalid game type");
    }
}
