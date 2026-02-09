namespace Api.Features.Moderation;

public interface IContentModerationService
{
    Task<ModerationResult> ModerateContentAsync(string userId, string content, string contentType);
}
