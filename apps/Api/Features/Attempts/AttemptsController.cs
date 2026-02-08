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
    private readonly ILogger<AttemptsController> _logger;

    public AttemptsController(AttemptWriter writer, ILogger<AttemptsController> logger)
    {
        _writer = writer;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<AttemptDto>> Create([FromBody] CreateAttemptRequest req)
    {
        _logger.LogDebug("Create attempt - Game: {Game}, Value: {Value}", req.Game, req.Value);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            _logger.LogWarning("Unauthorized attempt creation - no user ID in token");
            return Unauthorized();
        }

        var game = (req.Game ?? "").Trim().ToLowerInvariant();

        if (game == "reaction")
        {
            if (req.Reaction == null) return BadRequest("Reaction details missing");
            var result = await _writer.CreateReactionAsync(userId, req.Value, req.Reaction);
            _logger.LogInformation("User {UserId} created reaction attempt with value {Value}", userId, req.Value);
            return Ok(result);
        }

        if (game == "chimp")
        {
            if (req.Chimp == null) return BadRequest("Chimp details missing");
            var result = await _writer.CreateChimpAsync(userId, req.Value, req.Chimp);
            _logger.LogInformation("User {UserId} created chimp attempt with value {Value}", userId, req.Value);
            return Ok(result);
        }

        if (game == "typing")
        {
            if (req.Typing == null) return BadRequest("Typing details missing");
            var result = await _writer.CreateTypingAsync(userId, req.Value, req.Typing);
            _logger.LogInformation("User {UserId} created typing attempt with value {Value}", userId, req.Value);
            return Ok(result);
        }

        if (game == "sequence")
        {
            if (req.Sequence == null) return BadRequest("Sequence details missing");
            var result = await _writer.CreateSequenceAsync(userId, req.Value, req.Sequence);
            _logger.LogInformation("User {UserId} created sequence attempt with value {Value}", userId, req.Value);
            return Ok(result);
        }

        _logger.LogWarning("Invalid game type: {Game}", req.Game);
        return BadRequest("Invalid game type");
    }
}
