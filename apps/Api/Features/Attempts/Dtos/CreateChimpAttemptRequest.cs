namespace Api.Features.Attempts.Dtos;

public record CreateChimpAttemptRequest(
    int Level,
    int Mistakes,
    int TimeMs
);
