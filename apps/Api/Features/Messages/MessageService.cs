using Api.Data;
using Api.Domain.Message;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Api.Features.Messages.Dtos;


namespace Api.Features.Messages;

public class MessageService
{
    private readonly ApplicationDbContext _db;

    public MessageService(ApplicationDbContext db)
    {
        _db = db;
    }

    private static (string A, string B) Normalize(string u1, string u2)
    {
        return string.Compare(u1, u2) < 0 ? (u1, u2) : (u2, u1);
    }

    public async Task<List<ConversationDto>> GetConversationsAsync(string me)
    {
        var conversations = await _db.Conversations
            .Where(c => c.UserAId == me || c.UserBId == me)
            .OrderByDescending(c => c.Messages.Max(m => m.SentAt))
            .Select(c => new ConversationDto
            {
                ConversationId = c.Id,
                FriendId = c.UserAId == me ? c.UserBId : c.UserAId,
                LastMessageAt = c.Messages.Max(m => m.SentAt)
            })
            .ToListAsync();

        return conversations;
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

        var message = new Api.Domain.Message.Message
        {
            ConversationId = convo.Id,
            SenderId = me,
            Content = content,
            SentAt = DateTime.UtcNow
        };

        _db.Messages.Add(message);
        await _db.SaveChangesAsync();

        return new MessageDto
        {
            Id = message.Id,
            SenderId = message.SenderId,
            Content = message.Content,
            SentAt = message.SentAt
        };
    }

    private async Task<Conversation?> GetOrCreateConversationAsync(
        string me,
        string friendId,
        bool create)
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
}
