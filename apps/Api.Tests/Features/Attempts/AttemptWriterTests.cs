using Api.Data;
using Api.Domain;
using Api.Features.Attempts.Dtos;
using Api.Features.Attempts.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Api.Tests.Features.Attempts;

public class AttemptWriterTests
{
    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task CreateReactionAsync_CreatesAttemptWithDetails()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new AttemptWriter(db);
        var request = new CreateReactionAttemptRequest(150, 180, 5);

        // Act
        var result = await service.CreateReactionAsync("user-1", request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("user-1", result.UserId);
        Assert.Equal(GameType.Reaction, result.Game);
        Assert.Equal(150, result.Value);

        // Verify in database
        var attempt = await db.Attempts
            .Include(a => a.ReactionDetails)
            .FirstOrDefaultAsync(a => a.Id == result.Id);

        Assert.NotNull(attempt);
        Assert.NotNull(attempt.ReactionDetails);
        Assert.Equal(150, attempt.ReactionDetails.BestMs);
        Assert.Equal(180, attempt.ReactionDetails.AvgMs);
        Assert.Equal(5, attempt.ReactionDetails.Attempts);
    }

    [Fact]
    public async Task CreateTypingAsync_CreatesAttemptWithDetails()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new AttemptWriter(db);
        var request = new CreateTypingAttemptRequest(85, 98.5m, 500);

        // Act
        var result = await service.CreateTypingAsync("user-1", request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("user-1", result.UserId);
        Assert.Equal(GameType.Typing, result.Game);
        Assert.Equal(85, result.Value);

        // Verify in database
        var attempt = await db.Attempts
            .Include(a => a.TypingDetails)
            .FirstOrDefaultAsync(a => a.Id == result.Id);

        Assert.NotNull(attempt);
        Assert.NotNull(attempt.TypingDetails);
        Assert.Equal(85, attempt.TypingDetails.Wpm);
        Assert.Equal(98.5m, attempt.TypingDetails.Accuracy);
        Assert.Equal(500, attempt.TypingDetails.Characters);
    }

    [Fact]
    public async Task CreateChimpAsync_CreatesAttemptWithDetails()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new AttemptWriter(db);
        var request = new CreateChimpAttemptRequest(12, 2, 45000);

        // Act
        var result = await service.CreateChimpAsync("user-1", request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("user-1", result.UserId);
        Assert.Equal(GameType.ChimpTest, result.Game);
        Assert.Equal(12, result.Value);

        // Verify in database
        var attempt = await db.Attempts
            .Include(a => a.ChimpDetails)
            .FirstOrDefaultAsync(a => a.Id == result.Id);

        Assert.NotNull(attempt);
        Assert.NotNull(attempt.ChimpDetails);
        Assert.Equal(12, attempt.ChimpDetails.Level);
        Assert.Equal(2, attempt.ChimpDetails.Mistakes);
        Assert.Equal(45000, attempt.ChimpDetails.TimeMs);
    }

    [Fact]
    public async Task CreateSequenceAsync_CreatesAttemptWithDetails()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new AttemptWriter(db);
        var request = new CreateSequenceAttemptRequest(8, 1, 30000);

        // Act
        var result = await service.CreateSequenceAsync("user-1", request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("user-1", result.UserId);
        Assert.Equal(GameType.SequenceTest, result.Game);
        Assert.Equal(8, result.Value);

        // Verify in database
        var attempt = await db.Attempts
            .Include(a => a.SequenceDetails)
            .FirstOrDefaultAsync(a => a.Id == result.Id);

        Assert.NotNull(attempt);
        Assert.NotNull(attempt.SequenceDetails);
        Assert.Equal(8, attempt.SequenceDetails.Level);
        Assert.Equal(1, attempt.SequenceDetails.Mistakes);
        Assert.Equal(30000, attempt.SequenceDetails.TimeMs);
    }

    [Fact]
    public async Task CreateReactionAsync_SetsCreatedAtToUtcNow()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new AttemptWriter(db);
        var request = new CreateReactionAttemptRequest(150, 180, 5);
        var before = DateTime.UtcNow;

        // Act
        var result = await service.CreateReactionAsync("user-1", request);

        // Assert
        var after = DateTime.UtcNow;
        Assert.InRange(result.CreatedAt, before, after);
    }

    [Fact]
    public async Task CreateReactionAsync_ReturnsCorrectDto()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new AttemptWriter(db);
        var request = new CreateReactionAttemptRequest(150, 180, 5);

        // Act
        var result = await service.CreateReactionAsync("user-1", request);

        // Assert
        Assert.True(result.Id > 0);
        Assert.Equal("user-1", result.UserId);
        Assert.Equal(GameType.Reaction, result.Game);
        Assert.Equal(150, result.Value);
    }

    [Fact]
    public async Task MultipleAttempts_HaveUniqueIds()
    {
        // Arrange
        using var db = CreateInMemoryDbContext();
        var service = new AttemptWriter(db);

        // Act
        var result1 = await service.CreateReactionAsync("user-1", new CreateReactionAttemptRequest(150, 180, 5));
        var result2 = await service.CreateReactionAsync("user-1", new CreateReactionAttemptRequest(140, 170, 5));

        // Assert
        Assert.NotEqual(result1.Id, result2.Id);
    }
}
