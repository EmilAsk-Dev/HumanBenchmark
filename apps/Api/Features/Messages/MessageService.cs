// Api/Features/Messages/MessageService.cs
using Api.Data;
using Api.Domain.Message;
using Api.Features.Messages.Dtos;
using Api.Features.WebSocket; // ✅ add
using Microsoft.EntityFrameworkCore;

namespace Api.Features.Messages;

public class MessageService
{
    private readonly ApplicationDbContext _db;
    private readonly RealtimeMessageBroadcaster _realtime;

    public MessageService(ApplicationDbContext db, RealtimeMessageBroadcaster realtime)
    {
        _db = db;
        _realtime = realtime;
    }

    private static (string A, string B) Normalize(string u1, string u2)
        => string.CompareOrdinal(u1, u2) < 0 ? (u1, u2) : (u2, u1);

    public async Task<List<ConversationDto>> GetConversationsAsync(string me)
    {
        return await _db.Conversations
            .Where(c => c.UserAId == me || c.UserBId == me)
            .Select(c => new
            {
                c.Id,
                FriendId = c.UserAId == me ? c.UserBId : c.UserAId,
                LastMessageAt = c.Messages
                    .OrderByDescending(m => m.SentAt)
                    .Select(m => (DateTime?)m.SentAt)
                    .FirstOrDefault()
            })
            .Where(x => x.LastMessageAt != null)
            .OrderByDescending(x => x.LastMessageAt)
            .Select(x => new ConversationDto
            {
                ConversationId = x.Id,
                FriendId = x.FriendId,
                LastMessageAt = x.LastMessageAt!.Value
            })
            .ToListAsync();
    }

    public async Task<List<MessageDto>> GetMessagesAsync(string me, string friendId)
    {
        var convo = await GetOrCreateConversationAsync(me, friendId, create: false);

        if (convo == null)
            return new List<MessageDto>();

        return await _db.Messages
            .Where(m => m.ConversationId == convo.Id)
            .OrderBy(m => m.SentAt)
            .Select(m => new MessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                Content = m.Content,
                SentAt = m.SentAt
            })
            .ToListAsync();
    }

    public async Task<MessageDto> SendMessageAsync(string me, string friendId, string content)
    {
        var convo = await GetOrCreateConversationAsync(me, friendId, create: true);


        return await _realtime.SendAsync(convo.Id, me, content);
    }

    private async Task<Conversation?> GetOrCreateConversationAsync(string me, string friendId, bool create)
    {
        var (a, b) = Normalize(me, friendId);

        var convo = await _db.Conversations
            .FirstOrDefaultAsync(c => c.UserAId == a && c.UserBId == b);

        if (convo != null)
            return convo;

        if (!create)
            return null;

        convo = new Conversation
        {
            UserAId = a,
            UserBId = b,
            CreatedAt = DateTime.UtcNow
        };

        _db.Conversations.Add(convo);
        await _db.SaveChangesAsync();

        return convo;
    }

    public async Task<long?> GetConversationIdAsync(string me, string friendId)
    {
        var convo = await GetOrCreateConversationAsync(me, friendId, create: false);
        return convo?.Id;
    }
}
