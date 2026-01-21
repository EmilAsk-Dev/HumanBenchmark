using Api.Domain;

namespace Api.Features.Leaderboards.Dtos;

public record UserGameStatsDto(
    string UserId,
    string? UserName,
    GameType Game,
    LeaderboardTimeframe Timeframe,
    int Attempts,
    int? BestScore,
    double? AvgScore,
    int? LastScore,
    DateTime? LastAtUtc,
    int? Rank,
    double? Percentile
);
