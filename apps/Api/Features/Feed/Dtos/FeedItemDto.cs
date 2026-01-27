using Api.Domain;
using Api.Features.Comments;

namespace Api.Features.Feed.Dtos;


public record FeedItemDto(
    long Id,
    UserDto User,
    TestRunDto TestRun,
    DateTime CreatedAt,
    int LikeCount,
    bool IsLiked,
    List<CommentDto> Comments
);

public record UserDto(string Id, string Username, string DisplayName);

public record TestRunDto(GameType TestType, int Score, int Percentile, object? Statistics);

public record AttemptStatsDto(
    ReactionAttemptDetails? Reaction,
    ChimpAttemptDetails? Chimp,
    TypingAttemptDetails? Typing,
    SequenceAttemptDetails? Sequence
);
