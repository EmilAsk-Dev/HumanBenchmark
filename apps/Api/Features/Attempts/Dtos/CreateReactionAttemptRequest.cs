namespace Api.Features.Attempts.Dtos;

public record CreateReactionAttemptRequest(
    int BestMs,
    int AvgMs,
    int Attempts
);
