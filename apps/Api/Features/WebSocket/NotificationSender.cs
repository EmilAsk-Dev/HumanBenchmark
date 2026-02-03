using Microsoft.AspNetCore.SignalR;
using Api.hubs;
using System.Security.Claims;

namespace Api.Features.WebSocket;


public record NotificationPayload(
    string Type,
    string Title,
    string Message,
    object? Data = null,
    DateTime? CreatedAt = null
);

public class NotificationSender
{
    private readonly IHubContext<NotificationsHub> _hub;

    public NotificationSender(IHubContext<NotificationsHub> hub) => _hub = hub;

    public Task SendToUserAsync(string userId, NotificationPayload payload)
        => _hub.Clients.User(userId).SendAsync("Notification", payload with { CreatedAt = DateTime.UtcNow });

    public Task SendPresenceAsync(string userId, bool isOnline)
        => _hub.Clients.All.SendAsync("PresenceChanged", userId, isOnline);
}



public class NameIdUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
        => connection.User?.FindFirstValue(ClaimTypes.NameIdentifier);
}
