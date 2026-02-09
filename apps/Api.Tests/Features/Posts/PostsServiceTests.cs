using Api.Data;
using Api.Domain;
using Api.Features.Moderation;
using Api.Features.Posts;
using Api.Features.Posts.Dtos;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace Api.Tests.Features.Posts;

public class PostsServiceTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private static Mock<IContentModerationService> CreateAllowingModerationMock()
    {
        var mock = new Mock<IContentModerationService>();
        mock.Setup(m => m.ModerateContentAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new ModerationResult(true));
        return mock;
    }

    private static Mock<IContentModerationService> CreateRejectingModerationMock(string reason = "Content not allowed")
    {
        var mock = new Mock<IContentModerationService>();
        mock.Setup(m => m.ModerateContentAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new ModerationResult(false, reason));
        return mock;
    }

    [Fact]
    public async Task CreatePostAsync_ReturnsNull_WhenAttemptDoesNotExist()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new PostsService(db, CreateAllowingModerationMock().Object);
        var request = new CreatePostRequest(999, "Test caption");

        // Act
        var result = await service.CreatePostAsync("user-1", request);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task CreatePostAsync_ReturnsNull_WhenUserDoesNotOwnAttempt()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user = new ApplicationUser { Id = "user-1", UserName = "testuser", Email = "test@example.com" };
        db.Users.Add(user);

        var attempt = new Attempt { UserId = "user-1", Game = GameType.Reaction, Value = 200, CreatedAt = DateTime.UtcNow };
        db.Attempts.Add(attempt);
        await db.SaveChangesAsync();

        var service = new PostsService(db, CreateAllowingModerationMock().Object);
        var request = new CreatePostRequest(attempt.Id, "Test caption");

        // Act - different user trying to post
        var result = await service.CreatePostAsync("user-2", request);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task CreatePostAsync_CreatesPost_WhenValid()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user = new ApplicationUser { Id = "user-1", UserName = "testuser", Email = "test@example.com" };
        db.Users.Add(user);

        var attempt = new Attempt { UserId = "user-1", Game = GameType.Reaction, Value = 200, CreatedAt = DateTime.UtcNow };
        db.Attempts.Add(attempt);
        await db.SaveChangesAsync();

        var service = new PostsService(db, CreateAllowingModerationMock().Object);
        var request = new CreatePostRequest(attempt.Id, "My best score!");

        // Act
        var result = await service.CreatePostAsync("user-1", request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("user-1", result.UserId);
        Assert.Equal("My best score!", result.Caption);
        Assert.Equal(GameType.Reaction, result.Game);
        Assert.Equal(200, result.Value);
    }

    [Fact]
    public async Task CreatePostAsync_ReturnsNull_WhenAttemptAlreadyPosted()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user = new ApplicationUser { Id = "user-1", UserName = "testuser", Email = "test@example.com" };
        db.Users.Add(user);

        var attempt = new Attempt { UserId = "user-1", Game = GameType.Reaction, Value = 200, CreatedAt = DateTime.UtcNow };
        db.Attempts.Add(attempt);
        await db.SaveChangesAsync();

        var service = new PostsService(db, CreateAllowingModerationMock().Object);
        var request = new CreatePostRequest(attempt.Id, "First post");

        // Create first post
        await service.CreatePostAsync("user-1", request);

        // Act - Try to post same attempt again
        var result = await service.CreatePostAsync("user-1", request);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetPostByIdAsync_ReturnsNull_WhenPostDoesNotExist()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new PostsService(db, CreateAllowingModerationMock().Object);

        // Act
        var result = await service.GetPostByIdAsync(999, "user-1");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetPostByIdAsync_ReturnsPost_WhenExists()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user = new ApplicationUser { Id = "user-1", UserName = "testuser", Email = "test@example.com" };
        db.Users.Add(user);

        var attempt = new Attempt { UserId = "user-1", Game = GameType.Typing, Value = 85, CreatedAt = DateTime.UtcNow };
        db.Attempts.Add(attempt);
        await db.SaveChangesAsync();

        var post = new Post { AttemptId = attempt.Id, UserId = "user-1", Caption = "Fast typing!", CreatedAt = DateTime.UtcNow };
        db.Posts.Add(post);
        await db.SaveChangesAsync();

        var service = new PostsService(db, CreateAllowingModerationMock().Object);

        // Act
        var result = await service.GetPostByIdAsync(post.Id, "user-1");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Fast typing!", result.Caption);
        Assert.Equal(GameType.Typing, result.Game);
        Assert.Equal("85 WPM", result.DisplayScore);
    }

    [Fact]
    public async Task CreatePostAsync_FormatsDisplayScore_ForReaction()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user = new ApplicationUser { Id = "user-1", UserName = "testuser", Email = "test@example.com" };
        db.Users.Add(user);

        var attempt = new Attempt { UserId = "user-1", Game = GameType.Reaction, Value = 180, CreatedAt = DateTime.UtcNow };
        db.Attempts.Add(attempt);
        await db.SaveChangesAsync();

        var service = new PostsService(db, CreateAllowingModerationMock().Object);
        var request = new CreatePostRequest(attempt.Id, null);

        // Act
        var result = await service.CreatePostAsync("user-1", request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("180ms", result.DisplayScore);
    }

    [Fact]
    public async Task CreatePostAsync_FormatsDisplayScore_ForChimpTest()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user = new ApplicationUser { Id = "user-1", UserName = "testuser", Email = "test@example.com" };
        db.Users.Add(user);

        var attempt = new Attempt { UserId = "user-1", Game = GameType.ChimpTest, Value = 12, CreatedAt = DateTime.UtcNow };
        db.Attempts.Add(attempt);
        await db.SaveChangesAsync();

        var service = new PostsService(db, CreateAllowingModerationMock().Object);
        var request = new CreatePostRequest(attempt.Id, null);

        // Act
        var result = await service.CreatePostAsync("user-1", request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Level 12", result.DisplayScore);
    }

    [Fact]
    public async Task CreatePostAsync_ThrowsModerationException_WhenContentRejected()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user = new ApplicationUser { Id = "user-1", UserName = "testuser", Email = "test@example.com" };
        db.Users.Add(user);

        var attempt = new Attempt { UserId = "user-1", Game = GameType.Reaction, Value = 200, CreatedAt = DateTime.UtcNow };
        db.Attempts.Add(attempt);
        await db.SaveChangesAsync();

        var service = new PostsService(db, CreateRejectingModerationMock("Contains hate speech").Object);
        var request = new CreatePostRequest(attempt.Id, "Some hateful content");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ModerationException>(() => service.CreatePostAsync("user-1", request));
        Assert.Equal("Contains hate speech", ex.Reason);

        // Verify post was NOT created
        Assert.Empty(db.Posts);
    }

    [Fact]
    public async Task CreatePostAsync_SkipsModeration_WhenCaptionIsEmpty()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user = new ApplicationUser { Id = "user-1", UserName = "testuser", Email = "test@example.com" };
        db.Users.Add(user);

        var attempt = new Attempt { UserId = "user-1", Game = GameType.Reaction, Value = 200, CreatedAt = DateTime.UtcNow };
        db.Attempts.Add(attempt);
        await db.SaveChangesAsync();

        var moderationMock = CreateRejectingModerationMock();
        var service = new PostsService(db, moderationMock.Object);
        var request = new CreatePostRequest(attempt.Id, null);

        // Act
        var result = await service.CreatePostAsync("user-1", request);

        // Assert - post created without moderation being called
        Assert.NotNull(result);
        moderationMock.Verify(
            m => m.ModerateContentAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Never);
    }

    [Fact]
    public async Task CreatePostAsync_CallsModeration_WithCorrectParameters()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var user = new ApplicationUser { Id = "user-1", UserName = "testuser", Email = "test@example.com" };
        db.Users.Add(user);

        var attempt = new Attempt { UserId = "user-1", Game = GameType.Reaction, Value = 200, CreatedAt = DateTime.UtcNow };
        db.Attempts.Add(attempt);
        await db.SaveChangesAsync();

        var moderationMock = CreateAllowingModerationMock();
        var service = new PostsService(db, moderationMock.Object);
        var request = new CreatePostRequest(attempt.Id, "Nice score!");

        // Act
        await service.CreatePostAsync("user-1", request);

        // Assert - moderation was called with correct user, content, and type
        moderationMock.Verify(
            m => m.ModerateContentAsync("user-1", "Nice score!", "Post"),
            Times.Once);
    }
}
