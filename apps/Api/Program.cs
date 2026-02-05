using Api.Data;
using Api.Domain;
using Api.Middleware;
using DotNetEnv;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using Scalar.AspNetCore;
using System.Threading.RateLimiting;
using Api.Features.Messages;
using Api.Features.Friends;
using Api.hubs;
using Api.Features.WebSocket;


var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT");

if (!string.IsNullOrWhiteSpace(port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}
else if (builder.Environment.IsDevelopment())
{
    builder.WebHost.UseUrls("http://0.0.0.0:5014");
}

if (builder.Environment.IsDevelopment())
{
    Env.Load();
}

builder.Services.AddOpenApi();

builder.Services.AddScoped<Api.Features.Attempts.Services.AttemptWriter>();
builder.Services.AddScoped<Api.Features.Feed.FeedService>();
builder.Services.AddScoped<Api.Features.Likes.LikesService>();
builder.Services.AddScoped<Api.Features.Posts.PostsService>();
builder.Services.AddScoped<Api.Features.Leaderboards.LeaderboardService>();
builder.Services.AddScoped<Api.Features.Users.ProfileService>();
builder.Services.AddScoped<Api.Features.Comments.CommentService>();
builder.Services.AddScoped<MessageService>();
builder.Services.AddScoped<FriendsService>();
builder.Services.AddScoped<RealtimeMessageBroadcaster>();
builder.Services.AddScoped<NotificationSender>();
builder.Services.AddSingleton<IPresenceTracker, PresenceTracker>();
builder.Services.AddSingleton<RateLimitState>();

builder.Services.AddSignalR();

var connectionString =
    Environment.GetEnvironmentVariable("CONNECTION_STRING")
    ?? Environment.GetEnvironmentVariable("SQLCONNSTR_CONNECTION_STRING");

if (string.IsNullOrWhiteSpace(connectionString))
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ApplicationDbContext>(opt => opt.UseSqlServer(connectionString));

builder.Services
    .AddIdentityApiEndpoints<ApplicationUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

builder.Services.AddControllers();
builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddFixedWindowLimiter("fixed", opt =>
    {
        opt.PermitLimit = 60;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
});

builder.Services.AddHsts(options =>
{
    options.Preload = true;
    options.IncludeSubDomains = true;
    options.MaxAge = TimeSpan.FromDays(365);
});

if (!builder.Environment.IsDevelopment())
{
    builder.Services.AddApplicationInsightsTelemetry();
}

var app = builder.Build();

app.UseRequestLogging();


app.Use(async (ctx, next) =>
{
    var userId = ctx.User?.Identity?.IsAuthenticated == true
        ? ctx.User.FindFirst("sub")?.Value
          ?? ctx.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        : null;

    var ip = ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    var key = userId is not null ? $"user:{userId}" : $"ip:{ip}";

    const int limit = 60;
    var window = TimeSpan.FromMinutes(1);

    var rl = ctx.RequestServices.GetRequiredService<RateLimitState>();
    var (remaining, resetUnix) = rl.Hit(key, limit, window);

    ctx.Response.OnStarting(() =>
    {
        ctx.Response.Headers["RateLimit-Limit"] = limit.ToString();
        ctx.Response.Headers["RateLimit-Remaining"] = remaining.ToString();
        ctx.Response.Headers["RateLimit-Reset"] = resetUnix.ToString();
        ctx.Response.Headers["RateLimit-Policy"] = $"{limit};w={(int)window.TotalSeconds}";
        return Task.CompletedTask;
    });

    await next();

    if (ctx.Response.StatusCode == StatusCodes.Status429TooManyRequests)
    {
        var nowUnix = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var retryAfter = Math.Max(0, (int)(resetUnix - nowUnix));
        if (!ctx.Response.Headers.ContainsKey("Retry-After"))
            ctx.Response.Headers["Retry-After"] = retryAfter.ToString();
    }
});

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();


app.MapGet("/debug", () => Results.Ok(new
{
    ok = true,
    env = app.Environment.EnvironmentName,
    urls = app.Urls.ToArray()
}));

app.MapIdentityApi<ApplicationUser>().RequireRateLimiting("fixed");
app.MapControllers().RequireRateLimiting("fixed");

app.MapHub<NotificationsHub>("/hubs/notifications");
app.MapHub<ChatHub>("/hubs/chat");


Console.WriteLine("SignalR Hub mapped at: /hubs/notifications");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi("/openapi/{documentName}.json");
    app.MapScalarApiReference("/", options =>
    {
        options.WithOpenApiRoutePattern("/openapi/{documentName}.json");
    });
}

app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallbackToFile("index.html");

if (app.Environment.IsDevelopment())
{
    await DbSeeder.SeedAsync(app.Services);
}

app.Lifetime.ApplicationStarted.Register(() =>
{
    Console.WriteLine("==================================");
    Console.WriteLine("API STARTED");
    Console.WriteLine($"Environment: {app.Environment.EnvironmentName}");

    foreach (var url in app.Urls)
        Console.WriteLine($"Listening on: {url}");

    var first = app.Urls.FirstOrDefault();
    if (first is not null)
    {
        Console.WriteLine($"Debug: {first}/debug");
        Console.WriteLine($"Hub:   {first}/hubs/notifications");
        if (app.Environment.IsDevelopment())
            Console.WriteLine($"Scalar: {first}/");
    }

    Console.WriteLine("==================================");
});

app.Run();
