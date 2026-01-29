namespace Api.Features.Comments;

public record CommentDto(
    long Id,
    long PostId,
    string UserId,
    string Content,
    DateTime CreatedAt,
    int LikeCount,
    bool IsLiked,
    long? ParentCommentId
);

public record CreateCommentRequest(string Content, long? ParentCommentId);
public record PagedRequest(int Skip = 0, int Take = 20);