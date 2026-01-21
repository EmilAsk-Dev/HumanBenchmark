namespace Api.Features.Leaderboards.Dtos;

public record LeaderboardEntryDto(
    int Rank,
    string UserId,
    string? UserName,
    int BestScore,
    DateTime AchievedAtUtc
);
