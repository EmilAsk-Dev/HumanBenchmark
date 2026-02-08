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
    private readonly ILogger<LikesController> _logger;

    public LikesController(LikesService svc, ILogger<LikesController> logger)
    {
        _svc = svc;
        _logger = logger;
    }

    // POST /likes
    [HttpPost]
    public async Task<ActionResult<LikeResponseDto>> Like([FromBody] CreateLikeRequest request)
    {
        _logger.LogDebug("Like request received - TargetType: {TargetType}, TargetId: {TargetId}",
            request.TargetType, request.TargetId);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            _logger.LogWarning("Unauthorized like attempt - no user ID in token");
            return Unauthorized();
        }

        var result = await _svc.LikeAsync(userId, request.TargetType, request.TargetId);

        if (!result.Success && result.Message.EndsWith("not found", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Like failed - {TargetType} with ID {TargetId} not found",
                request.TargetType, request.TargetId);
            return NotFound(result);
        }

        _logger.LogInformation("User {UserId} liked {TargetType} {TargetId}",
            userId, request.TargetType, request.TargetId);
        return Ok(result);
    }

    // DELETE /likes/post/123  OR  /likes/comment/456
    [HttpDelete("{targetType}/{targetId:long}")]
    public async Task<ActionResult<LikeResponseDto>> Unlike(LikeTargetType targetType, long targetId)
    {
        _logger.LogDebug("Unlike request received - TargetType: {TargetType}, TargetId: {TargetId}",
            targetType, targetId);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            _logger.LogWarning("Unauthorized unlike attempt - no user ID in token");
            return Unauthorized();
        }

        var result = await _svc.UnlikeAsync(userId, targetType, targetId);

        if (!result.Success && result.Message.EndsWith("not found", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Unlike failed - {TargetType} with ID {TargetId} not found",
                targetType, targetId);
            return NotFound(result);
        }

        _logger.LogInformation("User {UserId} unliked {TargetType} {TargetId}",
            userId, targetType, targetId);
        return Ok(result);
    }

    // GET /likes/post/123  OR  /likes/comment/456
    [HttpGet("{targetType}/{targetId:long}")]
    public async Task<ActionResult<LikeDto>> GetLikeInfo(LikeTargetType targetType, long targetId)
    {
        _logger.LogDebug("GetLikeInfo request - TargetType: {TargetType}, TargetId: {TargetId}",
            targetType, targetId);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            _logger.LogWarning("Unauthorized GetLikeInfo attempt - no user ID in token");
            return Unauthorized();
        }

        var result = await _svc.GetLikeInfoAsync(userId, targetType, targetId);
        return Ok(result);
    }
}
