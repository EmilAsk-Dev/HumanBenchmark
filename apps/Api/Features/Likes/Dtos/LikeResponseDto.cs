namespace Api.Features.Likes.Dtos;

public record LikeResponseDto(
    bool Success,
    LikeTargetType TargetType,
    long TargetId,
    int LikeCount,
    bool IsLikedByMe,
    string Message
);
