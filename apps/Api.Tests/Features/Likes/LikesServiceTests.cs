using Api.Data;
using Api.Domain;
using Api.Features.Likes;
using Api.Features.Likes.Dtos;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Api.Tests.Features.Likes;

public class LikesServiceTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task LikeAsync_ReturnsNotFound_WhenPostDoesNotExist()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new LikesService(db);

        // Act
        var result = await service.LikeAsync("user-1", LikeTargetType.Post, 999);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("Post not found", result.Message);
    }

    [Fact]
    public async Task LikeAsync_CreatesLike_WhenPostExists()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user = new ApplicationUser { Id = "user-1", UserName = "testuser", Email = "test@example.com" };
        db.Users.Add(user);

        var attempt = new Attempt { UserId = "user-1", Game = GameType.Reaction, Value = 200, CreatedAt = DateTime.UtcNow };
        db.Attempts.Add(attempt);
        await db.SaveChangesAsync();

        var post = new Post { AttemptId = attempt.Id, UserId = "user-1", CreatedAt = DateTime.UtcNow };
        db.Posts.Add(post);
        await db.SaveChangesAsync();

        var service = new LikesService(db);

        // Act
        var result = await service.LikeAsync("user-1", LikeTargetType.Post, post.Id);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(1, result.LikeCount);
        Assert.True(result.IsLikedByMe);
    }

    [Fact]
    public async Task LikeAsync_ReturnsAlreadyLiked_WhenLikedTwice()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user = new ApplicationUser { Id = "user-1", UserName = "testuser", Email = "test@example.com" };
        db.Users.Add(user);

        var attempt = new Attempt { UserId = "user-1", Game = GameType.Reaction, Value = 200, CreatedAt = DateTime.UtcNow };
        db.Attempts.Add(attempt);
        await db.SaveChangesAsync();

        var post = new Post { AttemptId = attempt.Id, UserId = "user-1", CreatedAt = DateTime.UtcNow };
        db.Posts.Add(post);
        await db.SaveChangesAsync();

        var service = new LikesService(db);

        // First like
        await service.LikeAsync("user-1", LikeTargetType.Post, post.Id);

        // Act - Second like
        var result = await service.LikeAsync("user-1", LikeTargetType.Post, post.Id);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("Already liked", result.Message);
    }

    [Fact]
    public async Task UnlikeAsync_RemovesLike_WhenLikeExists()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user = new ApplicationUser { Id = "user-1", UserName = "testuser", Email = "test@example.com" };
        db.Users.Add(user);

        var attempt = new Attempt { UserId = "user-1", Game = GameType.Reaction, Value = 200, CreatedAt = DateTime.UtcNow };
        db.Attempts.Add(attempt);
        await db.SaveChangesAsync();

        var post = new Post { AttemptId = attempt.Id, UserId = "user-1", CreatedAt = DateTime.UtcNow };
        db.Posts.Add(post);
        await db.SaveChangesAsync();

        var service = new LikesService(db);
        await service.LikeAsync("user-1", LikeTargetType.Post, post.Id);

        // Act
        var result = await service.UnlikeAsync("user-1", LikeTargetType.Post, post.Id);

        // Assert
        Assert.True(result.Success);
        Assert.Equal(0, result.LikeCount);
        Assert.False(result.IsLikedByMe);
    }

    [Fact]
    public async Task GetLikeInfoAsync_ReturnsCorrectInfo()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user1 = new ApplicationUser { Id = "user-1", UserName = "user1", Email = "user1@example.com" };
        var user2 = new ApplicationUser { Id = "user-2", UserName = "user2", Email = "user2@example.com" };
        db.Users.AddRange(user1, user2);

        var attempt = new Attempt { UserId = "user-1", Game = GameType.Reaction, Value = 200, CreatedAt = DateTime.UtcNow };
        db.Attempts.Add(attempt);
        await db.SaveChangesAsync();

        var post = new Post { AttemptId = attempt.Id, UserId = "user-1", CreatedAt = DateTime.UtcNow };
        db.Posts.Add(post);
        await db.SaveChangesAsync();

        var service = new LikesService(db);
        await service.LikeAsync("user-1", LikeTargetType.Post, post.Id);
        await service.LikeAsync("user-2", LikeTargetType.Post, post.Id);

        // Act
        var result = await service.GetLikeInfoAsync("user-1", LikeTargetType.Post, post.Id);

        // Assert
        Assert.Equal(2, result.LikeCount);
        Assert.True(result.IsLikedByMe);
    }
}
