using System.Security.Claims;
using Api.Data;
using Api.Domain;
using Api.Middleware;
using DotNetEnv;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using System.Threading.RateLimiting;
using Api.Features.Messages;
using Api.Features.Friends;
using Api.Features.Moderation;
using Api.hubs;
using Api.Features.WebSocket;
using Microsoft.AspNetCore.Antiforgery;

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
builder.Services.AddScoped<IContentModerationService, ContentModerationService>();

builder.Services.AddSignalR();

var connectionString =
    Environment.GetEnvironmentVariable("CONNECTION_STRING")
    ?? Environment.GetEnvironmentVariable("SQLCONNSTR_CONNECTION_STRING");

var apiKey = Environment.GetEnvironmentVariable("AZURE_OPENAI_API_KEY");
if (string.IsNullOrWhiteSpace(apiKey))
    Console.WriteLine("Warning: AZURE_OPENAI_API_KEY is not set. Content moderation will not work.");

if (string.IsNullOrWhiteSpace(connectionString))
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ApplicationDbContext>(opt => opt.UseSqlServer(connectionString));

builder.Services
    .AddIdentityApiEndpoints<ApplicationUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

builder.Services.ConfigureApplicationCookie(options =>
{
    // Cookie-based auth: tighten defaults in Production, keep Dev workable on http://localhost
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;
    options.Cookie.SameSite = builder.Environment.IsDevelopment()
        ? SameSiteMode.Lax
        : SameSiteMode.Strict;
});

builder.Services.AddAntiforgery(options =>
{
    // SPA double-submit: JS reads token from response and sends header.
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.Name = "XSRF-TOKEN";
    options.Cookie.HttpOnly = false; // readable by JS
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;
    options.Cookie.SameSite = builder.Environment.IsDevelopment()
        ? SameSiteMode.Lax
        : SameSiteMode.Strict;
});

builder.Services.AddControllers();
builder.Services.AddAuthorization();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("fixed", context =>
    {
        var userId =
            context.User?.FindFirstValue(ClaimTypes.NameIdentifier) ??
            context.User?.FindFirst("sub")?.Value;

        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var key = !string.IsNullOrWhiteSpace(userId) ? $"user:{userId}" : $"ip:{ip}";

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: key,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 360,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
                AutoReplenishment = true
            });
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

app.UseForwardedHeaders();

app.UseRequestLogging();

if (!app.Environment.IsDevelopment())
{
    app.Use((context, next) =>
    {
        var headers = context.Response.Headers;
        headers["X-Content-Type-Options"] = "nosniff";
        headers["Referrer-Policy"] = "no-referrer";
        headers["X-Frame-Options"] = "DENY";
        headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()";

        return next();
    });

    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.UseRateLimiter();

// Issue CSRF token for SPA clients (used by apiRequest for unsafe methods).
app.MapGet("/api/csrf", (HttpContext context, IAntiforgery antiforgery, ILoggerFactory loggerFactory) =>
{
    try
    {
        var tokens = antiforgery.GetAndStoreTokens(context);
        return Results.Ok(new { token = tokens.RequestToken });
    }
    catch (Exception ex)
    {
        var logger = loggerFactory.CreateLogger("CSRF");
        logger.LogError(ex, "Failed to issue CSRF token");

        return app.Environment.IsDevelopment()
            ? Results.Problem(
                title: "Failed to issue CSRF token",
                detail: ex.Message,
                statusCode: StatusCodes.Status500InternalServerError)
            : Results.Problem(statusCode: StatusCodes.Status500InternalServerError);
    }
}).RequireRateLimiting("fixed");

// Validate CSRF for authenticated, state-changing API calls.
app.Use(async (context, next) =>
{
    var method = context.Request.Method;
    var isUnsafe = !(HttpMethods.IsGet(method) || HttpMethods.IsHead(method) || HttpMethods.IsOptions(method) || HttpMethods.IsTrace(method));

    if (isUnsafe &&
        context.User?.Identity?.IsAuthenticated == true &&
        context.Request.Path.StartsWithSegments("/api") &&
        !context.Request.Path.StartsWithSegments("/api/auth") &&
        !context.Request.Path.StartsWithSegments("/api/csrf"))
    {
        var antiforgery = context.RequestServices.GetRequiredService<IAntiforgery>();
        try
        {
            await antiforgery.ValidateRequestAsync(context);
        }
        catch (Microsoft.AspNetCore.Antiforgery.AntiforgeryValidationException)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsJsonAsync(new { message = "Invalid CSRF token" });
            return;
        }
    }

    await next();
});

if (app.Environment.IsDevelopment())
{
    app.MapGet("/debug", () => Results.Ok(new
    {
        ok = true,
        env = app.Environment.EnvironmentName,
        urls = app.Urls.ToArray()
    }))
        .RequireRateLimiting("fixed");
}

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
else
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    // await db.Database.MigrateAsync();
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
