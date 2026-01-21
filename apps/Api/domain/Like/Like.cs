namespace Api.Domain;

using Api.Data;

public class Like
{
    public long Id { get; set; }

    public string UserId { get; set; } = default!;
    public ApplicationUser User { get; set; } = default!;

    public long? PostId { get; set; }
    public Post? Post { get; set; }

    public long? CommentId { get; set; }
    public Comment? Comment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
