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

    public PostsController(PostsService svc)
    {
        _svc = svc;
    }

    [HttpPost]
    public async Task<ActionResult<PostDto>> CreatePost([FromBody] CreatePostRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

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

    [HttpGet("{postId}")]
    public async Task<ActionResult<GetPostResponse>> GetPost(long postId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var post = await _svc.GetPostByIdAsync(postId, userId);

        if (post == null)
            return NotFound();

        return Ok(new GetPostResponse(post));
    }
}
