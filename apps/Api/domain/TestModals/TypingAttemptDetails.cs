namespace Api.Domain;

public class TypingAttemptDetails
{
    public long AttemptId { get; set; }
    public int Wpm { get; set; }
    public decimal Accuracy { get; set; } 
    public int Characters { get; set; }

    public Attempt Attempt { get; set; } = default!;
}
