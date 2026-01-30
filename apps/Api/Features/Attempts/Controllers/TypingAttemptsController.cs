using System.Security.Claims;
using Api.Features.Attempts.Dtos;
using Api.Features.Attempts.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Features.Attempts.Controllers;

[ApiController]
[Route("api/attempts/typing")]
[Authorize]
[Tags("Attempts")]
public class TypingAttemptsController : ControllerBase
{
    private readonly AttemptWriter _writer;

    public TypingAttemptsController(AttemptWriter writer)
    {
        _writer = writer;
    }

    [HttpPost]
    public async Task<ActionResult<AttemptDto>> Create(CreateTypingAttemptRequest req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var created = await _writer.CreateTypingAsync(userId, req);
        return Ok(created);
    }
}
