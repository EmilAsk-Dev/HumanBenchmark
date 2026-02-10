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

    private string Me =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new Exception("Missing user id");

    [HttpGet]
    public async Task<ActionResult<ProfileDto>> GetMyProfile()
    {
        _logger.LogDebug("GetMyProfile for user {UserId}", Me);
        var profile = await _svc.GetProfileAsync(Me, Me);

        if (profile == null)
        {
            _logger.LogWarning("Profile not found for user {UserId}", Me);
            return NotFound();
        }

        return Ok(profile);
    }


    [HttpGet("{userId}")]
    public async Task<ActionResult<ProfileDto>> GetProfile(string userId)
    {
        _logger.LogDebug("GetProfile {TargetUserId} requested by {UserId}", userId, Me);

        try
        {
            var profile = await _svc.GetProfileAsync(Me, userId);
            if (profile == null)
                return NotFound();

            return Ok(profile);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }

    }


    [HttpGet("username/{username}")]
    public async Task<ActionResult<ProfileDto>> GetProfileByUsername(string username)
    {
        if (string.IsNullOrWhiteSpace(username))
            return BadRequest("Username is required.");

        try
        {
            var profile = await _svc.GetProfileByUsernameAsync(Me, username);

            if (profile == null)
                return NotFound();

            return Ok(profile);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }

    }
}
