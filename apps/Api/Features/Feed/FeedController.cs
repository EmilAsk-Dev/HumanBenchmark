using System.Security.Claims;
using Api.Features.Feed.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Features.Feed;

[ApiController]
[Route("api/feed")]
[Authorize]
[Tags("feed")]
public class FeedController : ControllerBase
{
    private readonly FeedService _svc;
    private readonly ILogger<FeedController> _logger;

    public FeedController(FeedService svc, ILogger<FeedController> logger)
    {
        _svc = svc;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<FeedItemDto>>> Get(
    [FromQuery] int take = 50,
    [FromQuery] int skip = 0,
    [FromQuery] FeedFilter filter = FeedFilter.Friends)
    {
        var me = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(me))
        {
            _logger.LogWarning("Unauthorized feed access - no user ID in token");
            return Unauthorized();
        }

        _logger.LogDebug(
            "GetFeed for user {UserId} - filter: {Filter}, take: {Take}, skip: {Skip}",
            me, filter, take, skip
        );

        return filter switch
        {
            FeedFilter.Friends =>
                Ok(await _svc.GetFriendsFeedAsync(me, new FeedRequest(take, skip))),

            FeedFilter.Global =>
                Ok(await _svc.GetPublicFeedAsync(me, new FeedRequest(take, skip))),

            FeedFilter.Trending =>
                Ok(await _svc.GetTrendingFeedAsync(me, new FeedRequest(take, skip))),

            _ => BadRequest("Invalid feed filter")
        };
    }
}

public enum FeedFilter
{
    Friends,
    Global,
    Trending
}
