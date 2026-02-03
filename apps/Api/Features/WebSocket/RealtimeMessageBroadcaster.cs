// Api/Features/WebSocket/RealtimeMessageBroadcaster.cs
namespace Api.Features.WebSocket;

using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Api.Data;
using Api.Domain.Message;
using Api.Features.Messages.Dtos;
using Api.hubs;

public class RealtimeMessageBroadcaster
{
    private readonly ApplicationDbContext _db;
    private readonly IHubContext<ChatHub> _hub;
    private readonly ILogger<RealtimeMessageBroadcaster> _logger;

    public RealtimeMessageBroadcaster(
        ApplicationDbContext db,
        IHubContext<ChatHub> hub,
        ILogger<RealtimeMessageBroadcaster> logger)
    {
        _db = db;
        _hub = hub;
        _logger = logger;
    }

    public async Task<MessageDto> SendAsync(long conversationId, string senderId, string content)
    {
        _logger.LogInformation("Broadcast SendAsync called for conv:{ConvId} sender:{Sender}", conversationId, senderId);

        var msg = new Message
        {
            ConversationId = conversationId,
            SenderId = senderId,
            Content = content,
            SentAt = DateTime.UtcNow
        };

        _db.Messages.Add(msg);
        await _db.SaveChangesAsync();

        var dto = new MessageDto
        {
            Id = msg.Id,
            SenderId = msg.SenderId,
            Content = msg.Content,
            SentAt = msg.SentAt
        };

        _logger.LogInformation("Sending MessageCreated to group conv:{ConvId}", conversationId);

        await _hub.Clients.Group($"conv:{conversationId}")
            .SendAsync("MessageCreated", dto);

        return dto;
    }
}
