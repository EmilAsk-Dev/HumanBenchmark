using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Api.Features.Friends.Dtos;

namespace Api.Features.Friends;

[ApiController]
[Authorize]
[Route("api/friends")]
public class FriendsController : ControllerBase
{
    private readonly FriendsService _service;
    private readonly ILogger<FriendsController> _logger;

    public FriendsController(FriendsService service, ILogger<FriendsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    private string Me =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new Exception("Missing user id");

    [HttpGet]
    public async Task<IActionResult> GetFriends()
    {
        _logger.LogDebug("GetFriends for user {UserId}", Me);
        return Ok(await _service.GetFriendsAsync(Me));
    }

    [HttpPost("requests")]
    public async Task<IActionResult> SendRequest([FromBody] SendFriendRequestRequest req)
    {
        _logger.LogDebug("SendRequest from {UserId} to {ToUserId}", Me, req.ToUserId);
        await _service.SendRequestAsync(Me, req.ToUserId);
        _logger.LogInformation("User {UserId} sent friend request to {ToUserId}", Me, req.ToUserId);
        return Ok();
    }

    [HttpGet("requests/outgoing")]
    public async Task<IActionResult> GetOutgoingRequests()
    {
        _logger.LogDebug("GetOutgoingRequests for user {UserId}", Me);
        return Ok(await _service.GetOutgoingRequestsAsync(Me));
    }

    [HttpGet("requests")]
    public async Task<IActionResult> GetRequests()
    {
        _logger.LogDebug("GetRequests for user {UserId}", Me);
        return Ok(await _service.GetRequestsAsync(Me));
    }

    [HttpPost("requests/{id:long}")]
    public async Task<IActionResult> Respond(long id, [FromBody] RespondFriendRequestRequest req)
    {
        _logger.LogDebug("Respond to request {RequestId} - Accept: {Accept}", id, req.Accept);
        await _service.RespondToRequestAsync(Me, id, req.Accept);
        _logger.LogInformation("User {UserId} {Action} friend request {RequestId}",
            Me, req.Accept ? "accepted" : "rejected", id);
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> RemoveFriend(string id)
    {
        _logger.LogDebug("RemoveFriend {FriendId} for user {UserId}", id, Me);
        await _service.RemoveFriendAsync(Me, id);
        _logger.LogInformation("User {UserId} removed friend {FriendId}", Me, id);
        return NoContent();
    }
}
