// Api/Hubs/NotificationsHub.cs
using System.Collections.Concurrent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Api.hubs;

public interface IPresenceTracker
{
    int UserConnected(string userId);
    int UserDisconnected(string userId);
    bool IsOnline(string userId);
    IReadOnlyCollection<string> OnlineUsers();
}

public class PresenceTracker : IPresenceTracker
{
    private readonly ConcurrentDictionary<string, int> _online = new();

    public int UserConnected(string userId)
        => _online.AddOrUpdate(userId, 1, (_, c) => c + 1);

    public int UserDisconnected(string userId)
    {
        if (!_online.TryGetValue(userId, out var count)) return 0;

        if (count <= 1)
        {
            _online.TryRemove(userId, out _);
            return 0;
        }

        _online[userId] = count - 1;
        return _online[userId];
    }

    public bool IsOnline(string userId) => _online.ContainsKey(userId);

    public IReadOnlyCollection<string> OnlineUsers() => _online.Keys.ToArray();
}

[Authorize]
public class NotificationsHub : Hub
{
    private readonly IPresenceTracker _presence;

    public NotificationsHub(IPresenceTracker presence)
    {
        _presence = presence;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            var count = _presence.UserConnected(userId);
            if (count == 1)
                await Clients.All.SendAsync("PresenceChanged", userId, true);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            var count = _presence.UserDisconnected(userId);
            if (count == 0)
                await Clients.All.SendAsync("PresenceChanged", userId, false);
        }

        await base.OnDisconnectedAsync(exception);
    }

    public Task<string[]> GetOnlineUsers()
        => Task.FromResult(_presence.OnlineUsers().ToArray());
}
