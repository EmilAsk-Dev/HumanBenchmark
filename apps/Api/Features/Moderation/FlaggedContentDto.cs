namespace Api.Features.Moderation;

public record FlaggedContentDto(
    long Id,
    string UserId,
    string ContentType,
    string Content,
    string Reason,
    DateTime FlaggedAt,
    bool Reviewed
);
