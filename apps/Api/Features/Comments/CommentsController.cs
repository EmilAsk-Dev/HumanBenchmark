using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Api.Features.Comments;

[ApiController]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly CommentService _comments;

    public CommentsController(CommentService comments)
    {
        _comments = comments;
    }

    private string Me => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet("posts/{postId}/comments")]
    [Tags("Comments")]
    public Task<List<CommentDto>> Get(
        long postId,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 20)
        => _comments.GetForPostAsync(postId, Me, skip, take);

    [HttpPost("posts/{postId}/comments")]
    [Tags("Comments")]
    public async Task<ActionResult<CommentDto>> Add(
        long postId,
        [FromBody] CreateCommentRequest req)
    {
        var created = await _comments.AddAsync(postId, Me, req);
        if (created is null) return NotFound();
        return Ok(created);
    }

    [HttpDelete("posts/{postId}/comments/{commentId}")]
    [Tags("Comments")]
    public async Task<IActionResult> Delete(long postId, long commentId)
    {
        await _comments.DeleteAsync(commentId, Me);
        return NoContent();
    }

    [HttpPost("posts/{postId}/comments/{commentId}/like")]
    [Tags("Comments")]
    public async Task<IActionResult> ToggleLike(long postId, long commentId)
    {
        var (likeCount, isLiked) = await _comments.ToggleLikeAsync(commentId, Me);
        return Ok(new { likeCount, isLiked });
    }
}