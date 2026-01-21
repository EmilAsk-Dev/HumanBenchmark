namespace Api.Features.Likes.Dtos;

public record LikeResponseDto(
    bool Success,
    int LikeCount,
    bool IsLikedByMe,
    string Message
);
