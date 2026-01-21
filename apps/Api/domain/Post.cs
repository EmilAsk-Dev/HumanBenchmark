namespace Api.Domain;

public class Post
{
    public long Id { get; set; }

    public long AttemptId { get; set; }
    public Attempt Attempt { get; set; } = default!;

    public string UserId { get; set; } = default!;
    public ApplicationUser User { get; set; } = default!;

    public string? Caption { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
