using Api.Data;
using Api.Features.Comments;
using Api.Features.Feed.Dtos;
using Microsoft.EntityFrameworkCore;

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

        if (friendIds.Count == 0)
            return new List<FeedItemDto>();

        return await _db.Posts
            .AsNoTracking()
            .Where(p => friendIds.Contains(p.UserId))
            .OrderByDescending(p => p.CreatedAt)
            .Skip(skip)
            .Take(take)
            .Select(p => new FeedItemDto(
                p.Id,
                new UserDto(
                    p.User.Id,
                    p.User.UserName!,
                    p.User.UserName!

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
            c.UserId,
            c.Content,
            c.CreatedAt,
            c.Likes.Count,
            c.Likes.Any(l => l.UserId == me)
            )).ToList()
    ))
    .ToListAsync();
    }
}
