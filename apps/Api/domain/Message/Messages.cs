namespace Api.Domain.Message;



public class Conversation
{
    public long Id { get; set; }

    public string UserAId { get; set; } = null!;
    public string UserBId { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Message> Messages { get; set; } = new List<Message>();
}

public class Message
{
    public long Id { get; set; }

    public long ConversationId { get; set; }
    public Conversation Conversation { get; set; } = null!;

    public string SenderId { get; set; } = null!;

    public string Content { get; set; } = null!;

    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
