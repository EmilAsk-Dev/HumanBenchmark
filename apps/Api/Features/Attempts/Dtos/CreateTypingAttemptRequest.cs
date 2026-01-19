namespace Api.Features.Attempts.Dtos;

public record CreateTypingAttemptRequest(
    int Wpm,
    decimal Accuracy,
    int Characters
);
