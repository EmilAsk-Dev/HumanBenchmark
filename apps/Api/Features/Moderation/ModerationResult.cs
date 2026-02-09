namespace Api.Features.Moderation;

public record ModerationResult(bool IsAllowed, string? Reason = null);
