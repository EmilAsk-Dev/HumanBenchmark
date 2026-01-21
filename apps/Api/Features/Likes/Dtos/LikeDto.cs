namespace Api.Features.Likes.Dtos;

public record LikeDto(
    long AttemptId,
    int LikeCount,
    bool IsLikedByMe
);
