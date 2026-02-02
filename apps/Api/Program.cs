using Api.Data;
using Api.Domain;
using Api.Middleware;
using DotNetEnv;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using Scalar.AspNetCore;
using System.Threading.RateLimiting;

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

builder.Services.AddApplicationInsightsTelemetry();

var app = builder.Build();

app.UseRequestLogging();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapIdentityApi<ApplicationUser>().RequireRateLimiting("fixed");
app.MapControllers().RequireRateLimiting("fixed");

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
