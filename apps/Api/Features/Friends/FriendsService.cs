using Api.Data;
using Api.Domain.Friends;
using Api.Domain.Message;
using Microsoft.EntityFrameworkCore;
using Api.Features.Friends.Dtos;
using Api.Features.WebSocket;


namespace Api.Features.Friends;

public class FriendsService
{
    private readonly ApplicationDbContext _db;
    private readonly NotificationSender _notifications;

    public FriendsService(ApplicationDbContext db, NotificationSender notifications)
    {
        _db = db;
        _notifications = notifications;
    }


    private static (string A, string B) OrderPair(string u1, string u2) =>
        string.CompareOrdinal(u1, u2) < 0 ? (u1, u2) : (u2, u1);

    public async Task<List<FriendListItemDto>> GetFriendsAsync(string me)
    {
        var friendUserIds = await _db.Friendships
            .Where(f => f.UserAId == me || f.UserBId == me)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new
            {
                FriendId = f.UserAId == me ? f.UserBId : f.UserAId,
                f.CreatedAt
            })
            .ToListAsync();

        var ids = friendUserIds.Select(x => x.FriendId).Distinct().ToList();

        var users = await _db.Users
            .Where(u => ids.Contains(u.Id))
            .Select(u => new FriendDto(
                u.Id,
                u.UserName!,
                u.AvatarUrl
            ))
            .ToListAsync();

        var userMap = users.ToDictionary(u => u.Id, u => u);

        return friendUserIds
            .Where(x => userMap.ContainsKey(x.FriendId))
            .Select(x => new FriendListItemDto(
                userMap[x.FriendId],
                x.CreatedAt
            ))
            .ToList();
    }

    public async Task<List<FriendRequestDto>> GetRequestsAsync(string me)
    {
        var reqs = await _db.FriendRequests
            .Where(r => r.Status == FriendRequestStatus.Pending && r.ToUserId == me)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                Status = r.Status.ToString(),
                r.CreatedAt,
                r.RespondedAt,
                r.FromUserId,
                r.ToUserId
            })
            .ToListAsync();

        var userIds = reqs.SelectMany(r => new[] { r.FromUserId, r.ToUserId }).Distinct().ToList();

        var users = await _db.Users
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new FriendDto(u.Id, u.UserName!, u.AvatarUrl))
            .ToListAsync();

        var map = users.ToDictionary(u => u.Id, u => u);

        return reqs
            .Where(r => map.ContainsKey(r.FromUserId) && map.ContainsKey(r.ToUserId))
            .Select(r => new FriendRequestDto(
                r.Id,
                r.Status,
                r.CreatedAt,
                r.RespondedAt,
                map[r.FromUserId],
                map[r.ToUserId]
            ))
            .ToList();
    }

    public async Task<List<FriendRequestDto>> GetOutgoingRequestsAsync(string me)
    {
        var reqs = await _db.FriendRequests
            .Where(r => r.Status == FriendRequestStatus.Pending && r.FromUserId == me)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                Status = r.Status.ToString(),
                r.CreatedAt,
                r.RespondedAt,
                r.FromUserId,
                r.ToUserId
            })
            .ToListAsync();

        var userIds = reqs.SelectMany(r => new[] { r.FromUserId, r.ToUserId }).Distinct().ToList();

        var users = await _db.Users
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new FriendDto(u.Id, u.UserName!, u.AvatarUrl))
            .ToListAsync();

        var map = users.ToDictionary(u => u.Id, u => u);

        return reqs
            .Where(r => map.ContainsKey(r.FromUserId) && map.ContainsKey(r.ToUserId))
            .Select(r => new FriendRequestDto(
                r.Id,
                r.Status,
                r.CreatedAt,
                r.RespondedAt,
                map[r.FromUserId],
                map[r.ToUserId]
            ))
            .ToList();
    }

    public async Task SendRequestAsync(string me, string toUserId)
    {
        if (toUserId == me)
            throw new Exception("You cannot friend yourself.");

        var (a, b) = OrderPair(me, toUserId);

        var alreadyFriends = await _db.Friendships
            .AnyAsync(f => f.UserAId == a && f.UserBId == b);

        if (alreadyFriends)
            throw new Exception("Already friends.");

        var pending = await _db.FriendRequests
            .AnyAsync(r =>
                r.Status == FriendRequestStatus.Pending &&
                ((r.FromUserId == me && r.ToUserId == toUserId) ||
                 (r.FromUserId == toUserId && r.ToUserId == me)));

        if (pending)
            throw new Exception("Friend request already exists.");

        _db.FriendRequests.Add(new FriendRequest
        {
            FromUserId = me,
            ToUserId = toUserId,
            Status = FriendRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        await _notifications.SendToUserAsync(toUserId, new
{
    type = "friend_request",
    title = "Ny vänförfrågan",
    message = "Du har fått en ny vänförfrågan",
    fromUserId = me,
    time = DateTime.UtcNow.ToString("s")
});

    }

    public async Task RespondToRequestAsync(string me, long requestId, bool accept)
    {
        var req = await _db.FriendRequests.FirstOrDefaultAsync(r => r.Id == requestId);

        if (req == null)
            throw new Exception("Request not found.");

        if (req.ToUserId != me)
            throw new Exception("Not allowed.");

        if (req.Status != FriendRequestStatus.Pending)
            throw new Exception("Request not pending.");

        req.RespondedAt = DateTime.UtcNow;

        if (accept)
        {
            req.Status = FriendRequestStatus.Accepted;

            var (a, b) = OrderPair(req.FromUserId, req.ToUserId);

            _db.Friendships.Add(new Friendship
            {
                UserAId = a,
                UserBId = b,
                CreatedAt = DateTime.UtcNow
            });

            // Ensure a conversation exists immediately after becoming friends
            // so the chat UI can join a stable conversation/group before the first message.
            var convoExists = await _db.Conversations
                .AnyAsync(c => c.UserAId == a && c.UserBId == b);

            if (!convoExists)
            {
                _db.Conversations.Add(new Conversation
                {
                    UserAId = a,
                    UserBId = b,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }
        else
        {
            req.Status = FriendRequestStatus.Declined;
        }

        await _db.SaveChangesAsync();
    }

    public async Task RemoveFriendAsync(string me, string friendId)
    {
        var (a, b) = OrderPair(me, friendId);

        var friendship = await _db.Friendships
            .FirstOrDefaultAsync(f => f.UserAId == a && f.UserBId == b);

        if (friendship == null)
            throw new Exception("Friendship not found.");

        _db.Friendships.Remove(friendship);
        await _db.SaveChangesAsync();
    }
}
