namespace Api.Features.Moderation;

public class ModerationException : Exception
{
    public string Reason { get; }

    public ModerationException(string reason) : base(reason)
    {
        Reason = reason;
    }
}
