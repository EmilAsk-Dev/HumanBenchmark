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

    public async Task<LikeResponseDto> LikeAsync(string userId, LikeTargetType targetType, long targetId)
    {
        var exists = await TargetExistsAsync(targetType, targetId);
        if (!exists)
            return new LikeResponseDto(false, targetType, targetId, 0, false, $"{targetType} not found");

        var alreadyLiked = await IsLikedByMeAsync(userId, targetType, targetId);
        if (alreadyLiked)
        {
            var count = await GetLikeCountAsync(targetType, targetId);
            return new LikeResponseDto(false, targetType, targetId, count, true, "Already liked");
        }

        var like = new Like
        {
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        if (targetType == LikeTargetType.Post)
            like.PostId = targetId;
        else
            like.CommentId = targetId;

        _db.Likes.Add(like);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            var count = await GetLikeCountAsync(targetType, targetId);
            return new LikeResponseDto(false, targetType, targetId, count, true, "Already liked");
        }

        var likeCount = await GetLikeCountAsync(targetType, targetId);
        return new LikeResponseDto(true, targetType, targetId, likeCount, true, "Liked successfully");
    }

    public async Task<LikeResponseDto> UnlikeAsync(string userId, LikeTargetType targetType, long targetId)
    {
        var like = await FindLikeAsync(userId, targetType, targetId);
        if (like == null)
        {
            var count = await GetLikeCountAsync(targetType, targetId);
            return new LikeResponseDto(false, targetType, targetId, count, false, "Like not found");
        }

        _db.Likes.Remove(like);
        await _db.SaveChangesAsync();

        var likeCount = await GetLikeCountAsync(targetType, targetId);
        return new LikeResponseDto(true, targetType, targetId, likeCount, false, "Unliked successfully");
    }

    public async Task<LikeDto> GetLikeInfoAsync(string userId, LikeTargetType targetType, long targetId)
    {
        var likeCount = await GetLikeCountAsync(targetType, targetId);
        var isLikedByMe = await IsLikedByMeAsync(userId, targetType, targetId);

        return new LikeDto(targetType, targetId, likeCount, isLikedByMe);
    }

    private Task<bool> TargetExistsAsync(LikeTargetType targetType, long targetId)
        => targetType switch
        {
            LikeTargetType.Post => _db.Posts.AnyAsync(p => p.Id == targetId),
            LikeTargetType.Comment => _db.Comments.AnyAsync(c => c.Id == targetId),
            _ => Task.FromResult(false)
        };

    private Task<int> GetLikeCountAsync(LikeTargetType targetType, long targetId)
        => targetType switch
        {
            LikeTargetType.Post => _db.Likes.CountAsync(l => l.PostId == targetId),
            LikeTargetType.Comment => _db.Likes.CountAsync(l => l.CommentId == targetId),
            _ => Task.FromResult(0)
        };

    private Task<bool> IsLikedByMeAsync(string userId, LikeTargetType targetType, long targetId)
        => targetType switch
        {
            LikeTargetType.Post => _db.Likes.AnyAsync(l => l.UserId == userId && l.PostId == targetId),
            LikeTargetType.Comment => _db.Likes.AnyAsync(l => l.UserId == userId && l.CommentId == targetId),
            _ => Task.FromResult(false)
        };

    private Task<Like?> FindLikeAsync(string userId, LikeTargetType targetType, long targetId)
        => targetType switch
        {
            LikeTargetType.Post => _db.Likes.FirstOrDefaultAsync(l => l.UserId == userId && l.PostId == targetId),
            LikeTargetType.Comment => _db.Likes.FirstOrDefaultAsync(l => l.UserId == userId && l.CommentId == targetId),
            _ => Task.FromResult<Like?>(null)
        };
}
