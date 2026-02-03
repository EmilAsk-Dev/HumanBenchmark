// Api/hubs/ChatHub.cs
namespace Api.hubs;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

[Authorize]
public class ChatHub : Hub
{
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(ILogger<ChatHub> logger)
    {
        _logger = logger;
    }

    public async Task JoinConversation(long conversationId)
    {
        var groupName = $"conv:{conversationId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation("Connection {ConnId} joined {Group}", Context.ConnectionId, groupName);

        await Clients.Caller.SendAsync("JoinedConversation", new { conversationId, group = groupName });
    }

    public async Task LeaveConversation(long conversationId)
    {
        var groupName = $"conv:{conversationId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation("Connection {ConnId} left {Group}", Context.ConnectionId, groupName);

        await Clients.Caller.SendAsync("LeftConversation", new { conversationId, group = groupName });
    }

    public Task PingConversation(long conversationId, string text) =>
        Clients.Group($"conv:{conversationId}").SendAsync("ConversationPing", new { conversationId, text });
}
