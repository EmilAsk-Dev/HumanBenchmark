using System.Security.Claims;
using Api.Features.Likes.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Features.Likes;

[ApiController]
[Route("likes")]
[Authorize]
[Tags("Likes")]
public class LikesController : ControllerBase
{
    private readonly LikesService _svc;

    public LikesController(LikesService svc)
    {
        _svc = svc;
    }

    [HttpPost]
    public async Task<ActionResult<LikeResponseDto>> LikeAttempt([FromBody] CreateLikeRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var result = await _svc.LikeAttemptAsync(userId, request.AttemptId);

        if (!result.Success && result.Message == "Attempt not found")
            return NotFound(result);

        return Ok(result);
    }

    [HttpDelete("{attemptId}")]
    public async Task<ActionResult<LikeResponseDto>> UnlikeAttempt(long attemptId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var result = await _svc.UnlikeAttemptAsync(userId, attemptId);

        if (!result.Success && result.Message == "Like not found")
            return NotFound(result);

        return Ok(result);
    }

    [HttpGet("{attemptId}")]
    public async Task<ActionResult<LikeDto>> GetLikeInfo(long attemptId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var result = await _svc.GetLikeInfoAsync(userId, attemptId);
        return Ok(result);
    }
}
