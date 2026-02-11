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
            roles: new[] { "Admin" },
            username: "admin");

        var alice = await EnsureUserAsync(userManager,
            email: "alice@local.test",
            password: "User123!",
            roles: new[] { "User" },
            username: "alice");

        var bob = await EnsureUserAsync(userManager,
            email: "bob@local.test",
            password: "User123!",
            roles: new[] { "User" },
            username: "bob");

        var clara = await EnsureUserAsync(userManager,
            email: "clara@local.test",
            password: "User123!",
            roles: new[] { "User" },
            username: "clara");

        // 3) Friendships (make a small friend graph)
        // Adjust if your Friendship entity is different.
        await EnsureFriendshipAsync(db, admin.Id, alice.Id);
        await EnsureFriendshipAsync(db, admin.Id, bob.Id);
        await EnsureFriendshipAsync(db, alice.Id, bob.Id);
        await EnsureFriendshipAsync(db, bob.Id, clara.Id);

        // 4) Friend requests (ensure at least 2)
        await EnsureMinimumFriendRequestsAsync(db, admin.Id, alice.Id, bob.Id, clara.Id);

        // 5) Attempts + per-game details (ensure at least 2 rows per table)
        var now = DateTime.UtcNow;

        await EnsureMinimumAttemptsAsync(db, admin.Id, alice.Id, now);
        await EnsureMinimumReactionDetailsAsync(db, admin.Id, alice.Id, now);
        await EnsureMinimumTypingDetailsAsync(db, admin.Id, alice.Id, now);
        await EnsureMinimumChimpDetailsAsync(db, admin.Id, alice.Id, now);
        await EnsureMinimumSequenceDetailsAsync(db, admin.Id, alice.Id, now);

        // 6) Social (posts/comments/likes) (ensure at least 2 rows per table)
        await EnsureMinimumPostsAsync(db, admin.Id, alice.Id, now);
        await EnsureMinimumCommentsAsync(db, bob.Id, clara.Id, now);
        await EnsureMinimumLikesAsync(db, admin.Id, alice.Id, bob.Id, clara.Id, now);
    }

    private static async Task<ApplicationUser> EnsureUserAsync(
        UserManager<ApplicationUser> userManager,
        string email,
        string password,
        string[] roles,
        string? username)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = username ?? email,
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

    private static async Task EnsureMinimumFriendRequestsAsync(
        ApplicationDbContext db,
        string adminId,
        string aliceId,
        string bobId,
        string claraId)
    {
        var existing = await db.FriendRequests.CountAsync();
        if (existing >= 2) return;

        var candidates = new[]
        {
            new Api.Domain.Friends.FriendRequest
            {
                FromUserId = aliceId,
                ToUserId = claraId,
                Status = Api.Domain.Friends.FriendRequestStatus.Pending,
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            },
            new Api.Domain.Friends.FriendRequest
            {
                FromUserId = claraId,
                ToUserId = adminId,
                Status = Api.Domain.Friends.FriendRequestStatus.Declined,
                CreatedAt = DateTime.UtcNow.AddDays(-3),
                RespondedAt = DateTime.UtcNow.AddDays(-3).AddHours(6)
            },
            new Api.Domain.Friends.FriendRequest
            {
                FromUserId = bobId,
                ToUserId = aliceId,
                Status = Api.Domain.Friends.FriendRequestStatus.Canceled,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                RespondedAt = DateTime.UtcNow.AddDays(-1).AddHours(2)
            }
        };

        foreach (var candidate in candidates)
        {
            if (await db.FriendRequests.CountAsync() >= 2) break;

            var exists = await db.FriendRequests.AnyAsync(fr =>
                fr.FromUserId == candidate.FromUserId &&
                fr.ToUserId == candidate.ToUserId &&
                fr.Status == candidate.Status);

            if (!exists)
            {
                db.FriendRequests.Add(candidate);
                await db.SaveChangesAsync();
            }
        }
    }

    private static async Task EnsureMinimumAttemptsAsync(
        ApplicationDbContext db,
        string adminId,
        string aliceId,
        DateTime now)
    {
        var existing = await db.Attempts.CountAsync();
        if (existing >= 2) return;

        await AddAttemptAsync(db, adminId, GameType.Reaction, value: 220, createdAt: now.AddMinutes(-120));
        await AddAttemptAsync(db, aliceId, GameType.Typing, value: 65, createdAt: now.AddMinutes(-110));
    }

    private static async Task EnsureMinimumReactionDetailsAsync(
        ApplicationDbContext db,
        string adminId,
        string aliceId,
        DateTime now)
    {
        var existing = await db.ReactionAttemptDetails.CountAsync();
        if (existing >= 2) return;

        var needed = 2 - existing;
        if (needed >= 1)
            await AddReactionAttemptAsync(db, adminId, now.AddMinutes(-90), value: 220, bestMs: 180, avgMs: 220, attempts: 5);
        if (needed >= 2)
            await AddReactionAttemptAsync(db, aliceId, now.AddMinutes(-85), value: 260, bestMs: 210, avgMs: 260, attempts: 5);
    }

    private static async Task EnsureMinimumTypingDetailsAsync(
        ApplicationDbContext db,
        string adminId,
        string aliceId,
        DateTime now)
    {
        var existing = await db.TypingAttemptDetails.CountAsync();
        if (existing >= 2) return;

        var needed = 2 - existing;
        if (needed >= 1)
            await AddTypingAttemptAsync(db, adminId, now.AddMinutes(-75), value: 78, wpm: 78, accuracy: 96.2m, characters: 310);
        if (needed >= 2)
            await AddTypingAttemptAsync(db, aliceId, now.AddMinutes(-70), value: 62, wpm: 62, accuracy: 92.0m, characters: 280);
    }

    private static async Task EnsureMinimumChimpDetailsAsync(
        ApplicationDbContext db,
        string adminId,
        string aliceId,
        DateTime now)
    {
        var existing = await db.ChimpAttemptDetails.CountAsync();
        if (existing >= 2) return;

        var needed = 2 - existing;
        if (needed >= 1)
            await AddChimpAttemptAsync(db, adminId, now.AddMinutes(-65), value: 12, level: 12, mistakes: 1, timeMs: 42000);
        if (needed >= 2)
            await AddChimpAttemptAsync(db, aliceId, now.AddMinutes(-60), value: 9, level: 9, mistakes: 2, timeMs: 51000);
    }

    private static async Task EnsureMinimumSequenceDetailsAsync(
        ApplicationDbContext db,
        string adminId,
        string aliceId,
        DateTime now)
    {
        var existing = await db.SequenceAttemptDetails.CountAsync();
        if (existing >= 2) return;

        var needed = 2 - existing;
        if (needed >= 1)
            await AddSequenceAttemptAsync(db, adminId, now.AddMinutes(-55), value: 10, level: 10, mistakes: 1, timeMs: 38000);
        if (needed >= 2)
            await AddSequenceAttemptAsync(db, aliceId, now.AddMinutes(-50), value: 11, level: 11, mistakes: 0, timeMs: 35000);
    }

    private static async Task EnsureMinimumPostsAsync(
    ApplicationDbContext db,
    string adminId,
    string aliceId,
    DateTime now)
    {
        var usedAttemptIds = await db.Posts
            .Select(p => p.AttemptId)
            .ToListAsync();

        // ---------- ADMIN POST (ensure 1) ----------
        var adminPostExists = await db.Posts.AnyAsync(p => p.UserId == adminId);

        if (!adminPostExists)
        {
            var adminAttemptId = await db.Attempts
                .Where(a => a.UserId == adminId && !usedAttemptIds.Contains(a.Id))
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => a.Id)
                .FirstOrDefaultAsync();

            if (adminAttemptId == 0)
            {
                var a = await AddAttemptAsync(
                    db,
                    adminId,
                    GameType.Reaction,
                    value: 230,
                    createdAt: now.AddMinutes(-40)
                );
                adminAttemptId = a.Id;
            }

            db.Posts.Add(new Post
            {
                UserId = adminId,
                AttemptId = adminAttemptId,
                Caption = "First post: reaction run",
                CreatedAt = now.AddMinutes(-34)
            });

            await db.SaveChangesAsync();
            usedAttemptIds.Add(adminAttemptId);
        }

        // ---------- ALICE POSTS (ensure 3) ----------
        var alicePostCount = await db.Posts.CountAsync(p => p.UserId == aliceId);
        var postsToAdd = 3 - alicePostCount;

        for (int i = 0; i < postsToAdd; i++)
        {
            var aliceAttemptId = await db.Attempts
                .Where(a =>
                    a.UserId == aliceId &&
                    !usedAttemptIds.Contains(a.Id))
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => a.Id)
                .FirstOrDefaultAsync();

            if (aliceAttemptId == 0)
            {
                var a = await AddAttemptAsync(
                    db,
                    aliceId,
                    GameType.Typing,
                    value: 60 + i * 3,
                    createdAt: now.AddMinutes(-30 - i * 5)
                );
                aliceAttemptId = a.Id;
            }

            db.Posts.Add(new Post
            {
                UserId = aliceId,
                AttemptId = aliceAttemptId,
                Caption = i switch
                {
                    0 => "Typing PB today 🔥",
                    1 => "Consistency paying off",
                    _ => "Another solid run 💪"
                },
                CreatedAt = now.AddMinutes(-33 - i * 4)
            });

            await db.SaveChangesAsync();
            usedAttemptIds.Add(aliceAttemptId);
        }
    }

    private static async Task EnsureMinimumCommentsAsync(
    ApplicationDbContext db,
    string bobId,
    string claraId,
    DateTime now)
    {
        var existing = await db.Comments.CountAsync();
        if (existing >= 6) return;

        var posts = await db.Posts
            .OrderBy(p => p.Id)
            .Select(p => p.Id)
            .ToListAsync();

        if (posts.Count == 0) return;

        var targetPost1 = posts[0];
        var targetPost2 = posts.Count > 1 ? posts[1] : posts[0];

        // -----------------------------
        // Post 1 Thread
        // -----------------------------
        if (await db.Comments.CountAsync() < 3)
        {
            // Top-level comment
            var root1 = new Comment
            {
                PostId = targetPost1,
                UserId = bobId,
                Content = "Nice run — keep it up!",
                CreatedAt = now.AddMinutes(-40)
            };

            db.Comments.Add(root1);
            await db.SaveChangesAsync();

            // Reply from Clara
            var reply1 = new Comment
            {
                PostId = targetPost1,
                UserId = claraId,
                ParentCommentId = root1.Id,
                Content = "Totally agree — great pace 💪",
                CreatedAt = now.AddMinutes(-38)
            };

            db.Comments.Add(reply1);
            await db.SaveChangesAsync();

            // Reply back from Bob
            var reply2 = new Comment
            {
                PostId = targetPost1,
                UserId = bobId,
                ParentCommentId = reply1.Id,
                Content = "Thanks! Training is paying off 😄",
                CreatedAt = now.AddMinutes(-36)
            };

            db.Comments.Add(reply2);
            await db.SaveChangesAsync();
        }

        // -----------------------------
        // Post 2 Thread
        // -----------------------------
        if (await db.Comments.CountAsync() < 6)
        {
            // Top-level comment
            var root2 = new Comment
            {
                PostId = targetPost2,
                UserId = claraId,
                Content = "Solid score!",
                CreatedAt = now.AddMinutes(-30)
            };

            db.Comments.Add(root2);
            await db.SaveChangesAsync();

            // Reply from Bob
            var reply3 = new Comment
            {
                PostId = targetPost2,
                UserId = bobId,
                ParentCommentId = root2.Id,
                Content = "Yeah that was impressive 🔥",
                CreatedAt = now.AddMinutes(-28)
            };

            db.Comments.Add(reply3);
            await db.SaveChangesAsync();

            var reply4 = new Comment
            {
                PostId = targetPost2,
                UserId = claraId,
                ParentCommentId = reply3.Id,
                Content = "Next goal: break 100 😅",
                CreatedAt = now.AddMinutes(-26)
            };

            db.Comments.Add(reply4);
            await db.SaveChangesAsync();
        }
    }

    private static async Task EnsureMinimumLikesAsync(
        ApplicationDbContext db,
        string adminId,
        string aliceId,
        string bobId,
        string claraId,
        DateTime now)
    {
        var existing = await db.Likes.CountAsync();
        if (existing >= 2) return;

        var posts = await db.Posts.OrderBy(p => p.Id).Select(p => p.Id).ToListAsync();
        var comments = await db.Comments.OrderBy(c => c.Id).Select(c => c.Id).ToListAsync();

        if (posts.Count > 0 && await db.Likes.CountAsync() < 2)
        {
            var postId = posts[0];
            var exists = await db.Likes.AnyAsync(l => l.UserId == bobId && l.PostId == postId);
            if (!exists)
            {
                db.Likes.Add(new Like
                {
                    UserId = bobId,
                    PostId = postId,
                    CreatedAt = now.AddMinutes(-30)
                });
                await db.SaveChangesAsync();
            }
        }

        if (comments.Count > 0 && await db.Likes.CountAsync() < 2)
        {
            var commentId = comments[0];
            var exists = await db.Likes.AnyAsync(l => l.UserId == claraId && l.CommentId == commentId);
            if (!exists)
            {
                db.Likes.Add(new Like
                {
                    UserId = claraId,
                    CommentId = commentId,
                    CreatedAt = now.AddMinutes(-29)
                });
                await db.SaveChangesAsync();
            }
        }

        // Fallback if DB already had duplicates that prevented inserts above.
        if (await db.Likes.CountAsync() < 2 && posts.Count > 0)
        {
            var postId = posts[^1];
            var exists = await db.Likes.AnyAsync(l => l.UserId == aliceId && l.PostId == postId);
            if (!exists)
            {
                db.Likes.Add(new Like
                {
                    UserId = aliceId,
                    PostId = postId,
                    CreatedAt = now.AddMinutes(-28)
                });
                await db.SaveChangesAsync();
            }
        }

        if (await db.Likes.CountAsync() < 2 && comments.Count > 0)
        {
            var commentId = comments[^1];
            var exists = await db.Likes.AnyAsync(l => l.UserId == adminId && l.CommentId == commentId);
            if (!exists)
            {
                db.Likes.Add(new Like
                {
                    UserId = adminId,
                    CommentId = commentId,
                    CreatedAt = now.AddMinutes(-27)
                });
                await db.SaveChangesAsync();
            }
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
        int avgMs,
        int attempts)
    {
        var attempt = await AddAttemptAsync(db, userId, GameType.Reaction, value, createdAt);

        db.ReactionAttemptDetails.Add(new ReactionAttemptDetails
        {
            AttemptId = attempt.Id,
            BestMs = bestMs,
            AvgMs = avgMs,
            Attempts = attempts
        });

        await db.SaveChangesAsync();
    }

    private static async Task AddTypingAttemptAsync(
        ApplicationDbContext db,
        string userId,
        DateTime createdAt,
        int value,
        int wpm,
        decimal accuracy,
        int characters)
    {
        var attempt = await AddAttemptAsync(db, userId, GameType.Typing, value, createdAt);

        db.TypingAttemptDetails.Add(new TypingAttemptDetails
        {
            AttemptId = attempt.Id,
            Wpm = wpm,
            Accuracy = accuracy,
            Characters = characters
        });

        await db.SaveChangesAsync();
    }

    private static async Task AddChimpAttemptAsync(
        ApplicationDbContext db,
        string userId,
        DateTime createdAt,
        int value,
        int level,
        int mistakes,
        int timeMs)
    {
        var attempt = await AddAttemptAsync(db, userId, GameType.ChimpTest, value, createdAt);

        db.ChimpAttemptDetails.Add(new ChimpAttemptDetails
        {
            AttemptId = attempt.Id,
            Level = level,
            Mistakes = mistakes,
            TimeMs = timeMs
        });

        await db.SaveChangesAsync();
    }

    private static async Task AddSequenceAttemptAsync(
        ApplicationDbContext db,
        string userId,
        DateTime createdAt,
        int value,
        int level,
        int mistakes,
        int timeMs)
    {
        var attempt = await AddAttemptAsync(db, userId, GameType.SequenceTest, value, createdAt);

        db.SequenceAttemptDetails.Add(new SequenceAttemptDetails
        {
            AttemptId = attempt.Id,
            Level = level,
            Mistakes = mistakes,
            TimeMs = timeMs
        });

        await db.SaveChangesAsync();
    }
}
