namespace Api.Features.Comments;

public record CommentDto(
    long Id,
    long PostId,
    string UserId,
    string Text,
    DateTime CreatedAt,
    int LikeCount,
    bool IsLiked
);

public record CreateCommentRequest(string Content, long? ReplyToCommentId = null);

public record PagedRequest(int Skip = 0, int Take = 20);