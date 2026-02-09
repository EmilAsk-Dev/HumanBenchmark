using Api.Data;
using Api.Domain;
using Api.Features.Moderation;
using Api.Features.Posts.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Api.Features.Posts;

public class PostsService
{
    private readonly ApplicationDbContext _db;
    private readonly IContentModerationService _moderationService;

    public PostsService(ApplicationDbContext db, IContentModerationService moderationService)
    {
        _db = db;
        _moderationService = moderationService;
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

        if (!string.IsNullOrWhiteSpace(request.Caption))
        {
            var moderationResult = await _moderationService.ModerateContentAsync(userId, request.Caption, "Post");
            if (!moderationResult.IsAllowed)
                throw new ModerationException(moderationResult.Reason ?? "Content not allowed");
        }

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
            .Include(p => p.Attempt).ThenInclude(a => a.ReactionDetails)
            .Include(p => p.Attempt).ThenInclude(a => a.TypingDetails)
            .Include(p => p.Attempt).ThenInclude(a => a.ChimpDetails)
            .Include(p => p.Attempt).ThenInclude(a => a.SequenceDetails)
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == postId);

        if (post == null)
            return null;

        var likeCount = 0;
        var isLikedByMe = false;

        var displayScore = FormatDisplayScore(post.Attempt);
        var percentile = await CalculatePercentileAsync(post.Attempt);

        var details = MapDetails(post.Attempt);

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
          isLikedByMe,
          details
        );
    }

    private string FormatDisplayScore(Attempt attempt)
    {
        return attempt.Game switch
        {
            GameType.Reaction => $"{attempt.Value}ms",
            GameType.Typing => $"{attempt.Value} WPM",
            GameType.ChimpTest => $"Level {attempt.Value}",
            GameType.SequenceTest => $"Level {attempt.Value}",
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

    private AttemptDetailsDto? MapDetails(Attempt attempt)
    {
        return attempt.Game switch
        {
            GameType.Reaction when attempt.ReactionDetails != null =>
              new AttemptDetailsDto(
                new ReactionDetailsDto(
                  attempt.ReactionDetails.BestMs,
                  attempt.ReactionDetails.AvgMs,
                  attempt.ReactionDetails.Attempts
                ),
                null, null, null
              ),

            GameType.Typing when attempt.TypingDetails != null =>
              new AttemptDetailsDto(
                null,
                new TypingDetailsDto(
                  attempt.TypingDetails.Wpm,
                  attempt.TypingDetails.Accuracy,
                  attempt.TypingDetails.Characters
                ),
                null, null
              ),

            GameType.ChimpTest when attempt.ChimpDetails != null =>
              new AttemptDetailsDto(
                null, null,
                new ChimpDetailsDto(
                  attempt.ChimpDetails.Level,
                  attempt.ChimpDetails.Mistakes,
                  attempt.ChimpDetails.TimeMs
                ),
                null
              ),

            GameType.SequenceTest when attempt.SequenceDetails != null =>
              new AttemptDetailsDto(
                null, null, null,
                new SequenceDetailsDto(
                  attempt.SequenceDetails.Level,
                  attempt.SequenceDetails.Mistakes,
                  attempt.SequenceDetails.TimeMs
                )
              ),

            _ => null
        };
    }
}
