namespace Api.Domain.Friends;

public enum FriendRequestStatus
{
    Pending = 1,
    Accepted = 2,
    Declined = 3,
    Canceled = 4
}

public class FriendRequest
{
    public long Id { get; set; }

    public string FromUserId { get; set; } = default!;
    public string ToUserId { get; set; } = default!;

    public FriendRequestStatus Status { get; set; } = FriendRequestStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }
}
