// Program.cs
using Api.Data;
using Api.Domain;
using DotNetEnv;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

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

var connectionString = Environment.GetEnvironmentVariable("CONNECTION_STRING");
if (string.IsNullOrWhiteSpace(connectionString))
{
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
}

builder.Services.AddDbContext<ApplicationDbContext>(opt =>
    opt.UseSqlServer(connectionString));

builder.Services
    .AddIdentityApiEndpoints<ApplicationUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

builder.Services.AddControllers();
builder.Services.AddAuthorization();

// ======================================================
// App
// ======================================================
var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapIdentityApi<ApplicationUser>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi("/openapi/{documentName}.json");
    app.MapScalarApiReference("/", options =>
    {
        options.WithOpenApiRoutePattern("/openapi/{documentName}.json");
    });
}

if (app.Environment.IsDevelopment())
{
    await DbSeeder.SeedAsync(app.Services);
}

app.Lifetime.ApplicationStarted.Register(() =>
{
    foreach (var url in app.Urls)
        Console.WriteLine($"Listening on: {url}");

    var first = app.Urls.FirstOrDefault();
    if (first is not null && app.Environment.IsDevelopment())
        Console.WriteLine($"Scalar: {first}/");
});

app.MapControllers();

app.Run();
