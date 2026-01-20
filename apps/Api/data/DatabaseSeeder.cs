using Api.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        // Ensure DB exists (for local dev + tests).
        // If you use migrations, you can use MigrateAsync instead.
        await db.Database.MigrateAsync();

        // 1) Roles
        var roles = new[] { "Admin", "User" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // 2) Users
        var admin = await EnsureUserAsync(userManager,
            email: "admin@local.test",
            password: "Admin123!",
            roles: new[] { "Admin" });

        var alice = await EnsureUserAsync(userManager,
            email: "alice@local.test",
            password: "User123!",
            roles: new[] { "User" });

        var bob = await EnsureUserAsync(userManager,
            email: "bob@local.test",
            password: "User123!",
            roles: new[] { "User" });

        var clara = await EnsureUserAsync(userManager,
            email: "clara@local.test",
            password: "User123!",
            roles: new[] { "User" });

        // 3) Friendships (make a small friend graph)
        // Adjust if your Friendship entity is different.
        await EnsureFriendshipAsync(db, admin.Id, alice.Id);
        await EnsureFriendshipAsync(db, admin.Id, bob.Id);
        await EnsureFriendshipAsync(db, alice.Id, bob.Id);
        await EnsureFriendshipAsync(db, bob.Id, clara.Id);

        // 4) Attempts + per-game details
        // Only seed if empty (keeps it idempotent)
        var hasAttempts = await db.Attempts.AnyAsync();
        if (!hasAttempts)
        {
            var now = DateTime.UtcNow;

            // Admin attempts
            await AddReactionAttemptAsync(db, admin.Id, now.AddMinutes(-60), value: 220, bestMs: 180, avgMs: 220);
            await AddTypingAttemptAsync(db, admin.Id, now.AddMinutes(-45), value: 78, wpm: 78, accuracy: 96.2m);
            await AddAttemptAsync(db, admin.Id, GameType.ChimpTest, value: 12, createdAt: now.AddMinutes(-30));
            await AddAttemptAsync(db, admin.Id, GameType.SequenceTest, value: 10, createdAt: now.AddMinutes(-20));

            // Alice attempts
            await AddReactionAttemptAsync(db, alice.Id, now.AddMinutes(-70), value: 260, bestMs: 210, avgMs: 260);
            await AddTypingAttemptAsync(db, alice.Id, now.AddMinutes(-50), value: 62, wpm: 62, accuracy: 92.0m);
            await AddAttemptAsync(db, alice.Id, GameType.ChimpTest, value: 9, createdAt: now.AddMinutes(-35));

            // Bob attempts
            await AddReactionAttemptAsync(db, bob.Id, now.AddMinutes(-80), value: 240, bestMs: 195, avgMs: 240);
            await AddTypingAttemptAsync(db, bob.Id, now.AddMinutes(-55), value: 85, wpm: 85, accuracy: 97.5m);
            await AddAttemptAsync(db, bob.Id, GameType.SequenceTest, value: 11, createdAt: now.AddMinutes(-25));

            // Clara attempts
            await AddAttemptAsync(db, clara.Id, GameType.ChimpTest, value: 8, createdAt: now.AddMinutes(-40));
            await AddTypingAttemptAsync(db, clara.Id, now.AddMinutes(-15), value: 54, wpm: 54, accuracy: 90.1m);

            await db.SaveChangesAsync();
        }
    }

    private static async Task<ApplicationUser> EnsureUserAsync(
        UserManager<ApplicationUser> userManager,
        string email,
        string password,
        string[] roles)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true
            };

            var create = await userManager.CreateAsync(user, password);
            if (!create.Succeeded)
            {
                var msg = string.Join(", ", create.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed creating user {email}: {msg}");
            }
        }

        foreach (var role in roles)
        {
            if (!await userManager.IsInRoleAsync(user, role))
                await userManager.AddToRoleAsync(user, role);
        }

        return user;
    }

    private static async Task EnsureFriendshipAsync(ApplicationDbContext db, string a, string b)
    {
        if (a == b) return;

        var min = string.CompareOrdinal(a, b) < 0 ? a : b;
        var max = string.CompareOrdinal(a, b) < 0 ? b : a;

        var exists = await db.Friendships.AnyAsync(f => f.UserAId == min && f.UserBId == max);
        if (!exists)
        {
            db.Friendships.Add(new Domain.Friends.Friendship
            {
                UserAId = min,
                UserBId = max,
                CreatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();
        }
    }

    private static async Task<Attempt> AddAttemptAsync(
        ApplicationDbContext db,
        string userId,
        GameType game,
        int value,
        DateTime createdAt)
    {
        var attempt = new Attempt
        {
            UserId = userId,
            Game = game,
            Value = value,
            CreatedAt = createdAt
        };

        db.Attempts.Add(attempt);
        await db.SaveChangesAsync(); // so AttemptId exists for detail rows
        return attempt;
    }

    private static async Task AddReactionAttemptAsync(
        ApplicationDbContext db,
        string userId,
        DateTime createdAt,
        int value,
        int bestMs,
        int avgMs)
    {
        var attempt = await AddAttemptAsync(db, userId, GameType.Reaction, value, createdAt);

        db.ReactionAttemptDetails.Add(new ReactionAttemptDetails
        {
            AttemptId = attempt.Id,
            BestMs = bestMs,
            AvgMs = avgMs
        });

        await db.SaveChangesAsync();
    }

    private static async Task AddTypingAttemptAsync(
        ApplicationDbContext db,
        string userId,
        DateTime createdAt,
        int value,
        int wpm,
        decimal accuracy)
    {
        var attempt = await AddAttemptAsync(db, userId, GameType.Typing, value, createdAt);

        db.TypingAttemptDetails.Add(new TypingAttemptDetails
        {
            AttemptId = attempt.Id,
            Wpm = wpm,
            Accuracy = accuracy
        });

        await db.SaveChangesAsync();
    }
}
