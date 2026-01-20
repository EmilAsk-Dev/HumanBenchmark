namespace Api.Features.Attempts.Dtos;

public record CreateSequenceAttemptRequest(
    int Level,
    int Mistakes,
    int TimeMs
);
