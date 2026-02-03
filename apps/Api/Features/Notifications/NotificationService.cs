using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Api.Data;
using Api.Domain;
using Api.Features.Notifications.Dtos;
using Api.Features.WebSocket;
using Api.hubs;

namespace Api.Features.Notifications;

public class NotificationService
{
    private readonly ApplicationDbContext _db;
    private readonly NotificationSender _sender;
    private readonly IPresenceTracker _presence;

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public NotificationService(
        ApplicationDbContext db,
        NotificationSender sender,
        IPresenceTracker presence)
    {
        _db = db;
        _sender = sender;
        _presence = presence;
    }

    public async Task<long> SendAsync(
        string userId,
        string type,
        string title,
        string message,
        object? data = null)
    {
        var row = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            DataJson = data is null ? null : JsonSerializer.Serialize(data, JsonOptions),
            CreatedAt = DateTime.UtcNow,
            ReadAt = null
        };

        _db.Notifications.Add(row);
        await _db.SaveChangesAsync();

        if (_presence.IsOnline(userId))
        {
            await _sender.SendToUserAsync(userId, new NotificationPayload(
                Type: type,
                Title: title,
                Message: message,
                Data: data,
                CreatedAt: row.CreatedAt
            ));
        }

        return row.Id;
    }

    public async Task<List<NotificationDto>> GetAsync(
        string userId,
        bool unreadOnly = false,
        int take = 50)
    {
        var query = _db.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId);

        if (unreadOnly)
            query = query.Where(n => n.ReadAt == null);

        var rows = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(Math.Clamp(take, 1, 200))
            .ToListAsync();

        return rows.Select(n => new NotificationDto
        {
            Id = n.Id,
            Type = n.Type,
            Title = n.Title,
            Message = n.Message,
            Data = n.DataJson is null ? null : JsonSerializer.Deserialize<object>(n.DataJson, JsonOptions),
            CreatedAt = n.CreatedAt,
            ReadAt = n.ReadAt
        }).ToList();
    }

    public async Task<bool> MarkReadAsync(string userId, long notificationId)
    {
        var row = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (row == null) return false;

        if (row.ReadAt == null)
        {
            row.ReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return true;
    }

    public async Task<int> MarkAllReadAsync(string userId)
    {
        var unread = await _db.Notifications
            .Where(n => n.UserId == userId && n.ReadAt == null)
            .ToListAsync();

        if (unread.Count == 0) return 0;

        var now = DateTime.UtcNow;
        foreach (var n in unread)
            n.ReadAt = now;

        await _db.SaveChangesAsync();
        return unread.Count;
    }
}
