using System.Diagnostics;

namespace Api.Middleware;

public sealed class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        var sw = Stopwatch.StartNew();

        // Correlation id (use existing if present, otherwise create one)
        var correlationId =
            context.Request.Headers.TryGetValue("X-Correlation-ID", out var cid) && !string.IsNullOrWhiteSpace(cid)
                ? cid.ToString()
                : Guid.NewGuid().ToString("N");

        context.Response.Headers["X-Correlation-ID"] = correlationId;

        try
        {
            await _next(context);
            sw.Stop();

            // Log everything (info), and elevate 4xx/5xx
            var status = context.Response.StatusCode;
            var level =
                status >= 500 ? LogLevel.Error :
                status >= 400 ? LogLevel.Warning :
                LogLevel.Information;

            _logger.Log(level,
                "HTTP {Method} {Path}{Query} -> {StatusCode} in {ElapsedMs}ms (corr={CorrelationId})",
                context.Request.Method,
                context.Request.Path,
                context.Request.QueryString.HasValue ? context.Request.QueryString.Value : "",
                status,
                sw.ElapsedMilliseconds,
                correlationId
            );
        }
        catch (Exception ex)
        {
            sw.Stop();

            _logger.LogError(ex,
                "HTTP {Method} {Path}{Query} -> 500 in {ElapsedMs}ms (corr={CorrelationId})",
                context.Request.Method,
                context.Request.Path,
                context.Request.QueryString.HasValue ? context.Request.QueryString.Value : "",
                sw.ElapsedMilliseconds,
                correlationId
            );

            throw; // let your existing error middleware / ASP.NET handler produce the response
        }
    }
}
