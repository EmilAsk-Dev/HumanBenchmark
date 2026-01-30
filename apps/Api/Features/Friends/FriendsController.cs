using System.Security.Claims;
using Api.Data;
using Api.Domain.Friends;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Features.Friends;

[ApiController]
[Route("api/friends")]
[Authorize]
[Tags("Friends")]
public class FriendsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public FriendsController(ApplicationDbContext db)
    {
        _db = db;
    }

    public record SendFriendRequestRequest(string ToUserId);

    public record FriendRequestDto(
        long Id,
        string FromUserId,
        string ToUserId,
        FriendRequestStatus Status,
        DateTime CreatedAt,
        DateTime? RespondedAt
    );

    public record FriendshipDto(string FriendUserId, DateTime CreatedAt);

    private string CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("Missing user id claim.");

    private static (string A, string B) OrderPair(string u1, string u2) =>
        string.CompareOrdinal(u1, u2) < 0 ? (u1, u2) : (u2, u1);

    [HttpPost("requests")]
    public async Task<IActionResult> SendRequest([FromBody] SendFriendRequestRequest req)
    {
        var me = CurrentUserId;

        if (string.IsNullOrWhiteSpace(req.ToUserId))
            return BadRequest("ToUserId is required.");

        if (req.ToUserId == me)
            return BadRequest("You cannot friend yourself.");

        var (a, b) = OrderPair(me, req.ToUserId);
        var alreadyFriends = await _db.Friendships.AnyAsync(f => f.UserAId == a && f.UserBId == b);
        if (alreadyFriends)
            return Conflict("You are already friends.");

        var pending = await _db.FriendRequests
            .Where(r =>
                r.Status == FriendRequestStatus.Pending &&
                ((r.FromUserId == me && r.ToUserId == req.ToUserId) ||
                 (r.FromUserId == req.ToUserId && r.ToUserId == me)))
            .FirstOrDefaultAsync();

        if (pending is not null && pending.FromUserId == req.ToUserId && pending.ToUserId == me)
        {
            pending.Status = FriendRequestStatus.Accepted;
            pending.RespondedAt = DateTime.UtcNow;

            _db.Friendships.Add(new Friendship
            {
                UserAId = a,
                UserBId = b,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
            return Ok("Auto-accepted (they had already sent you a request).");
        }

        if (pending is not null)
            return Conflict("A pending friend request already exists.");

        var fr = new FriendRequest
        {
            FromUserId = me,
            ToUserId = req.ToUserId,
            Status = FriendRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _db.FriendRequests.Add(fr);
        await _db.SaveChangesAsync();

        return Created($"/friends/requests/{fr.Id}", new FriendRequestDto(
            fr.Id, fr.FromUserId, fr.ToUserId, fr.Status, fr.CreatedAt, fr.RespondedAt
        ));
    }

    [HttpGet("requests/incoming")]
    public async Task<IActionResult> Incoming()
    {
        var me = CurrentUserId;

        var items = await _db.FriendRequests
            .Where(r => r.ToUserId == me && r.Status == FriendRequestStatus.Pending)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new FriendRequestDto(r.Id, r.FromUserId, r.ToUserId, r.Status, r.CreatedAt, r.RespondedAt))
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("requests/outgoing")]
    public async Task<IActionResult> Outgoing()
    {
        var me = CurrentUserId;

        var items = await _db.FriendRequests
            .Where(r => r.FromUserId == me && r.Status == FriendRequestStatus.Pending)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new FriendRequestDto(r.Id, r.FromUserId, r.ToUserId, r.Status, r.CreatedAt, r.RespondedAt))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost("requests/{id:long}/accept")]
    public async Task<IActionResult> Accept(long id)
    {
        var me = CurrentUserId;

        var req = await _db.FriendRequests.FirstOrDefaultAsync(r => r.Id == id);
        if (req is null) return NotFound();

        if (req.ToUserId != me) return Forbid();
        if (req.Status != FriendRequestStatus.Pending) return Conflict("Request is not pending.");

        var (a, b) = OrderPair(req.FromUserId, req.ToUserId);

        var exists = await _db.Friendships.AnyAsync(f => f.UserAId == a && f.UserBId == b);
        if (!exists)
        {
            _db.Friendships.Add(new Friendship
            {
                UserAId = a,
                UserBId = b,
                CreatedAt = DateTime.UtcNow
            });
        }

        req.Status = FriendRequestStatus.Accepted;
        req.RespondedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("requests/{id:long}/decline")]
    public async Task<IActionResult> Decline(long id)
    {
        var me = CurrentUserId;

        var req = await _db.FriendRequests.FirstOrDefaultAsync(r => r.Id == id);
        if (req is null) return NotFound();

        if (req.ToUserId != me) return Forbid();
        if (req.Status != FriendRequestStatus.Pending) return Conflict("Request is not pending.");

        req.Status = FriendRequestStatus.Declined;
        req.RespondedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("requests/{id:long}/cancel")]
    public async Task<IActionResult> Cancel(long id)
    {
        var me = CurrentUserId;

        var req = await _db.FriendRequests.FirstOrDefaultAsync(r => r.Id == id);
        if (req is null) return NotFound();

        if (req.FromUserId != me) return Forbid();
        if (req.Status != FriendRequestStatus.Pending) return Conflict("Request is not pending.");

        req.Status = FriendRequestStatus.Canceled;
        req.RespondedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpGet]
    public async Task<IActionResult> ListFriends()
    {
        var me = CurrentUserId;

        var items = await _db.Friendships
            .Where(f => f.UserAId == me || f.UserBId == me)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new FriendshipDto(
                f.UserAId == me ? f.UserBId : f.UserAId,
                f.CreatedAt
            ))
            .ToListAsync();

        return Ok(items);
    }

    [HttpDelete("{friendUserId}")]
    public async Task<IActionResult> RemoveFriend(string friendUserId)
    {
        var me = CurrentUserId;

        if (string.IsNullOrWhiteSpace(friendUserId))
            return BadRequest("friendUserId is required.");

        if (friendUserId == me)
            return BadRequest("You cannot remove yourself.");

        var (a, b) = OrderPair(me, friendUserId);

        var friendship = await _db.Friendships.FirstOrDefaultAsync(f => f.UserAId == a && f.UserBId == b);
        if (friendship is null) return NotFound();

        _db.Friendships.Remove(friendship);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
