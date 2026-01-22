using Api.Domain;

namespace Api.Features.Users.Dtos;

public record PersonalBestDto(
    GameType TestType,
    int Score,
    string DisplayScore,
    DateTime AchievedAt
);
