using Api.Domain;

namespace Api.Features.Posts.Dtos;

public record PostDto(
    long PostId,
    DateTime CreatedAt,
    string UserId,
    string UserName,
    string? UserAvatarUrl,
    GameType TestType,
    int Score,
    string DisplayScore,
    double? Percentile,
    string? Caption,
    int LikeCount,
    int CommentCount,
    bool IsLikedByMe
);
