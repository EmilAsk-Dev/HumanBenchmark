using Api.Domain;

namespace Api.Features.Feed.Dtos;

using Api.Features.Comments;
using Api.Features.Users.Dtos;
public record FeedItemDto(
    long Id,
    UserDto User,
    TestRunDto TestRun,
    DateTime CreatedAt,
    int LikeCount,
    bool IsLiked,
    List<CommentDto> Comments
);




public record TestRunDto(GameType TestType, int Score, int Percentile, object? Statistics);

public record AttemptStatsDto(
    ReactionAttemptDetails? Reaction,
    ChimpAttemptDetails? Chimp,
    TypingAttemptDetails? Typing,
    SequenceAttemptDetails? Sequence
);
