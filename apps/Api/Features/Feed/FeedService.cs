using Api.Data;
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

        return await _db.Attempts
            .AsNoTracking()
            .Where(a => friendIds.Contains(a.UserId))
            .OrderByDescending(a => a.CreatedAt)
            .Skip(skip)
            .Take(take)
            .Select(a => new FeedItemDto(
                a.Id,
                a.UserId,
                a.Game,
                a.Value,
                a.CreatedAt
            ))
            .ToListAsync();
    }
}
