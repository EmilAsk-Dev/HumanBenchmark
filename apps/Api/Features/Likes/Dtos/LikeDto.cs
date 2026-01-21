namespace Api.Features.Likes.Dtos;

public record LikeDto(
    LikeTargetType TargetType,
    long TargetId,
    int LikeCount,
    bool IsLikedByMe
);
