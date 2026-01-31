namespace Api.Features.Comments;

using Api.Features.Users.Dtos;


public record CommentDto(
    long Id,
    long PostId,
    UserDto User,
    string Content,
    DateTime CreatedAt,
    int LikeCount,
    bool IsLiked,
    long? ParentCommentId
);

public record CreateCommentRequest(string Content, long? ParentCommentId);
public record PagedRequest(int Skip = 0, int Take = 20);
