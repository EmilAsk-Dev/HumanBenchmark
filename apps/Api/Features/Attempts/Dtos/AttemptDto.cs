using Api.Domain;

namespace Api.Features.Attempts.Dtos;

public record AttemptDto(
    long Id,
    string UserId,
    GameType Game,
    int Value,
    DateTime CreatedAt
);
