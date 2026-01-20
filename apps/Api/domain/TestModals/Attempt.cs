namespace Api.Domain;

public class Attempt
{
    public long Id { get; set; }

    public string UserId { get; set; } = default!;
    public GameType Game { get; set; }

    //Reaction: Value = BestMs(lower is better)
    //Typing: Value = Wpm(higher is better)
    //Chimp Test: Value = Level(higher is better)
    //Sequence Test: Value = Level or LongestSequence(higher is better)
    // för att kunna söka snabbare efter bästa resultat
    public int Value { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ReactionAttemptDetails? ReactionDetails { get; set; }
    public ChimpAttemptDetails? ChimpDetails { get; set; }
    public TypingAttemptDetails? TypingDetails { get; set; }
    public SequenceAttemptDetails? SequenceDetails { get; set; }
}
