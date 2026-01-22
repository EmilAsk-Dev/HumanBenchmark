namespace Api.Features.Leaderboards.Dtos;

public record MyLeaderboardStatsDto(
    int Attempts,
    int? BestScore,
    DateTime? BestAtUtc,
    int? Rank,
    double? Percentile
);
