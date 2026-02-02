namespace Api.Features.Messages.Dtos;

public class ConversationDto
{
    public long ConversationId { get; set; }
    public string FriendId { get; set; } = null!;
    public DateTime LastMessageAt { get; set; }
}

public class MessageDto
{
    public long Id { get; set; }
    public string SenderId { get; set; } = null!;
    public string Content { get; set; } = null!;
    public DateTime SentAt { get; set; }
}

public class SendMessageRequest
{
    public string Content { get; set; } = null!;
}