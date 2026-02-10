namespace Api.Features.Leaderboards.Dtos;

public record LeaderboardEntryDto(
    int Rank,
    string UserId,
    string? UserName,
    string? AvatarUrl,
    int BestScore,
    DateTime AchievedAtUtc
);
