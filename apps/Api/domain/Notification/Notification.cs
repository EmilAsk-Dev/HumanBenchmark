namespace Api.Domain;

public class Notification
{
    public long Id { get; set; }
    public string UserId { get; set; } = default!;
    public string Type { get; set; } = default!;
    public string Title { get; set; } = default!;
    public string Message { get; set; } = default!;
    public string? DataJson { get; set; } // optional
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
}