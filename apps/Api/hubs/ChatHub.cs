// Api/hubs/ChatHub.cs
namespace Api.hubs;

using Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

[Authorize]
public class ChatHub : Hub
{
    private readonly ILogger<ChatHub> _logger;
    private readonly ApplicationDbContext _db;

    public ChatHub(ILogger<ChatHub> logger, ApplicationDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    private static (string A, string B) Normalize(string u1, string u2)
        => string.CompareOrdinal(u1, u2) < 0 ? (u1, u2) : (u2, u1);

    private string Me =>
        Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? Context.UserIdentifier
        ?? throw new HubException("Not authenticated");

    private async Task EnsureConversationAccessAsync(long conversationId)
    {
        var me = Me;

        var convo = await _db.Conversations
            .AsNoTracking()
            .Where(c => c.Id == conversationId)
            .Select(c => new { c.UserAId, c.UserBId })
            .FirstOrDefaultAsync();

        if (convo is null)
            throw new HubException("Conversation not found");

        if (convo.UserAId != me && convo.UserBId != me)
            throw new HubException("Forbidden");

        var (a, b) = Normalize(convo.UserAId, convo.UserBId);
        var areFriends = await _db.Friendships
            .AsNoTracking()
            .AnyAsync(f => f.UserAId == a && f.UserBId == b);

        if (!areFriends)
            throw new HubException("Forbidden");
    }

    public async Task JoinConversation(long conversationId)
    {
        await EnsureConversationAccessAsync(conversationId);

        var groupName = $"conv:{conversationId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation("Connection {ConnId} joined {Group}", Context.ConnectionId, groupName);

        await Clients.Caller.SendAsync("JoinedConversation", new { conversationId, group = groupName });
    }

    public async Task LeaveConversation(long conversationId)
    {
        await EnsureConversationAccessAsync(conversationId);

        var groupName = $"conv:{conversationId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation("Connection {ConnId} left {Group}", Context.ConnectionId, groupName);

        await Clients.Caller.SendAsync("LeftConversation", new { conversationId, group = groupName });
    }

    public async Task PingConversation(long conversationId, string text)
    {
        await EnsureConversationAccessAsync(conversationId);
        await Clients.Group($"conv:{conversationId}").SendAsync("ConversationPing", new { conversationId, text });
    }
}
