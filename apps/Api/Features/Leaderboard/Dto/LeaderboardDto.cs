using Api.Domain;

namespace Api.Features.Leaderboards.Dtos;

public record LeaderboardDto(
    GameType Game,
    LeaderboardScope Scope,
    LeaderboardTimeframe Timeframe,
    int TotalUsers,
    IReadOnlyList<LeaderboardEntryDto> Entries,
    MyLeaderboardStatsDto Me
);
