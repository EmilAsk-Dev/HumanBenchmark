namespace Api.Features.Attempts.Dtos;

public class CreateAttemptRequest
{
    public string Game { get; set; } = default!;
    public int Value { get; set; }

    public CreateReactionAttemptRequest? Reaction { get; set; }
    public CreateChimpAttemptRequest? Chimp { get; set; }
    public CreateTypingAttemptRequest? Typing { get; set; }
    public CreateSequenceAttemptRequest? Sequence { get; set; }
}