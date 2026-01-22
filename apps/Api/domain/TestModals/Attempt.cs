namespace Api.Domain;

public class Attempt
{
    public long Id { get; set; }

    public string UserId { get; set; } = default!;
    public GameType Game { get; set; }
    public int Value { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ReactionAttemptDetails? ReactionDetails { get; set; }
    public ChimpAttemptDetails? ChimpDetails { get; set; }
    public TypingAttemptDetails? TypingDetails { get; set; }
    public SequenceAttemptDetails? SequenceDetails { get; set; }
}
