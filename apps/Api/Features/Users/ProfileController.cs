using System.Security.Claims;
using Api.Features.Users.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Features.Users;

[ApiController]
[Route("api/profile")]
[Authorize]
[Tags("Profile")]
public class ProfileController : ControllerBase
{
    private readonly ProfileService _svc;
    private readonly ILogger<ProfileController> _logger;

    public ProfileController(ProfileService svc, ILogger<ProfileController> logger)
    {
        _svc = svc;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ProfileDto>> GetMyProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            _logger.LogWarning("GetMyProfile called without user ID in token");
            return Unauthorized();
        }

        _logger.LogDebug("GetMyProfile for user {UserId}", userId);
        var profile = await _svc.GetProfileAsync(userId);

        if (profile == null)
        {
            _logger.LogWarning("Profile not found for user {UserId}", userId);
            return NotFound();
        }

        return Ok(profile);
    }

    [HttpGet("{userId}")]
    public async Task<ActionResult<ProfileDto>> GetProfile(string userId)
    {
        _logger.LogDebug("GetProfile for user {UserId}", userId);
        var profile = await _svc.GetProfileAsync(userId);

        if (profile == null)
        {
            _logger.LogDebug("Profile not found for user {UserId}", userId);
            return NotFound();
        }

        return Ok(profile);
    }
}