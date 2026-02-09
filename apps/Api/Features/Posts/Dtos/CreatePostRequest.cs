namespace Api.Features.Posts.Dtos;

public record CreatePostRequest(
    long AttemptId,
    string? Caption,
    bool IsPublic
);
