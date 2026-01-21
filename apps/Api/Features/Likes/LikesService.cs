using Api.Data;
using Api.Domain;
using Api.Features.Likes.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Api.Features.Likes;

public class LikesService
{
    private readonly ApplicationDbContext _db;

    public LikesService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<LikeResponseDto> LikeAttemptAsync(string userId, long attemptId)
    {
        var attemptExists = await _db.Attempts.AnyAsync(a => a.Id == attemptId);
        if (!attemptExists)
        {
            return new LikeResponseDto(false, 0, false, "Attempt not found");
        }

        var existingLike = await _db.Likes
            .FirstOrDefaultAsync(l => l.UserId == userId && l.AttemptId == attemptId);

        if (existingLike != null)
        {
            var count = await GetLikeCountAsync(attemptId);
            return new LikeResponseDto(false, count, true, "Already liked");
        }

        var like = new Like
        {
            UserId = userId,
            AttemptId = attemptId,
            CreatedAt = DateTime.UtcNow
        };

        _db.Likes.Add(like);
        await _db.SaveChangesAsync();

        var likeCount = await GetLikeCountAsync(attemptId);
        return new LikeResponseDto(true, likeCount, true, "Liked successfully");
    }

    public async Task<LikeResponseDto> UnlikeAttemptAsync(string userId, long attemptId)
    {
        var like = await _db.Likes
            .FirstOrDefaultAsync(l => l.UserId == userId && l.AttemptId == attemptId);

        if (like == null)
        {
            var count = await GetLikeCountAsync(attemptId);
            return new LikeResponseDto(false, count, false, "Like not found");
        }

        _db.Likes.Remove(like);
        await _db.SaveChangesAsync();

        var likeCount = await GetLikeCountAsync(attemptId);
        return new LikeResponseDto(true, likeCount, false, "Unliked successfully");
    }

    public async Task<LikeDto> GetLikeInfoAsync(string userId, long attemptId)
    {
        var likeCount = await GetLikeCountAsync(attemptId);
        var isLikedByMe = await _db.Likes
            .AnyAsync(l => l.UserId == userId && l.AttemptId == attemptId);

        return new LikeDto(attemptId, likeCount, isLikedByMe);
    }

    private async Task<int> GetLikeCountAsync(long attemptId)
    {
        return await _db.Likes.CountAsync(l => l.AttemptId == attemptId);
    }
}
