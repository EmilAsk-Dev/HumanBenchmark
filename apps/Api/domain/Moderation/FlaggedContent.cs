namespace Api.Domain.Moderation;

public class FlaggedContent
{
    public long Id { get; set; }
    public string UserId { get; set; } = default!;
    public string ContentType { get; set; } = default!;
    public string Content { get; set; } = default!;
    public string Reason { get; set; } = default!;
    public DateTime FlaggedAt { get; set; } = DateTime.UtcNow;
    public bool Reviewed { get; set; } = false;
}
