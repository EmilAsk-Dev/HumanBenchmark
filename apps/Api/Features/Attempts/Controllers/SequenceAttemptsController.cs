using System.Security.Claims;
using Api.Features.Attempts.Dtos;
using Api.Features.Attempts.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Features.Attempts.Controllers;

[ApiController]
[Route("attempts/sequence")]
[Authorize]
[Tags("Attempts")]
public class SequenceAttemptsController : ControllerBase
{
    private readonly AttemptWriter _writer;

    public SequenceAttemptsController(AttemptWriter writer)
    {
        _writer = writer;
    }

    [HttpPost]
    public async Task<ActionResult<AttemptDto>> Create(CreateSequenceAttemptRequest req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var created = await _writer.CreateSequenceAsync(userId, req);
        return Ok(created);
    }
}
