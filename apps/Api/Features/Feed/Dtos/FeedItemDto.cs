using Api.Domain;

namespace Api.Features.Feed.Dtos;

public record FeedItemDto(
    long AttemptId,
    string UserId,
    GameType Game,
    int Value,
    DateTime CreatedAt
);
