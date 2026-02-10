// File: Api/Features/Leaderboards/LeaderboardService.cs
using Api.Data;
using Api.Domain;
using Api.Domain.Friends;
using Api.Features.Leaderboards.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Api.Features.Leaderboards;

public sealed class ForbiddenException : Exception
{
    public ForbiddenException(string message) : base(message) { }
}

public sealed class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}

public class LeaderboardService
{
    private readonly ApplicationDbContext _db;

    public LeaderboardService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<LeaderboardDto> GetLeaderboardAsync(
        string currentUserId,
        GameType game,
        LeaderboardScope scope,
        LeaderboardTimeframe timeframe,
        int limit,
        CancellationToken ct = default)
    {
        limit = Math.Clamp(limit, 1, 200);

        var cutoff = GetCutoffUtc(timeframe);

        var friendIds = scope == LeaderboardScope.Friends
            ? await GetFriendIdsAsync(currentUserId, ct)
            : new List<string>();

        var baseAttempts = _db.Attempts
            .AsNoTracking()
            .Where(a => a.Game == game);

        if (cutoff is not null)
            baseAttempts = baseAttempts.Where(a => a.CreatedAt >= cutoff.Value);

        if (scope == LeaderboardScope.Friends)
        {
            var allowed = friendIds.Append(currentUserId).Distinct().ToList();
            baseAttempts = baseAttempts.Where(a => allowed.Contains(a.UserId));
        }

        var lowerIsBetter = IsLowerBetter(game);

        var bestByUser = baseAttempts
            .GroupBy(a => a.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                BestScore = lowerIsBetter ? g.Min(x => x.Value) : g.Max(x => x.Value)
            });

        var totalUsers = await bestByUser.CountAsync(ct);

        var bestWithAt =
            from b in bestByUser
            join a in baseAttempts on new { b.UserId, Score = b.BestScore } equals new { a.UserId, Score = a.Value }
            group a by new { b.UserId, b.BestScore } into g
            select new
            {
                g.Key.UserId,
                BestScore = g.Key.BestScore,
                AchievedAtUtc = g.Min(x => x.CreatedAt)
            };

        var entriesQuery =
            from x in bestWithAt
            join u in _db.Users.AsNoTracking() on x.UserId equals u.Id
            select new
            {
                x.UserId,
                u.UserName,
                u.AvatarUrl,
                x.BestScore,
                x.AchievedAtUtc
            };

        entriesQuery = lowerIsBetter
            ? entriesQuery.OrderBy(x => x.BestScore).ThenBy(x => x.AchievedAtUtc)
            : entriesQuery.OrderByDescending(x => x.BestScore).ThenBy(x => x.AchievedAtUtc);

        var top = await entriesQuery.Take(limit).ToListAsync(ct);

        var entries = top
            .Select((x, i) => new LeaderboardEntryDto(
                Rank: i + 1,
                UserId: x.UserId,
                UserName: x.UserName,
                AvatarUrl: x.AvatarUrl,
                BestScore: x.BestScore,
                AchievedAtUtc: x.AchievedAtUtc
            ))
            .ToList();

        var myAttempts = baseAttempts.Where(a => a.UserId == currentUserId);

        var myAttemptCount = await myAttempts.CountAsync(ct);

        int? myBestScore = myAttemptCount == 0
            ? null
            : (lowerIsBetter
                ? await myAttempts.MinAsync(a => (int?)a.Value, ct)
                : await myAttempts.MaxAsync(a => (int?)a.Value, ct));

        DateTime? myBestAtUtc = null;
        if (myBestScore is not null)
        {
            myBestAtUtc = await myAttempts
                .Where(a => a.Value == myBestScore.Value)
                .MinAsync(a => (DateTime?)a.CreatedAt, ct);
        }

        int? myRank = null;
        double? myPercentile = null;

        if (myBestScore is not null && totalUsers > 0)
        {
            var betterCount = lowerIsBetter
                ? await bestByUser.CountAsync(b => b.BestScore < myBestScore.Value, ct)
                : await bestByUser.CountAsync(b => b.BestScore > myBestScore.Value, ct);

            myRank = betterCount + 1;

            myPercentile = totalUsers == 1
                ? 100
                : 100.0 * (1.0 - (betterCount / (double)(totalUsers - 1)));
        }

        return new LeaderboardDto(
            Game: game,
            Scope: scope,
            Timeframe: timeframe,
            TotalUsers: totalUsers,
            Entries: entries,
            Me: new MyLeaderboardStatsDto(
                Attempts: myAttemptCount,
                BestScore: myBestScore,
                BestAtUtc: myBestAtUtc,
                Rank: myRank,
                Percentile: myPercentile
            )
        );
    }


    public async Task<UserGameStatsDto> GetUserStatsAsync(
        string requesterUserId,
        string targetUserId,
        bool isAdmin,
        GameType game,
        LeaderboardTimeframe timeframe,
        CancellationToken ct = default)
    {
        var targetExists = await _db.Users.AsNoTracking().AnyAsync(u => u.Id == targetUserId, ct);
        if (!targetExists)
            throw new NotFoundException("User not found");

        if (!isAdmin && !string.Equals(requesterUserId, targetUserId, StringComparison.Ordinal))
        {
            var isFriend = await AreFriendsAsync(requesterUserId, targetUserId, ct);
            if (!isFriend)
                throw new ForbiddenException("Not friends");
        }

        var cutoff = GetCutoffUtc(timeframe);

        var attempts = _db.Attempts.AsNoTracking()
            .Include(a => a.ReactionDetails)
            .Where(a => a.UserId == targetUserId && a.Game == game);

        if (cutoff is not null)
            attempts = attempts.Where(a => a.CreatedAt >= cutoff.Value);

        var lowerIsBetter = IsLowerBetter(game);

        var count = await attempts.CountAsync(ct);

        int? best = count == 0
            ? null
            : (lowerIsBetter
                ? await attempts.MinAsync(a => (int?)a.Value, ct)
                : await attempts.MaxAsync(a => (int?)a.Value, ct));

        double? avg = count == 0 ? null : await attempts.AverageAsync(a => (double?)a.Value, ct);

        var last = await attempts
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new { a.Value, a.CreatedAt })
            .FirstOrDefaultAsync(ct);

        var globalBase = _db.Attempts.AsNoTracking().Where(a => a.Game == game);
        if (cutoff is not null)
            globalBase = globalBase.Where(a => a.CreatedAt >= cutoff.Value);

        var bestByUser = globalBase
            .GroupBy(a => a.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                BestScore = lowerIsBetter ? g.Min(x => x.Value) : g.Max(x => x.Value)
            });

        var totalUsers = await bestByUser.CountAsync(ct);

        int? rank = null;
        double? percentile = null;

        if (best is not null && totalUsers > 0)
        {
            var betterCount = lowerIsBetter
                ? await bestByUser.CountAsync(b => b.BestScore < best.Value, ct)
                : await bestByUser.CountAsync(b => b.BestScore > best.Value, ct);

            rank = betterCount + 1;
            percentile = totalUsers == 1
                ? 100
                : 100.0 * (1.0 - (betterCount / (double)(totalUsers - 1)));
        }

        var userName = await _db.Users.AsNoTracking()
            .Where(u => u.Id == targetUserId)
            .Select(u => u.UserName)
            .FirstOrDefaultAsync(ct);

        return new UserGameStatsDto(
            UserId: targetUserId,
            UserName: userName,
            Game: game,
            Timeframe: timeframe,
            Attempts: count,
            BestScore: best,
            AvgScore: avg,
            LastScore: last?.Value,
            LastAtUtc: last?.CreatedAt,
            Rank: rank,
            Percentile: percentile
        );
    }

    private static DateTime? GetCutoffUtc(LeaderboardTimeframe timeframe)
    {
        var now = DateTime.UtcNow;
        return timeframe switch
        {
            LeaderboardTimeframe.All => null,
            LeaderboardTimeframe.Day => now.AddDays(-1),
            LeaderboardTimeframe.Week => now.AddDays(-7),
            LeaderboardTimeframe.Month => now.AddDays(-30),
            _ => null
        };
    }

    private static bool IsLowerBetter(GameType game)
    {
        return game == GameType.Reaction;
    }

    private async Task<List<string>> GetFriendIdsAsync(string userId, CancellationToken ct)
    {
        var aToB = _db.Set<Friendship>().AsNoTracking()
            .Where(f => f.UserAId == userId)
            .Select(f => f.UserBId);

        var bToA = _db.Set<Friendship>().AsNoTracking()
            .Where(f => f.UserBId == userId)
            .Select(f => f.UserAId);

        return await aToB.Union(bToA).Distinct().ToListAsync(ct);
    }

    private async Task<bool> AreFriendsAsync(string a, string b, CancellationToken ct)
    {
        return await _db.Set<Friendship>().AsNoTracking().AnyAsync(f =>
            (f.UserAId == a && f.UserBId == b) || (f.UserAId == b && f.UserBId == a), ct);
    }
}
