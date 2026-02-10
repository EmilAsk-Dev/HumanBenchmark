using System.Collections.Concurrent;
using Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
namespace Api.hubs;
[Authorize]
public class NotificationsHub : Hub
{
    private static readonly ConcurrentDictionary<string, int> _online = new();
    private readonly ApplicationDbContext _db;

    public NotificationsHub(ApplicationDbContext db)
    {
        _db = db;
    }

    private async Task<string[]> GetFriendIdsAsync(string userId)
    {
        return await _db.Friendships
            .AsNoTracking()
            .Where(f => f.UserAId == userId || f.UserBId == userId)
            .Select(f => f.UserAId == userId ? f.UserBId : f.UserAId)
            .Distinct()
            .ToArrayAsync();
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            var count = _online.AddOrUpdate(userId, 1, (_, c) => c + 1);
            if (count == 1)
            {
                // Only broadcast presence to friends (privacy)
                var friendIds = await GetFriendIdsAsync(userId);
                if (friendIds.Length > 0)
                    await Clients.Users(friendIds).SendAsync("PresenceChanged", userId, true);
            }
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId) && _online.TryGetValue(userId, out var count))
        {
            if (count <= 1)
            {
                _online.TryRemove(userId, out _);
                // Only broadcast presence to friends (privacy)
                var friendIds = await GetFriendIdsAsync(userId);
                if (friendIds.Length > 0)
                    await Clients.Users(friendIds).SendAsync("PresenceChanged", userId, false);
            }
            else
            {
                _online[userId] = count - 1;
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    public static bool IsUserOnline(string userId) => _online.ContainsKey(userId);

    public async Task<string[]> GetOnlineUsers()
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrWhiteSpace(userId))
            return Array.Empty<string>();

        var friendIds = await GetFriendIdsAsync(userId);
        if (friendIds.Length == 0)
            return Array.Empty<string>();

        return friendIds.Where(IsUserOnline).ToArray();
    }
}


public interface IPresenceTracker
{
    bool IsOnline(string userId);
    IReadOnlyCollection<string> OnlineUsers();
}

public class PresenceTracker : IPresenceTracker
{
    public bool IsOnline(string userId) => NotificationsHub.IsUserOnline(userId);
    public IReadOnlyCollection<string> OnlineUsers() => NotificationsHubOnlineUsers();
    private static IReadOnlyCollection<string> NotificationsHubOnlineUsers()
        => typeof(NotificationsHub)
           .GetField("_online", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static)!
           .GetValue(null) is ConcurrentDictionary<string, int> dict
              ? dict.Keys.ToArray()
              : Array.Empty<string>();
}
