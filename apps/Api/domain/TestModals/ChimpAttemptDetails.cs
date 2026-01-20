namespace Api.Domain;

public class ChimpAttemptDetails
{
    public long AttemptId { get; set; }
    public int Level { get; set; }
    public int Mistakes { get; set; }
    public int TimeMs { get; set; }

    public Attempt Attempt { get; set; } = default!;
}
