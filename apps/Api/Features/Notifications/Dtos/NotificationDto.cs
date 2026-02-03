
namespace Api.Features.Notifications.Dtos;

public class NotificationDto
{
    public long Id { get; set; }
    public string Type { get; set; } = default!;
    public string Title { get; set; } = default!;
    public string Message { get; set; } = default!;
    public object? Data { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public bool IsRead => ReadAt != null;
}
