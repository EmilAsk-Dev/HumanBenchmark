namespace Api.Domain.Friends;

public class Friendship
{
    public long Id { get; set; }

    public string UserAId { get; set; } = default!;
    public string UserBId { get; set; } = default!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
