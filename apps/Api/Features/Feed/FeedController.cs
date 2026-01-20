using System.Security.Claims;
using Api.Features.Feed.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Features.Feed;

[ApiController]
[Route("feed")]
[Authorize]
[Tags("Feed")]
public class FeedController : ControllerBase
{
    private readonly FeedService _svc;

    public FeedController(FeedService svc)
    {
        _svc = svc;
    }

    [HttpGet]
    public async Task<ActionResult<List<FeedItemDto>>> Get([FromQuery] int take = 50, [FromQuery] int skip = 0)
    {
        var me = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(me))
            return Unauthorized();

        var items = await _svc.GetFriendsFeedAsync(me, new FeedRequest(take, skip));
        return Ok(items);
    }
}
