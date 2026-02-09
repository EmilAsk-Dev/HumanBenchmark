using System.ClientModel;
using System.Text.Json;
using Azure.AI.OpenAI;
using OpenAI.Chat;
using Api.Data;
using Api.Domain.Moderation;

namespace Api.Features.Moderation;

public class ContentModerationService : IContentModerationService
{
    private readonly ChatClient _chatClient;
    private readonly ApplicationDbContext _db;
    private readonly ILogger<ContentModerationService> _logger;

    public ContentModerationService(
        IConfiguration config,
        ApplicationDbContext db,
        ILogger<ContentModerationService> logger)
    {
        var endpoint = config["AzureOpenAI:Endpoint"];
        var apiKey = Environment.GetEnvironmentVariable("AZURE_OPENAI_API_KEY");
        var deploymentName = config["AzureOpenAI:DeploymentName"];

        if (string.IsNullOrEmpty(endpoint) || string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(deploymentName))
        {
            throw new InvalidOperationException("Azure OpenAI configuration is missing. Check AzureOpenAI:Endpoint, AzureOpenAI:DeploymentName in appsettings and AZURE_OPENAI_API_KEY environment variable.");
        }

        var client = new AzureOpenAIClient(new Uri(endpoint), new ApiKeyCredential(apiKey));
        _chatClient = client.GetChatClient(deploymentName);
        _db = db;
        _logger = logger;
    }

    public async Task<ModerationResult> ModerateContentAsync(string userId, string content, string contentType)
    {
        _logger.LogDebug("Moderating {ContentType} for user {UserId}", contentType, userId);

        try
        {
            var systemPrompt = """
                You are a multilingual content moderator. Analyze the following text in ANY language and determine if it is appropriate for a public social platform.
                You MUST detect and moderate content regardless of the language it is written in (e.g. English, Swedish, Spanish, Arabic, Chinese, etc.).

                Reject content that contains:
                - Hate speech or discrimination
                - Harassment or bullying
                - Explicit sexual content
                - Graphic violence
                - Spam or advertising
                - Illegal content or activities
                - Personal information of others

                Respond ONLY with valid JSON in this exact format:
                {"allowed": true}
                or
                {"allowed": false, "reason": "brief explanation in English"}
                """;

            var response = await _chatClient.CompleteChatAsync(
                new ChatMessage[]
                {
                    new SystemChatMessage(systemPrompt),
                    new UserChatMessage(content)
                });

            var responseText = response.Value.Content[0].Text;
            _logger.LogDebug("Moderation response: {Response}", responseText);

            var jsonResponse = JsonSerializer.Deserialize<ModerationResponse>(responseText, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (jsonResponse == null)
            {
                _logger.LogWarning("Failed to parse moderation response, allowing content by default");
                return new ModerationResult(true);
            }

            if (!jsonResponse.Allowed)
            {
                _logger.LogInformation("Content flagged for user {UserId}: {Reason}", userId, jsonResponse.Reason);

                _db.FlaggedContent.Add(new FlaggedContent
                {
                    UserId = userId,
                    ContentType = contentType,
                    Content = content,
                    Reason = jsonResponse.Reason ?? "Unknown reason"
                });
                await _db.SaveChangesAsync();

                return new ModerationResult(false, jsonResponse.Reason);
            }

            return new ModerationResult(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Content moderation failed for user {UserId}. Rejecting content as a safety measure.", userId);
            return new ModerationResult(false, "Moderation service is unavailable. Please try again later.");
        }
    }

    private class ModerationResponse
    {
        public bool Allowed { get; set; }
        public string? Reason { get; set; }
    }
}
