using Api.Features.Moderation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Features.Comments;

[ApiController]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly CommentService _comments;
    private readonly ILogger<CommentsController> _logger;

    public CommentsController(CommentService comments, ILogger<CommentsController> logger)
    {
        _comments = comments;
        _logger = logger;
    }

    private string Me => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet("api/posts/{postId}/comments")]
    [Tags("Comments")]
    public Task<List<CommentDto>> Get(
        long postId,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 20)
    {
        _logger.LogDebug("Get comments for post {PostId} - skip: {Skip}, take: {Take}", postId, skip, take);
        return _comments.GetForPostAsync(postId, Me, skip, take);
    }

    [HttpPost("api/posts/{postId}/comments")]
    [Tags("Comments")]
    public async Task<ActionResult<CommentDto>> Add(long postId, [FromBody] CreateCommentRequest req)
    {
        try
        {
            var created = await _comments.AddAsync(postId, Me, req);
            if (created is null) return NotFound();
            return Ok(created);
        }
        catch (ModerationException ex)
        {
            return BadRequest(new { error = "Content rejected by moderation", reason = ex.Reason });
        }
    }

    [HttpDelete("api/posts/{postId}/comments/{commentId}")]
    [Tags("Comments")]
    public async Task<IActionResult> Delete(long postId, long commentId)
    {
        _logger.LogDebug("Delete comment {CommentId} from post {PostId}", commentId, postId);

        await _comments.DeleteAsync(commentId, Me);

        _logger.LogInformation("User {UserId} deleted comment {CommentId}", Me, commentId);
        return NoContent();
    }
}
