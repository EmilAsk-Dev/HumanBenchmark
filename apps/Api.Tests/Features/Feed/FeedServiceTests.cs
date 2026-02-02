using Api.Data;
using Api.Domain;
using Api.Domain.Friends;
using Api.Features.Feed;
using Api.Features.Feed.Dtos;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Api.Tests.Features.Feed;

public class FeedServiceTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task GetFriendsFeedAsync_ReturnsEmpty_WhenNoFriends()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user = new ApplicationUser { Id = "user-1", UserName = "testuser", Email = "test@example.com" };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var service = new FeedService(db);

        // Act
        var result = await service.GetFriendsFeedAsync("user-1", new FeedRequest(50, 0));

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetFriendsFeedAsync_ReturnsFriendsPosts()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user1 = new ApplicationUser { Id = "user-1", UserName = "user1", Email = "user1@example.com" };
        var user2 = new ApplicationUser { Id = "user-2", UserName = "user2", Email = "user2@example.com" };
        db.Users.AddRange(user1, user2);

        // Create friendship
        db.Friendships.Add(new Friendship { UserAId = "user-1", UserBId = "user-2", CreatedAt = DateTime.UtcNow });

        // Create attempt and post for user2
        var attempt = new Attempt { UserId = "user-2", Game = GameType.Reaction, Value = 200, CreatedAt = DateTime.UtcNow };
        db.Attempts.Add(attempt);
        await db.SaveChangesAsync();

        var post = new Post { AttemptId = attempt.Id, UserId = "user-2", CreatedAt = DateTime.UtcNow };
        db.Posts.Add(post);
        await db.SaveChangesAsync();

        var service = new FeedService(db);

        // Act
        var result = await service.GetFriendsFeedAsync("user-1", new FeedRequest(50, 0));

        // Assert
        Assert.Single(result);
        Assert.Equal("user-2", result[0].User.Id);
    }

    [Fact]
    public async Task GetFriendsFeedAsync_DoesNotReturnNonFriendsPosts()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user1 = new ApplicationUser { Id = "user-1", UserName = "user1", Email = "user1@example.com" };
        var user2 = new ApplicationUser { Id = "user-2", UserName = "user2", Email = "user2@example.com" };
        var user3 = new ApplicationUser { Id = "user-3", UserName = "user3", Email = "user3@example.com" };
        db.Users.AddRange(user1, user2, user3);

        // user1 is friends with user2, but NOT user3
        db.Friendships.Add(new Friendship { UserAId = "user-1", UserBId = "user-2", CreatedAt = DateTime.UtcNow });

        // Create post for user3 (not a friend)
        var attempt = new Attempt { UserId = "user-3", Game = GameType.Reaction, Value = 200, CreatedAt = DateTime.UtcNow };
        db.Attempts.Add(attempt);
        await db.SaveChangesAsync();

        var post = new Post { AttemptId = attempt.Id, UserId = "user-3", CreatedAt = DateTime.UtcNow };
        db.Posts.Add(post);
        await db.SaveChangesAsync();

        var service = new FeedService(db);

        // Act
        var result = await service.GetFriendsFeedAsync("user-1", new FeedRequest(50, 0));

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetFriendsFeedAsync_RespectsSkipAndTake()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user1 = new ApplicationUser { Id = "user-1", UserName = "user1", Email = "user1@example.com" };
        var user2 = new ApplicationUser { Id = "user-2", UserName = "user2", Email = "user2@example.com" };
        db.Users.AddRange(user1, user2);

        db.Friendships.Add(new Friendship { UserAId = "user-1", UserBId = "user-2", CreatedAt = DateTime.UtcNow });

        // Create 5 posts
        for (int i = 0; i < 5; i++)
        {
            var attempt = new Attempt { UserId = "user-2", Game = GameType.Reaction, Value = 200 + i, CreatedAt = DateTime.UtcNow.AddMinutes(-i) };
            db.Attempts.Add(attempt);
            await db.SaveChangesAsync();

            var post = new Post { AttemptId = attempt.Id, UserId = "user-2", CreatedAt = DateTime.UtcNow.AddMinutes(-i) };
            db.Posts.Add(post);
        }
        await db.SaveChangesAsync();

        var service = new FeedService(db);

        // Act
        var result = await service.GetFriendsFeedAsync("user-1", new FeedRequest(2, 1));

        // Assert
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetFriendsFeedAsync_OrdersByCreatedAtDescending()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user1 = new ApplicationUser { Id = "user-1", UserName = "user1", Email = "user1@example.com" };
        var user2 = new ApplicationUser { Id = "user-2", UserName = "user2", Email = "user2@example.com" };
        db.Users.AddRange(user1, user2);

        db.Friendships.Add(new Friendship { UserAId = "user-1", UserBId = "user-2", CreatedAt = DateTime.UtcNow });

        var oldAttempt = new Attempt { UserId = "user-2", Game = GameType.Reaction, Value = 100, CreatedAt = DateTime.UtcNow.AddDays(-1) };
        var newAttempt = new Attempt { UserId = "user-2", Game = GameType.Reaction, Value = 200, CreatedAt = DateTime.UtcNow };
        db.Attempts.AddRange(oldAttempt, newAttempt);
        await db.SaveChangesAsync();

        var oldPost = new Post { AttemptId = oldAttempt.Id, UserId = "user-2", CreatedAt = DateTime.UtcNow.AddDays(-1) };
        var newPost = new Post { AttemptId = newAttempt.Id, UserId = "user-2", CreatedAt = DateTime.UtcNow };
        db.Posts.AddRange(oldPost, newPost);
        await db.SaveChangesAsync();

        var service = new FeedService(db);

        // Act
        var result = await service.GetFriendsFeedAsync("user-1", new FeedRequest(50, 0));

        // Assert
        Assert.Equal(2, result.Count);
        Assert.True(result[0].CreatedAt > result[1].CreatedAt);
    }
}
