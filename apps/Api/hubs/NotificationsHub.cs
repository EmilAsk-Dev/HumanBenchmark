using System.Collections.Concurrent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
namespace Api.hubs;
[Authorize]
public class NotificationsHub : Hub
{
    private static readonly ConcurrentDictionary<string, int> _online = new();

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            var count = _online.AddOrUpdate(userId, 1, (_, c) => c + 1);
            if (count == 1)
            {
                await Clients.All.SendAsync("PresenceChanged", userId, true);
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
                await Clients.All.SendAsync("PresenceChanged", userId, false);
            }
            else
            {
                _online[userId] = count - 1;
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    public static bool IsUserOnline(string userId) => _online.ContainsKey(userId);

    public Task<string[]> GetOnlineUsers() => Task.FromResult(_online.Keys.ToArray());
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