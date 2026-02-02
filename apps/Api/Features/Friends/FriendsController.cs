using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Api.Features.Friends.Dtos;

namespace Api.Features.Friends;

[ApiController]
[Authorize]
[Route("friends")]
public class FriendsController : ControllerBase
{
    private readonly FriendsService _service;

    public FriendsController(FriendsService service)
    {
        _service = service;
    }

    private string Me =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new Exception("Missing user id");

    [HttpGet]
    public async Task<IActionResult> GetFriends()
    {
        return Ok(await _service.GetFriendsAsync(Me));
    }

    [HttpGet("requests")]
    public async Task<IActionResult> GetRequests()
    {
        return Ok(await _service.GetRequestsAsync(Me));
    }

    [HttpPost("requests")]
    public async Task<IActionResult> SendRequest([FromBody] SendFriendRequestRequest req)
    {
        await _service.SendRequestAsync(Me, req.ToUserId);
        return Ok();
    }

    [HttpPost("requests/{id:long}")]
    public async Task<IActionResult> Respond(long id, [FromBody] RespondFriendRequestRequest req)
    {
        await _service.RespondToRequestAsync(Me, id, req.Accept);
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> RemoveFriend(string id)
    {
        await _service.RemoveFriendAsync(Me, id);
        return NoContent();
    }
}
