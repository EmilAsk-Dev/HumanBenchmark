namespace Api.Features.Friends.Dtos;

public record FriendshipDto(string FriendUserId, DateTime CreatedAt);

public record FriendRequestDto(
    long Id,
    string FromUserId,
    string ToUserId,
    string Status,
    DateTime CreatedAt,
    DateTime? RespondedAt
);

public record SendFriendRequestRequest(string ToUserId);

public record RespondFriendRequestRequest(bool Accept);
