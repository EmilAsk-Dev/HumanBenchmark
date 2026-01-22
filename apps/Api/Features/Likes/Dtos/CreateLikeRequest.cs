namespace Api.Features.Likes.Dtos;

public record CreateLikeRequest(
    LikeTargetType TargetType,
    long TargetId
);
