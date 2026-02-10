using System.Security.Claims;
using Api.Data;
using Api.Domain;
using Api.Features.Users.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Features.Users;

public class ProfileService
{
    private readonly ApplicationDbContext _db;

    public ProfileService(ApplicationDbContext db)
    {
        _db = db;
    }

    // Backwards-compatible helper for "my profile" / tests.
    public Task<ProfileDto?> GetProfileAsync(string userId)
        => GetProfileAsync(userId, userId);

    private static (string A, string B) Normalize(string u1, string u2)
        => string.CompareOrdinal(u1, u2) < 0 ? (u1, u2) : (u2, u1);

    private async Task<bool> CanViewProfileAsync(string requesterUserId, string targetUserId)
    {
        if (string.Equals(requesterUserId, targetUserId, StringComparison.Ordinal))
            return true;

        var (a, b) = Normalize(requesterUserId, targetUserId);
        return await _db.Friendships.AnyAsync(f => f.UserAId == a && f.UserBId == b);
    }

    public async Task<ProfileDto?> GetProfileAsync(string requesterUserId, string targetUserId)
    {
        if (!await CanViewProfileAsync(requesterUserId, targetUserId))
            throw new UnauthorizedAccessException("Not friends");

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == targetUserId);
        if (user == null)
            return null;

        var totalSessions = await GetTotalSessionsAsync(targetUserId);
        var streakDays = await GetStreakDaysAsync(targetUserId);
        var pbByTest = await GetPersonalBestsAsync(targetUserId);
        var recentRuns = await GetRecentRunsAsync(targetUserId);
        var seriesByTest = await GetSeriesByTestAsync(targetUserId);

        return new ProfileDto(
            targetUserId,
            user.UserName ?? "Unknown",
            user.AvatarUrl,
            totalSessions,
            streakDays,
            pbByTest,
            recentRuns,
            seriesByTest
        );
    }

    public async Task<ProfileDto?> GetProfileByUsernameAsync(string requesterUserId, string username)
    {
        if (string.IsNullOrWhiteSpace(username))
            return null;

        var normalized = username.Trim();

        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserName != null && u.UserName.ToLower() == normalized.ToLower());

        if (user == null) return null;

        return await GetProfileAsync(requesterUserId, user.Id);
    }

    private async Task<int> GetTotalSessionsAsync(string userId)
    {
        return await _db.Attempts
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .CountAsync();
    }

    private async Task<int> GetStreakDaysAsync(string userId)
    {
        var dates = await _db.Attempts
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .Select(a => a.CreatedAt.Date)
            .Distinct()
            .OrderByDescending(d => d)
            .ToListAsync();

        if (dates.Count == 0)
            return 0;

        var today = DateTime.UtcNow.Date;

        if (dates[0] != today && dates[0] != today.AddDays(-1))
            return 0;

        var streak = 1;

        for (int i = 1; i < dates.Count; i++)
        {
            if (dates[i] == dates[i - 1].AddDays(-1))
                streak++;
            else
                break;
        }

        return streak;
    }

    private async Task<Dictionary<string, PersonalBestDto>> GetPersonalBestsAsync(string userId)
    {
        var pbs = new Dictionary<string, PersonalBestDto>();

        foreach (GameType gameType in Enum.GetValues<GameType>())
        {
            var q = _db.Attempts
                .AsNoTracking()
                .Where(a => a.UserId == userId && a.Game == gameType)
                .Include(a => a.ReactionDetails)
                .Include(a => a.TypingDetails)
                .Include(a => a.ChimpDetails)
                .Include(a => a.SequenceDetails);

            Attempt? best =
                gameType == GameType.Reaction
                    ? await q.OrderBy(a => a.Value).FirstOrDefaultAsync()
                    : await q.OrderByDescending(a => a.Value).FirstOrDefaultAsync();

            if (best == null) continue;

            var stats = MapStatistics(best);

            pbs[gameType.ToString()] = new PersonalBestDto(
                gameType,
                best.Value,
                FormatDisplayScore(gameType, best.Value),
                best.CreatedAt,
                stats
            );
        }

        return pbs;
    }

    private async Task<List<RecentRunDto>> GetRecentRunsAsync(string userId, int limit = 10)
    {
        var attempts = await _db.Attempts
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(limit)
            .ToListAsync();

        return attempts.Select(a => new RecentRunDto(
            a.Id,
            a.Game,
            a.Value,
            FormatDisplayScore(a.Game, a.Value),
            a.CreatedAt
        )).ToList();
    }

    private async Task<Dictionary<string, TestSeriesDto>> GetSeriesByTestAsync(string userId, int limit = 50)
    {
        var series = new Dictionary<string, TestSeriesDto>();

        foreach (GameType gameType in Enum.GetValues<GameType>())
        {
            var dataPoints = await _db.Attempts
                .AsNoTracking()
                .Where(a => a.UserId == userId && a.Game == gameType)
                .OrderByDescending(a => a.CreatedAt)
                .Take(limit)
                .Select(a => new DataPointDto(a.CreatedAt, a.Value))
                .ToListAsync();

            if (dataPoints.Count > 0)
            {
                dataPoints.Reverse();
                series[gameType.ToString()] = new TestSeriesDto(gameType, dataPoints);
            }
        }

        return series;
    }

    private string FormatDisplayScore(GameType gameType, int value)
    {
        return gameType switch
        {
            GameType.Reaction => $"{value}ms",
            GameType.Typing => $"{value} WPM",
            GameType.ChimpTest => $"Level {value}",
            GameType.SequenceTest => $"Level {value}",
            _ => value.ToString()
        };
    }

    private AttemptStatisticsDto MapStatistics(Attempt attempt)
    {
        return new AttemptStatisticsDto(
            attempt.ReactionDetails == null
                ? null
                : new ReactionAttemptDetailsDto(
                    attempt.ReactionDetails.AttemptId,
                    attempt.ReactionDetails.BestMs,
                    attempt.ReactionDetails.AvgMs,
                    attempt.ReactionDetails.Attempts
                ),
            attempt.ChimpDetails == null
                ? null
                : new ChimpAttemptDetailsDto(
                    attempt.ChimpDetails.AttemptId,
                    attempt.ChimpDetails.Level,
                    attempt.ChimpDetails.Mistakes,
                    attempt.ChimpDetails.TimeMs
                ),
            attempt.TypingDetails == null
                ? null
                : new TypingAttemptDetailsDto(
                    attempt.TypingDetails.AttemptId,
                    attempt.TypingDetails.Wpm,
                    attempt.TypingDetails.Accuracy,
                    attempt.TypingDetails.Characters
                ),
            attempt.SequenceDetails == null
                ? null
                : new SequenceAttemptDetailsDto(
                    attempt.SequenceDetails.AttemptId,
                    attempt.SequenceDetails.Level,
                    attempt.SequenceDetails.Mistakes,
                    attempt.SequenceDetails.TimeMs
                )
        );
    }
}


