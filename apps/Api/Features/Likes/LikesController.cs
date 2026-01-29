using System.Security.Claims;
using Api.Features.Likes.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Features.Likes;

[ApiController]
[Route("api/likes")]
[Authorize]
[Tags("Likes")]
public class LikesController : ControllerBase
{
    private readonly LikesService _svc;

    public LikesController(LikesService svc)
    {
        _svc = svc;
    }

    // POST /likes
    [HttpPost]
    public async Task<ActionResult<LikeResponseDto>> Like([FromBody] CreateLikeRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var result = await _svc.LikeAsync(userId, request.TargetType, request.TargetId);

        if (!result.Success && result.Message.EndsWith("not found", StringComparison.OrdinalIgnoreCase))
            return NotFound(result);

        return Ok(result);
    }

    // DELETE /likes/post/123  OR  /likes/comment/456
    [HttpDelete("{targetType}/{targetId:long}")]
    public async Task<ActionResult<LikeResponseDto>> Unlike(LikeTargetType targetType, long targetId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var result = await _svc.UnlikeAsync(userId, targetType, targetId);

        if (!result.Success && result.Message.EndsWith("not found", StringComparison.OrdinalIgnoreCase))
            return NotFound(result);

        return Ok(result);
    }

    // GET /likes/post/123  OR  /likes/comment/456
    [HttpGet("{targetType}/{targetId:long}")]
    public async Task<ActionResult<LikeDto>> GetLikeInfo(LikeTargetType targetType, long targetId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var result = await _svc.GetLikeInfoAsync(userId, targetType, targetId);
        return Ok(result);
    }
}
