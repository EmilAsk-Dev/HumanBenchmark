using Api.Data;
using Api.Domain;
using Api.Features.Attempts.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Api.Features.Attempts.Services;

public class AttemptWriter
{
    private readonly ApplicationDbContext _db;

    public AttemptWriter(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<AttemptDto> CreateReactionAsync(string userId, int value, CreateReactionAttemptRequest req)
    {
        var attempt = new Attempt
        {
            UserId = userId,
            Game = GameType.Reaction,
            Value = value,
            CreatedAt = DateTime.UtcNow,
            ReactionDetails = new ReactionAttemptDetails
            {
                BestMs = req.BestMs,
                AvgMs = req.AvgMs,
                Attempts = req.Attempts
            }
        };

        _db.Attempts.Add(attempt);
        await _db.SaveChangesAsync();

        return ToDto(attempt);
    }

    public async Task<AttemptDto> CreateTypingAsync(string userId, int value, CreateTypingAttemptRequest req)
    {
        var attempt = new Attempt
        {
            UserId = userId,
            Game = GameType.Typing,
            Value = value,
            CreatedAt = DateTime.UtcNow,
            TypingDetails = new TypingAttemptDetails
            {
                Wpm = req.Wpm,
                Accuracy = req.Accuracy,
                Characters = req.Characters
            }
        };

        _db.Attempts.Add(attempt);
        await _db.SaveChangesAsync();

        return ToDto(attempt);
    }
    
    public async Task<AttemptDto> CreateChimpAsync(string userId, int value, CreateChimpAttemptRequest req)
    {
        var attempt = new Attempt
        {
            UserId = userId,
            Game = GameType.ChimpTest,
            Value = value,
            CreatedAt = DateTime.UtcNow,
            ChimpDetails = new ChimpAttemptDetails
            {
                Level = req.Level,
                Mistakes = req.Mistakes,
                TimeMs = req.TimeMs
            }
        };

        _db.Attempts.Add(attempt);
        await _db.SaveChangesAsync();

        return ToDto(attempt);
    }

    public async Task<AttemptDto> CreateSequenceAsync(string userId, int value, CreateSequenceAttemptRequest req)
    {
        var attempt = new Attempt
        {
            UserId = userId,
            Game = GameType.SequenceTest,
            Value = value,
            CreatedAt = DateTime.UtcNow,
            SequenceDetails = new SequenceAttemptDetails
            {
                Level = req.Level,
                Mistakes = req.Mistakes,
                TimeMs = req.TimeMs
            }
        };

        _db.Attempts.Add(attempt);
        await _db.SaveChangesAsync();

        return ToDto(attempt);
    }

    private static AttemptDto ToDto(Attempt a) =>
        new(a.Id, a.UserId, a.Game, a.Value, a.CreatedAt);
}
