using Api.Data;
using Api.Features.Comments;
using Api.Features.Feed.Dtos;
using Microsoft.EntityFrameworkCore;
using Api.Features.Users.Dtos;

namespace Api.Features.Feed;

public class FeedService
{
    private readonly ApplicationDbContext _db;

    public FeedService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<FeedItemDto>> GetFriendsFeedAsync(string me, FeedRequest req)
    {
        var take = Math.Clamp(req.Take, 1, 200);
        var skip = Math.Max(req.Skip, 0);

        var friendIds = await _db.Friendships
            .AsNoTracking()
            .Where(f => f.UserAId == me || f.UserBId == me)
            .Select(f => f.UserAId == me ? f.UserBId : f.UserAId)
            .ToListAsync();



        return await _db.Posts
            .AsNoTracking()
            .Where(p => p.UserId == me || friendIds.Contains(p.UserId))
            .OrderByDescending(p => p.CreatedAt)
            .Skip(skip)
            .Take(take)
            .Select(p => new FeedItemDto(
                p.Id,
                p.Caption,
                new UserDto(
                    p.User.Id,
                    p.User.UserName!,
                    p.User.AvatarUrl

        ),
        new TestRunDto(
            p.Attempt.Game,
            p.Attempt.Value,
            0,
            new AttemptStatsDto(
                p.Attempt.ReactionDetails,
                p.Attempt.ChimpDetails,
                p.Attempt.TypingDetails,
                p.Attempt.SequenceDetails
            )
        ),
            p.CreatedAt,
            p.Likes.Count,
            p.Likes.Any(l => l.UserId == me),
            p.Comments.Select(c => new CommentDto(
            c.Id,
            c.PostId,
            new UserDto(
                c.User.Id,
                c.User.UserName!,
                c.User.AvatarUrl
            ),
            c.Content,
            c.CreatedAt,
            c.Likes.Count,
            c.Likes.Any(l => l.UserId == me),
            c.ParentCommentId
            )).ToList()
    ))
    .ToListAsync();
    }

    public async Task<List<FeedItemDto>> GetPublicFeedAsync(string me, FeedRequest req)
    {
        var take = Math.Clamp(req.Take, 1, 200);
        var skip = Math.Max(req.Skip, 0);

        return await _db.Posts
            .AsNoTracking()
            .Where(p => p.IsPublic)
            .OrderByDescending(p => p.CreatedAt)
            .Skip(skip)
            .Take(take)
            .Select(p => new FeedItemDto(
                p.Id,
                p.Caption,
                new UserDto(
                    p.User.Id,
                    p.User.UserName!,
                    p.User.AvatarUrl
                ),
                new TestRunDto(
                    p.Attempt.Game,
                    p.Attempt.Value,
                    0,
                    new AttemptStatsDto(
                        p.Attempt.ReactionDetails,
                        p.Attempt.ChimpDetails,
                        p.Attempt.TypingDetails,
                        p.Attempt.SequenceDetails
                    )
                ),
                p.CreatedAt,
                p.Likes.Count,

                p.Likes.Any(l => l.UserId == me),
                p.Comments.Select(c => new CommentDto(
                    c.Id,
                    c.PostId,
                    new UserDto(
                        c.User.Id,
                        c.User.UserName!,
                        c.User.AvatarUrl
                    ),
                    c.Content,
                    c.CreatedAt,
                    c.Likes.Count,
                    c.Likes.Any(l => l.UserId == me),
                    c.ParentCommentId
                )).ToList()
            ))
            .ToListAsync();

    }

    public async Task<List<FeedItemDto>> GetTrendingFeedAsync(string me, FeedRequest req)
    {
        var take = Math.Clamp(req.Take, 1, 200);
        var skip = Math.Max(req.Skip, 0);

        // "Current week" starting Monday (ISO-ish). Use UTC to match typical DB storage.
        var now = DateTime.UtcNow;
        var startOfWeek = now.Date.AddDays(-(int)(now.DayOfWeek == DayOfWeek.Sunday ? 6 : now.DayOfWeek - DayOfWeek.Monday));
        var endOfWeek = startOfWeek.AddDays(7);

        return await _db.Posts
            .AsNoTracking()
            .Where(p => p.IsPublic)
            .Where(p => p.CreatedAt >= startOfWeek && p.CreatedAt < endOfWeek)
            .OrderByDescending(p => p.Likes.Count)
            .ThenByDescending(p => p.CreatedAt)
            .Skip(skip)
            .Take(take)
            .Select(p => new FeedItemDto(
                p.Id,
                p.Caption,
                new UserDto(
                    p.User.Id,
                    p.User.UserName!,
                    p.User.AvatarUrl
                ),
                new TestRunDto(
                    p.Attempt.Game,
                    p.Attempt.Value,
                    0,
                    new AttemptStatsDto(
                        p.Attempt.ReactionDetails,
                        p.Attempt.ChimpDetails,
                        p.Attempt.TypingDetails,
                        p.Attempt.SequenceDetails
                    )
                ),
                p.CreatedAt,
                p.Likes.Count,
                p.Likes.Any(l => l.UserId == me),
                p.Comments.Select(c => new CommentDto(
                    c.Id,
                    c.PostId,
                    new UserDto(
                        c.User.Id,
                        c.User.UserName!,
                        c.User.AvatarUrl
                    ),
                    c.Content,
                    c.CreatedAt,
                    c.Likes.Count,
                    c.Likes.Any(l => l.UserId == me),
                    c.ParentCommentId
                )).ToList()
            ))
            .ToListAsync();
    }

    public enum FeedFilter
    {
        Friends,
        Global,
        Trending
    }

}
