namespace Api.Features.Users.Dtos;

public record ProfileDto(
    string UserId,
    string UserName,
    int? TotalSessions,
    int? StreakDays,
    Dictionary<string, PersonalBestDto>? PbByTest,
    List<RecentRunDto>? RecentRuns,
    Dictionary<string, TestSeriesDto>? SeriesByTest
);
