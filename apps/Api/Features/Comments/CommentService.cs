using Api.Data;
using Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace Api.Features.Comments;

public class CommentService
{
    private readonly ApplicationDbContext _db;

    public CommentService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<CommentDto>> GetForPostAsync(long postId, string me, int skip, int take)
    {
        take = Math.Clamp(take, 1, 200);
        skip = Math.Max(skip, 0);

        return await _db.Comments
            .AsNoTracking()
            .Where(c => c.PostId == postId)
            .OrderByDescending(c => c.CreatedAt)
            .Skip(skip)
            .Take(take)
            .Select(c => new CommentDto(
                c.Id,
                c.PostId,
                c.UserId,
                c.Content,
                c.CreatedAt,
                LikeCount: c.Likes.Count,
                IsLiked: c.Likes.Any(l => l.UserId == me)
            ))
            .ToListAsync();
    }

    public async Task<CommentDto?> AddAsync(long postId, string me, CreateCommentRequest req)
    {
        var content = (req.Content ?? "").Trim();
        if (content.Length == 0) throw new ArgumentException("Comment content is required.");
        if (content.Length > 2000) throw new ArgumentException("Comment is too long (max 2000 chars).");

        if (req.ReplyToCommentId is not null)
        {
            var parent = await _db.Comments
                .AsNoTracking()
                .Where(c => c.Id == req.ReplyToCommentId.Value)
                .Select(c => new { c.Id, c.PostId })
                .FirstOrDefaultAsync();

            if (parent is null) throw new ArgumentException("Reply target not found.");
            if (parent.PostId != postId) throw new ArgumentException("Reply target must be in same post.");
        }

        var comment = new Comment
        {
            PostId = postId,
            UserId = me,
            Content = content,
            CreatedAt = DateTime.UtcNow
        };

        _db.Comments.Add(comment);
        await _db.SaveChangesAsync();

        return new CommentDto(
            comment.Id,
            comment.PostId,
            comment.UserId,
            comment.Content,
            comment.CreatedAt,
            LikeCount: 0,
            IsLiked: false
        );
    }

    public async Task<bool> DeleteAsync(long commentId, string me, bool allowAdmins = false)
    {
        var comment = await _db.Comments.FirstOrDefaultAsync(c => c.Id == commentId);
        if (comment is null) return false;

        if (comment.UserId != me && !allowAdmins)
            throw new UnauthorizedAccessException("Not allowed to delete this comment.");

        _db.Comments.Remove(comment);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<(int likeCount, bool isLiked)> ToggleLikeAsync(long commentId, string me)
    {
        var commentExists = await _db.Comments.AsNoTracking().AnyAsync(c => c.Id == commentId);
        if (!commentExists) throw new ArgumentException("Comment not found.");

        var existing = await _db.Comments
            .FirstOrDefaultAsync(l => l.Id == commentId && l.UserId == me);

        if (existing is null)
        {
            _db.Comments.Add(new Comment
            {
                Id = commentId,
                UserId = me,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            _db.Comments.Remove(existing);
        }

        await _db.SaveChangesAsync();

        var likeCount = await _db.Comments.CountAsync(l => l.Id == commentId);
        var isLiked = await _db.Comments.AnyAsync(l => l.Id == commentId && l.UserId == me);

        return (likeCount, isLiked);
    }
}
