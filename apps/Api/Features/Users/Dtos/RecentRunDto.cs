using Api.Domain;

namespace Api.Features.Users.Dtos;

public record RecentRunDto(
    long AttemptId,
    GameType TestType,
    int Score,
    string DisplayScore,
    DateTime CreatedAt
);
