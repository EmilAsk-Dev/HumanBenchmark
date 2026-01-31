using Api.Domain;
using Api;
namespace Api.Features.Users.Dtos;

public record PersonalBestDto(
    GameType Game,
    int Value,
    string DisplayScore,
    DateTime CreatedAt,
    AttemptStatisticsDto? Statistics
);

public record AttemptStatisticsDto(
    ReactionAttemptDetailsDto? Reaction,
    ChimpAttemptDetailsDto? Chimp,
    TypingAttemptDetailsDto? Typing,
    SequenceAttemptDetailsDto? Sequence
);

public record ReactionAttemptDetailsDto(long AttemptId, int BestMs, int AvgMs, int Attempts);
public record ChimpAttemptDetailsDto(long AttemptId, int Level, int Mistakes, int TimeMs);
public record TypingAttemptDetailsDto(long AttemptId, int Wpm, decimal Accuracy, int Characters);
public record SequenceAttemptDetailsDto(long AttemptId, int Level, int Mistakes, int TimeMs);
