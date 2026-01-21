namespace Api.Domain;

using Api.Data;

public class Like
{
    public long Id { get; set; }

    public long AttemptId { get; set; }
    public Attempt Attempt { get; set; } = default!;

    public string UserId { get; set; } = default!;
    public ApplicationUser User { get; set; } = default!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
