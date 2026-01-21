using Api.Data;
using Api.Domain;
using Api.Features.Posts.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Api.Features.Posts;

public class PostsService
{
    private readonly ApplicationDbContext _db;

    public PostsService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PostDto?> CreatePostAsync(string userId, CreatePostRequest request)
    {
        var attempt = await _db.Attempts
            .Include(a => a.ReactionDetails)
            .Include(a => a.TypingDetails)
            .Include(a => a.ChimpDetails)
            .Include(a => a.SequenceDetails)
            .FirstOrDefaultAsync(a => a.Id == request.AttemptId);

        if (attempt == null)
            return null;

        if (attempt.UserId != userId)
            return null;

        var existingPost = await _db.Posts.AnyAsync(p => p.AttemptId == request.AttemptId);
        if (existingPost)
            return null;

        var post = new Post
        {
            AttemptId = request.AttemptId,
            UserId = userId,
            Caption = request.Caption,
            CreatedAt = DateTime.UtcNow
        };

        _db.Posts.Add(post);
        await _db.SaveChangesAsync();

        return await GetPostByIdAsync(post.Id, userId);
    }

    public async Task<PostDto?> GetPostByIdAsync(long postId, string currentUserId)
    {
        var post = await _db.Posts
            .Include(p => p.Attempt)
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == postId);

        if (post == null)
            return null;

        var likeCount = 0;
        var isLikedByMe = false;

        var displayScore = FormatDisplayScore(post.Attempt);
        var percentile = await CalculatePercentileAsync(post.Attempt);

        return new PostDto(
            post.Id,
            post.CreatedAt,
            post.UserId,
            post.User.UserName ?? "Unknown",
            null,
            post.Attempt.Game,
            post.Attempt.Value,
            displayScore,
            percentile,
            post.Caption,
            likeCount,
            0,
            isLikedByMe
        );
    }

    private string FormatDisplayScore(Attempt attempt)
    {
        return attempt.Game switch
        {
            GameType.Reaction => $"{attempt.Value}ms",
            GameType.Typing => $"{attempt.Value} WPM",
            GameType.Chimp => $"Level {attempt.Value}",
            GameType.Sequence => $"Level {attempt.Value}",
            _ => attempt.Value.ToString()
        };
    }

    private async Task<double?> CalculatePercentileAsync(Attempt attempt)
    {
        var totalCount = await _db.Attempts
            .Where(a => a.Game == attempt.Game)
            .CountAsync();

        if (totalCount == 0)
            return null;

        int betterCount;

        if (attempt.Game == GameType.Reaction)
        {
            betterCount = await _db.Attempts
                .Where(a => a.Game == attempt.Game && a.Value < attempt.Value)
                .CountAsync();
        }
        else
        {
            betterCount = await _db.Attempts
                .Where(a => a.Game == attempt.Game && a.Value > attempt.Value)
                .CountAsync();
        }

        var percentile = ((double)(totalCount - betterCount) / totalCount) * 100;
        return Math.Round(percentile, 1);
    }
}
