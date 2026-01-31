namespace Api.Features.Posts.Dtos;

using Api.Domain;

public record GetPostResponse(
    PostDto Post
);

public record AttemptDetailsDto(
  ReactionDetailsDto? Reaction,
  TypingDetailsDto? Typing,
  ChimpDetailsDto? Chimp,
  SequenceDetailsDto? Sequence
);

public record ReactionDetailsDto(int BestMs, int AvgMs, int Attempts);
public record TypingDetailsDto(int Wpm, decimal Accuracy, int Characters);
public record ChimpDetailsDto(int Level, int Mistakes, int TimeMs);
public record SequenceDetailsDto(int Level, int Mistakes, int TimeMs);

