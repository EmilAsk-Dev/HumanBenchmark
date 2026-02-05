using Api.Data;
using Api.Domain;
using Api.Features.Attempts.Dtos;
using Api.Features.Attempts.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Api.Tests.Features.Attempts;

public class AttemptWriterTests
{
    private static ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task CreateReactionAsync_CreatesAttemptWithDetails()
    {
        using var db = CreateInMemoryDbContext();
        var service = new AttemptWriter(db);

        const int value = 150;
        var req = new CreateReactionAttemptRequest(BestMs: 150, AvgMs: 180, Attempts: 5);

        var result = await service.CreateReactionAsync("user-1", value, req);

        Assert.NotNull(result);
        Assert.True(result.Id > 0);
        Assert.Equal("user-1", result.UserId);
        Assert.Equal(GameType.Reaction, result.Game);
        Assert.Equal(value, result.Value);

        var attempt = await db.Attempts
            .Include(a => a.ReactionDetails)
            .SingleAsync(a => a.Id == result.Id);

        Assert.NotNull(attempt.ReactionDetails);
        Assert.Equal(req.BestMs, attempt.ReactionDetails.BestMs);
        Assert.Equal(req.AvgMs, attempt.ReactionDetails.AvgMs);
        Assert.Equal(req.Attempts, attempt.ReactionDetails.Attempts);
    }

    [Fact]
    public async Task CreateTypingAsync_CreatesAttemptWithDetails()
    {
        using var db = CreateInMemoryDbContext();
        var service = new AttemptWriter(db);

        const int value = 85;
        var req = new CreateTypingAttemptRequest(Wpm: 85, Accuracy: 98.5m, Characters: 500);

        var result = await service.CreateTypingAsync("user-1", value, req);

        Assert.NotNull(result);
        Assert.True(result.Id > 0);
        Assert.Equal("user-1", result.UserId);
        Assert.Equal(GameType.Typing, result.Game);
        Assert.Equal(value, result.Value);

        var attempt = await db.Attempts
            .Include(a => a.TypingDetails)
            .SingleAsync(a => a.Id == result.Id);

        Assert.NotNull(attempt.TypingDetails);
        Assert.Equal(req.Wpm, attempt.TypingDetails.Wpm);
        Assert.Equal(req.Accuracy, attempt.TypingDetails.Accuracy);
        Assert.Equal(req.Characters, attempt.TypingDetails.Characters);
    }

    [Fact]
    public async Task CreateChimpAsync_CreatesAttemptWithDetails()
    {
        using var db = CreateInMemoryDbContext();
        var service = new AttemptWriter(db);

        const int value = 12;
        var req = new CreateChimpAttemptRequest(Level: 12, Mistakes: 2, TimeMs: 45000);

        var result = await service.CreateChimpAsync("user-1", value, req);

        Assert.NotNull(result);
        Assert.True(result.Id > 0);
        Assert.Equal("user-1", result.UserId);
        Assert.Equal(GameType.ChimpTest, result.Game);
        Assert.Equal(value, result.Value);

        var attempt = await db.Attempts
            .Include(a => a.ChimpDetails)
            .SingleAsync(a => a.Id == result.Id);

        Assert.NotNull(attempt.ChimpDetails);
        Assert.Equal(req.Level, attempt.ChimpDetails.Level);
        Assert.Equal(req.Mistakes, attempt.ChimpDetails.Mistakes);
        Assert.Equal(req.TimeMs, attempt.ChimpDetails.TimeMs);
    }

    [Fact]
    public async Task CreateSequenceAsync_CreatesAttemptWithDetails()
    {
        using var db = CreateInMemoryDbContext();
        var service = new AttemptWriter(db);

        const int value = 8;
        var req = new CreateSequenceAttemptRequest(Level: 8, Mistakes: 1, TimeMs: 30000);

        var result = await service.CreateSequenceAsync("user-1", value, req);

        Assert.NotNull(result);
        Assert.True(result.Id > 0);
        Assert.Equal("user-1", result.UserId);
        Assert.Equal(GameType.SequenceTest, result.Game);
        Assert.Equal(value, result.Value);

        var attempt = await db.Attempts
            .Include(a => a.SequenceDetails)
            .SingleAsync(a => a.Id == result.Id);

        Assert.NotNull(attempt.SequenceDetails);
        Assert.Equal(req.Level, attempt.SequenceDetails.Level);
        Assert.Equal(req.Mistakes, attempt.SequenceDetails.Mistakes);
        Assert.Equal(req.TimeMs, attempt.SequenceDetails.TimeMs);
    }

    [Fact]
    public async Task CreateReactionAsync_SetsCreatedAtToUtcNow()
    {
        using var db = CreateInMemoryDbContext();
        var service = new AttemptWriter(db);

        var before = DateTime.UtcNow;
        var result = await service.CreateReactionAsync(
            "user-1",
            value: 150,
            req: new CreateReactionAttemptRequest(150, 180, 5)
        );
        var after = DateTime.UtcNow;

        Assert.InRange(result.CreatedAt, before, after);

        // Also verify persisted entity
        var attempt = await db.Attempts.SingleAsync(a => a.Id == result.Id);
        Assert.InRange(attempt.CreatedAt, before, after);
    }

    [Fact]
    public async Task MultipleAttempts_HaveUniqueIds()
    {
        using var db = CreateInMemoryDbContext();
        var service = new AttemptWriter(db);

        var r1 = await service.CreateReactionAsync("user-1", 150, new CreateReactionAttemptRequest(150, 180, 5));
        var r2 = await service.CreateReactionAsync("user-1", 140, new CreateReactionAttemptRequest(140, 170, 5));

        Assert.NotEqual(r1.Id, r2.Id);
    }

    [Fact]
    public async Task CreateMethods_PersistAttemptWithCorrectGameAndValue()
    {
        using var db = CreateInMemoryDbContext();
        var service = new AttemptWriter(db);

        var reaction = await service.CreateReactionAsync("user-1", 123, new CreateReactionAttemptRequest(150, 180, 5));
        var typing = await service.CreateTypingAsync("user-1", 456, new CreateTypingAttemptRequest(85, 98.5m, 500));

        var persisted = await db.Attempts
            .Where(a => a.Id == reaction.Id || a.Id == typing.Id)
            .ToListAsync();

        Assert.Contains(persisted, a => a.Id == reaction.Id && a.Game == GameType.Reaction && a.Value == 123);
        Assert.Contains(persisted, a => a.Id == typing.Id && a.Game == GameType.Typing && a.Value == 456);
    }
}
