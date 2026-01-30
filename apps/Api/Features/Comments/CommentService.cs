using Api.Data;
using Api.Domain;
using Microsoft.EntityFrameworkCore;
using Api.Features.Users.Dtos;
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
                Id: c.Id,
                PostId: c.PostId,
                User: new UserDto(
                    Id: c.User.Id,
                    UserName: c.User.UserName!,
                    AvatarUrl: c.User.AvatarUrl
                ),
                Content: c.Content,
                CreatedAt: c.CreatedAt,
                LikeCount: c.Likes.Count,
                IsLiked: c.Likes.Any(l => l.UserId == me),
                ParentCommentId: c.ParentCommentId
            ))
            .ToListAsync();
    }

    public async Task<CommentDto?> AddAsync(long postId, string me, CreateCommentRequest req)
    {
        var content = (req.Content ?? "").Trim();
        if (content.Length == 0) throw new ArgumentException("Comment content is required.");
        if (content.Length > 2000) throw new ArgumentException("Comment is too long (max 2000 chars).");

        long? parentId = null;

        if (req.ParentCommentId is not null)
        {
            var parent = await _db.Comments
                .AsNoTracking()
                .Where(c => c.Id == req.ParentCommentId.Value)
                .Select(c => new { c.Id, c.PostId })
                .FirstOrDefaultAsync();

            if (parent is null) throw new ArgumentException("Reply target not found.");
            if (parent.PostId != postId) throw new ArgumentException("Reply target must be in same post.");

            parentId = parent.Id;
        }

        var comment = new Comment
        {
            PostId = postId,
            UserId = me,
            Content = content,
            CreatedAt = DateTime.UtcNow,
            ParentCommentId = parentId
        };

        _db.Comments.Add(comment);
        await _db.SaveChangesAsync();

        // ✅ Re-query so User is populated and returned from DB
        return await _db.Comments
            .AsNoTracking()
            .Where(c => c.Id == comment.Id)
            .Select(c => new CommentDto(
                Id: c.Id,
                PostId: c.PostId,
                User: new UserDto(
                    Id: c.User.Id,
                    UserName: c.User.UserName!,
                    AvatarUrl: c.User.AvatarUrl
                ),
                Content: c.Content,
                CreatedAt: c.CreatedAt,
                LikeCount: 0,
                IsLiked: false,
                ParentCommentId: c.ParentCommentId
            ))
            .FirstAsync();
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
        // ⚠️ FIX ME: This must use your Like table, not Comments.
        // I can't write the correct version without seeing Api.Domain.Like.
        // For now, throw so you don’t corrupt data:
        throw new NotImplementedException("ToggleLikeAsync must be implemented using the Like entity/table.");
    }
}
