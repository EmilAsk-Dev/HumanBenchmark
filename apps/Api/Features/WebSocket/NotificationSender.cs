using Microsoft.AspNetCore.SignalR;
using Api.hubs;
namespace Api.Features.WebSocket;

public class NotificationSender
{
    private readonly IHubContext<NotificationsHub> _hub;

    public NotificationSender(IHubContext<NotificationsHub> hub) => _hub = hub;

    public Task SendToUserAsync(string userId, object payload)
        => _hub.Clients.User(userId).SendAsync("Notification", payload);
}
