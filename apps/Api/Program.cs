using Api.Data;
using Api.Domain;
using DotNetEnv;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Api.Middleware;


var builder = WebApplication.CreateBuilder(args);

// ======================================================
// Hosting / Port (Azure App Service sets PORT)
// ======================================================
var port = Environment.GetEnvironmentVariable("PORT");

if (!string.IsNullOrWhiteSpace(port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}
else if (builder.Environment.IsDevelopment())
{
    builder.WebHost.UseUrls("http://0.0.0.0:5014");
}

// ======================================================
// Env
// ======================================================
if (builder.Environment.IsDevelopment())
{
    Env.Load();
}

// ======================================================
// Services
// ======================================================
builder.Services.AddOpenApi();

builder.Services.AddScoped<Api.Features.Attempts.Services.AttemptWriter>();
builder.Services.AddScoped<Api.Features.Feed.FeedService>();
builder.Services.AddScoped<Api.Features.Likes.LikesService>();
builder.Services.AddScoped<Api.Features.Posts.PostsService>();
builder.Services.AddScoped<Api.Features.Leaderboards.LeaderboardService>();
builder.Services.AddScoped<Api.Features.Users.ProfileService>();
builder.Services.AddScoped<Api.Features.Comments.CommentService>();

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
    // If you want requests above the limit to return 429 automatically
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Global policy name
    options.AddFixedWindowLimiter("fixed", opt =>
    {
        opt.PermitLimit = 60;                 // 60 requests
        opt.Window = TimeSpan.FromMinutes(1); // per 1 minute
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;                   // don't queue, just reject
    });
});

builder.Services.AddHsts(options =>
{
    options.Preload = true;
    options.IncludeSubDomains = true;
    options.MaxAge = TimeSpan.FromDays(365);
});

// ======================================================
// App
// ======================================================
var app = builder.Build();

app.UseRequestLogging();
builder.Services.AddApplicationInsightsTelemetry();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers().RequireRateLimiting("fixed");
app.MapIdentityApi<ApplicationUser>();
app.MapControllers();

// ======================================================
// Swagger/Scalar (dev only)
// ======================================================
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi("/openapi/{documentName}.json");
    app.MapScalarApiReference("/", options =>
    {
        options.WithOpenApiRoutePattern("/openapi/{documentName}.json");
    });
}

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseHttpsRedirection();



// ======================================================
// Serve React from wwwroot (same origin)
// IMPORTANT: This requires your pipeline to copy apps/web/dist -> API publish wwwroot
// ======================================================
app.UseDefaultFiles();     // serves /index.html automatically
app.UseStaticFiles();      // serves /assets/* etc
app.MapFallbackToFile("index.html"); // React Router support



// ======================================================
// Seeder (dev only)
// ======================================================
if (app.Environment.IsDevelopment())
{
    await DbSeeder.SeedAsync(app.Services);
}

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.Migrate();
}

app.Lifetime.ApplicationStarted.Register(() =>
{
    foreach (var url in app.Urls)
        Console.WriteLine($"Listening on: {url}");

    var first = app.Urls.FirstOrDefault();
    if (first is not null && app.Environment.IsDevelopment())
        Console.WriteLine($"Scalar: {first}/");
});

app.Run();
