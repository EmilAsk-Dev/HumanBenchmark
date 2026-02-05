using Api.Data;
using Api.Domain;
using Api.Domain.Friends;
using Api.Features.Leaderboards;
using Api.Features.Leaderboards.Dtos;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Api.Tests.Features.Leaderboard;

public class LeaderboardServiceTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task GetLeaderboardAsync_ReturnsEmptyEntries_WhenNoAttempts()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user = new ApplicationUser { Id = "user-1", UserName = "testuser", Email = "test@example.com" };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var service = new LeaderboardService(db);

        // Act
        var result = await service.GetLeaderboardAsync("user-1", GameType.Reaction, LeaderboardScope.Global, LeaderboardTimeframe.All, 10);

        // Assert
        Assert.Empty(result.Entries);
        Assert.Equal(0, result.TotalUsers);
    }

    [Fact]
    public async Task GetLeaderboardAsync_RanksCorrectly_ForReaction_LowerIsBetter()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user1 = new ApplicationUser { Id = "user-1", UserName = "fast", Email = "user1@example.com" };
        var user2 = new ApplicationUser { Id = "user-2", UserName = "slow", Email = "user2@example.com" };
        db.Users.AddRange(user1, user2);

        db.Attempts.AddRange(
            new Attempt { UserId = "user-1", Game = GameType.Reaction, Value = 150, CreatedAt = DateTime.UtcNow },
            new Attempt { UserId = "user-2", Game = GameType.Reaction, Value = 250, CreatedAt = DateTime.UtcNow }
        );
        await db.SaveChangesAsync();

        var service = new LeaderboardService(db);

        // Act
        var result = await service.GetLeaderboardAsync("user-1", GameType.Reaction, LeaderboardScope.Global, LeaderboardTimeframe.All, 10);

        // Assert
        Assert.Equal(2, result.Entries.Count);
        Assert.Equal("user-1", result.Entries[0].UserId); // 150ms is better (lower)
        Assert.Equal(1, result.Entries[0].Rank);
        Assert.Equal("user-2", result.Entries[1].UserId);
        Assert.Equal(2, result.Entries[1].Rank);
    }

    [Fact]
    public async Task GetLeaderboardAsync_RanksCorrectly_ForTyping_HigherIsBetter()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user1 = new ApplicationUser { Id = "user-1", UserName = "slow", Email = "user1@example.com" };
        var user2 = new ApplicationUser { Id = "user-2", UserName = "fast", Email = "user2@example.com" };
        db.Users.AddRange(user1, user2);

        db.Attempts.AddRange(
            new Attempt { UserId = "user-1", Game = GameType.Typing, Value = 50, CreatedAt = DateTime.UtcNow },
            new Attempt { UserId = "user-2", Game = GameType.Typing, Value = 100, CreatedAt = DateTime.UtcNow }
        );
        await db.SaveChangesAsync();

        var service = new LeaderboardService(db);

        // Act
        var result = await service.GetLeaderboardAsync("user-1", GameType.Typing, LeaderboardScope.Global, LeaderboardTimeframe.All, 10);

        // Assert
        Assert.Equal(2, result.Entries.Count);
        Assert.Equal("user-2", result.Entries[0].UserId); // 100 WPM is better (higher)
        Assert.Equal(1, result.Entries[0].Rank);
    }

    [Fact]
    public async Task GetLeaderboardAsync_UsesUsersBestScore()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user = new ApplicationUser { Id = "user-1", UserName = "testuser", Email = "test@example.com" };
        db.Users.Add(user);

        db.Attempts.AddRange(
            new Attempt { UserId = "user-1", Game = GameType.Reaction, Value = 200, CreatedAt = DateTime.UtcNow.AddMinutes(-2) },
            new Attempt { UserId = "user-1", Game = GameType.Reaction, Value = 150, CreatedAt = DateTime.UtcNow.AddMinutes(-1) },
            new Attempt { UserId = "user-1", Game = GameType.Reaction, Value = 180, CreatedAt = DateTime.UtcNow }
        );
        await db.SaveChangesAsync();

        var service = new LeaderboardService(db);

        // Act
        var result = await service.GetLeaderboardAsync("user-1", GameType.Reaction, LeaderboardScope.Global, LeaderboardTimeframe.All, 10);

        // Assert
        Assert.Single(result.Entries);
        Assert.Equal(150, result.Entries[0].BestScore); // Best score is 150ms
    }

    [Fact]
    public async Task GetLeaderboardAsync_FriendsScope_OnlyIncludesFriends()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user1 = new ApplicationUser { Id = "user-1", UserName = "me", Email = "user1@example.com" };
        var user2 = new ApplicationUser { Id = "user-2", UserName = "friend", Email = "user2@example.com" };
        var user3 = new ApplicationUser { Id = "user-3", UserName = "stranger", Email = "user3@example.com" };
        db.Users.AddRange(user1, user2, user3);

        db.Friendships.Add(new Friendship { UserAId = "user-1", UserBId = "user-2", CreatedAt = DateTime.UtcNow });

        db.Attempts.AddRange(
            new Attempt { UserId = "user-1", Game = GameType.Reaction, Value = 200, CreatedAt = DateTime.UtcNow },
            new Attempt { UserId = "user-2", Game = GameType.Reaction, Value = 150, CreatedAt = DateTime.UtcNow },
            new Attempt { UserId = "user-3", Game = GameType.Reaction, Value = 100, CreatedAt = DateTime.UtcNow }
        );
        await db.SaveChangesAsync();

        var service = new LeaderboardService(db);

        // Act
        var result = await service.GetLeaderboardAsync("user-1", GameType.Reaction, LeaderboardScope.Friends, LeaderboardTimeframe.All, 10);

        // Assert
        Assert.Equal(2, result.Entries.Count); // Only user-1 and user-2 (friends)
        Assert.DoesNotContain(result.Entries, e => e.UserId == "user-3");
    }

    [Fact]
    public async Task GetLeaderboardAsync_RespectsTimeframe()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user = new ApplicationUser { Id = "user-1", UserName = "testuser", Email = "test@example.com" };
        db.Users.Add(user);

        db.Attempts.AddRange(
            new Attempt { UserId = "user-1", Game = GameType.Reaction, Value = 200, CreatedAt = DateTime.UtcNow.AddDays(-10) }, // Old
            new Attempt { UserId = "user-1", Game = GameType.Reaction, Value = 150, CreatedAt = DateTime.UtcNow } // Recent
        );
        await db.SaveChangesAsync();

        var service = new LeaderboardService(db);

        // Act
        var result = await service.GetLeaderboardAsync("user-1", GameType.Reaction, LeaderboardScope.Global, LeaderboardTimeframe.Week, 10);

        // Assert
        Assert.Single(result.Entries);
        Assert.Equal(150, result.Entries[0].BestScore); // Only the recent attempt
    }

    [Fact]
    public async Task GetLeaderboardAsync_ReturnsCorrectMyStats()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user1 = new ApplicationUser { Id = "user-1", UserName = "me", Email = "user1@example.com" };
        var user2 = new ApplicationUser { Id = "user-2", UserName = "other", Email = "user2@example.com" };
        db.Users.AddRange(user1, user2);

        db.Attempts.AddRange(
            new Attempt { UserId = "user-1", Game = GameType.Reaction, Value = 200, CreatedAt = DateTime.UtcNow },
            new Attempt { UserId = "user-2", Game = GameType.Reaction, Value = 150, CreatedAt = DateTime.UtcNow }
        );
        await db.SaveChangesAsync();

        var service = new LeaderboardService(db);

        // Act
        var result = await service.GetLeaderboardAsync("user-1", GameType.Reaction, LeaderboardScope.Global, LeaderboardTimeframe.All, 10);

        // Assert
        Assert.Equal(1, result.Me.Attempts);
        Assert.Equal(200, result.Me.BestScore);
        Assert.Equal(2, result.Me.Rank); // user-2 has better score
    }

    [Fact]
    public async Task GetUserStatsAsync_ThrowsNotFoundException_WhenUserNotFound()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new LeaderboardService(db);

        // Act & Assert
        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.GetUserStatsAsync("user-1", "nonexistent", false, GameType.Reaction, LeaderboardTimeframe.All));
    }

    [Fact]
    public async Task GetUserStatsAsync_ThrowsForbiddenException_WhenNotFriends()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user1 = new ApplicationUser { Id = "user-1", UserName = "me", Email = "user1@example.com" };
        var user2 = new ApplicationUser { Id = "user-2", UserName = "stranger", Email = "user2@example.com" };
        db.Users.AddRange(user1, user2);
        await db.SaveChangesAsync();

        var service = new LeaderboardService(db);

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.GetUserStatsAsync("user-1", "user-2", false, GameType.Reaction, LeaderboardTimeframe.All));
    }

    [Fact]
    public async Task GetUserStatsAsync_AllowsAdminAccess()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user1 = new ApplicationUser { Id = "user-1", UserName = "admin", Email = "admin@example.com" };
        var user2 = new ApplicationUser { Id = "user-2", UserName = "user", Email = "user@example.com" };
        db.Users.AddRange(user1, user2);
        await db.SaveChangesAsync();

        var service = new LeaderboardService(db);

        // Act - Admin accessing non-friend's stats
        var result = await service.GetUserStatsAsync("user-1", "user-2", isAdmin: true, GameType.Reaction, LeaderboardTimeframe.All);

        // Assert
        Assert.Equal("user-2", result.UserId);
    }
}
