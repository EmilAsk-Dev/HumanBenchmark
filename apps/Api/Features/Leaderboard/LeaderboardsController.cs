using System.Security.Claims;
using Api.Domain;
using Api.Features.Leaderboards.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Features.Leaderboards;

[ApiController]
[Route("api/leaderboards")]
[Authorize]
[Tags("Leaderboards")]
public class LeaderboardsController : ControllerBase
{
    private readonly LeaderboardService _svc;

    public LeaderboardsController(LeaderboardService svc)
    {
        _svc = svc;
    }

    [HttpGet]
    public async Task<ActionResult<LeaderboardDto>> GetLeaderboard(
        [FromQuery] GameType game,
        [FromQuery] LeaderboardScope scope = LeaderboardScope.Global,
        [FromQuery] LeaderboardTimeframe timeframe = LeaderboardTimeframe.All,
        [FromQuery] int limit = 50,
        CancellationToken ct = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        // Friends-only leaderboard is always scoped to the caller’s friends (even for admins)
        // If you want admins to view "friends leaderboard of anyone", that’s a separate endpoint.
        var result = await _svc.GetLeaderboardAsync(userId, game, scope, timeframe, limit, ct);
        return Ok(result);
    }

    [HttpGet("me/stats")]
    public async Task<ActionResult<UserGameStatsDto>> GetMyStats(
        [FromQuery] GameType game,
        [FromQuery] LeaderboardTimeframe timeframe = LeaderboardTimeframe.All,
        CancellationToken ct = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var result = await _svc.GetUserStatsAsync(
            requesterUserId: userId,
            targetUserId: userId,
            isAdmin: User.IsInRole("Admin"),
            game: game,
            timeframe: timeframe,
            ct: ct);

        return Ok(result);
    }

    [HttpGet("users/{targetUserId}/stats")]
    public async Task<ActionResult<UserGameStatsDto>> GetUserStats(
        [FromRoute] string targetUserId,
        [FromQuery] GameType game,
        [FromQuery] LeaderboardTimeframe timeframe = LeaderboardTimeframe.All,
        CancellationToken ct = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        try
        {
            var result = await _svc.GetUserStatsAsync(
                requesterUserId: userId,
                targetUserId: targetUserId,
                isAdmin: User.IsInRole("Admin"),
                game: game,
                timeframe: timeframe,
                ct: ct);

            return Ok(result);
        }
        catch (ForbiddenException)
        {
            return Forbid();
        }
        catch (NotFoundException)
        {
            return NotFound();
        }
    }
}

