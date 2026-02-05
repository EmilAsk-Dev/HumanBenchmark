using System.Collections.Concurrent;

public sealed class RateLimitState
{
    private readonly ConcurrentDictionary<string, (long windowStartTicks, int count)> _state = new();

    public (int remaining, long resetUnixSeconds) Hit(string key, int limit, TimeSpan window)
    {
        var now = DateTimeOffset.UtcNow;
        var windowStart = new DateTimeOffset(
            now.Year, now.Month, now.Day,
            now.Hour, now.Minute, 0,
            TimeSpan.Zero);


        var windowStartTicks = windowStart.UtcTicks;
        var reset = windowStart.Add(window);

        var entry = _state.AddOrUpdate(
            key,
            _ => (windowStartTicks, 1),
            (_, prev) =>
            {
                if (prev.windowStartTicks != windowStartTicks)
                    return (windowStartTicks, 1);

                return (prev.windowStartTicks, prev.count + 1);
            });

        var remaining = Math.Max(0, limit - entry.count);
        return (remaining, reset.ToUnixTimeSeconds());
    }
}
