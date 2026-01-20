namespace Api.Domain;

public class ReactionAttemptDetails
{
    public long AttemptId { get; set; }
    public int BestMs { get; set; }
    public int AvgMs { get; set; }
    public int Attempts { get; set; }

    public Attempt Attempt { get; set; } = default!;
}