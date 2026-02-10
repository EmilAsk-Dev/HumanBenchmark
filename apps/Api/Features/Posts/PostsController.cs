using System.Security.Claims;
using Api.Features.Moderation;
using Api.Features.Posts.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Features.Posts;

[ApiController]
[Route("api/posts")]
[Authorize]
[Tags("Posts")]
public class PostsController : ControllerBase
{
    private readonly PostsService _svc;
    private readonly ILogger<PostsController> _logger;

    public PostsController(PostsService svc, ILogger<PostsController> logger)
    {
        _svc = svc;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<PostDto>> CreatePost([FromBody] CreatePostRequest request)
    {
        _logger.LogDebug("CreatePost request - AttemptId: {AttemptId}", request.AttemptId);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            _logger.LogWarning("Unauthorized CreatePost attempt - no user ID in token");
            return Unauthorized();
        }

        try
        {
            var post = await _svc.CreatePostAsync(userId, request);

            if (post == null)
                return BadRequest("Unable to create post. Attempt not found or already posted.");

            return Ok(post);
        }
        catch (ModerationException ex)
        {
            return BadRequest(new { error = "Content rejected by moderation", reason = ex.Reason });
        }
    }

    [HttpPut("{postId}")]
    public async Task<ActionResult<PostDto>> UpdatePost(long postId, [FromBody] UpdatePostRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        try
        {
            var updated = await _svc.UpdateCaptionAsync(postId, userId, request.Caption);
            if (updated == null)
                return NotFound();

            return Ok(updated);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (ModerationException ex)
        {
            return BadRequest(new { error = "Content rejected by moderation", reason = ex.Reason });
        }
    }

    [HttpDelete("{postId}")]
    public async Task<IActionResult> DeletePost(long postId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var isAdmin = User.IsInRole("Admin");

        try
        {
            var deleted = await _svc.DeletePostAsync(postId, userId, isAdmin);
            if (!deleted)
                return NotFound();

            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpGet("{postId}")]
    public async Task<ActionResult<GetPostResponse>> GetPost(long postId)
    {
        _logger.LogDebug("GetPost request - PostId: {PostId}", postId);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            _logger.LogWarning("Unauthorized GetPost attempt - no user ID in token");
            return Unauthorized();
        }

        var post = await _svc.GetPostByIdAsync(postId, userId);

        if (post == null)
        {
            _logger.LogDebug("Post {PostId} not found", postId);
            return NotFound();
        }

        return Ok(new GetPostResponse(post));
    }

}
