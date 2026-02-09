using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api.Data;

namespace Api.Features.Moderation;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ModerationController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly ILogger<ModerationController> _logger;

    public ModerationController(ApplicationDbContext db, ILogger<ModerationController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet("flagged")]
    public async Task<ActionResult<List<FlaggedContentDto>>> GetFlaggedContent(
        [FromQuery] bool? reviewed = null)
    {
        _logger.LogDebug("GetFlaggedContent request - reviewed: {Reviewed}", reviewed);

        var query = _db.FlaggedContent.AsQueryable();

        if (reviewed.HasValue)
            query = query.Where(x => x.Reviewed == reviewed.Value);

        var items = await query
            .OrderByDescending(x => x.FlaggedAt)
            .Take(100)
            .Select(x => new FlaggedContentDto(
                x.Id,
                x.UserId,
                x.ContentType,
                x.Content,
                x.Reason,
                x.FlaggedAt,
                x.Reviewed
            ))
            .ToListAsync();

        _logger.LogInformation("Retrieved {Count} flagged content items", items.Count);
        return Ok(items);
    }

    [HttpPut("flagged/{id}/reviewed")]
    public async Task<IActionResult> MarkAsReviewed(long id)
    {
        _logger.LogDebug("MarkAsReviewed request for id: {Id}", id);

        var item = await _db.FlaggedContent.FindAsync(id);
        if (item == null)
        {
            _logger.LogWarning("Flagged content not found: {Id}", id);
            return NotFound();
        }

        item.Reviewed = true;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Marked flagged content {Id} as reviewed", id);
        return NoContent();
    }
}
