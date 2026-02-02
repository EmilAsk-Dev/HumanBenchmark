namespace Api.Features.Friends.Dtos;

public record FriendshipDto(string FriendUserId, DateTime CreatedAt);

public record FriendRequestDto(
    long Id,
    string Status,
    DateTime CreatedAt,
    DateTime? RespondedAt,
    FriendDto From,
    FriendDto To
);

public record FriendDto(
    string Id,
    string UserName,
    string? AvatarUrl
);

public record FriendListItemDto(
    FriendDto User,
    DateTime CreatedAt
);

public record SendFriendRequestRequest(string ToUserId);

public record RespondFriendRequestRequest(bool Accept);
