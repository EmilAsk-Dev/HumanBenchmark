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

    public ProfileController(ProfileService svc)
    {
        _svc = svc;
    }

    [HttpGet]
    public async Task<ActionResult<ProfileDto>> GetMyProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var profile = await _svc.GetProfileAsync(userId);

        if (profile == null)
            return NotFound();

        return Ok(profile);
    }


    [HttpGet("{userId}")]
    [AllowAnonymous]
    public async Task<ActionResult<ProfileDto>> GetProfile(string userId)
    {
        var profile = await _svc.GetProfileAsync(userId);

        if (profile == null)
            return NotFound();

        return Ok(profile);
    }


    [HttpGet("username/{username}")]
    [AllowAnonymous]
    public async Task<ActionResult<ProfileDto>> GetProfileByUsername(string username)
    {
        if (string.IsNullOrWhiteSpace(username))
            return BadRequest("Username is required.");

        var profile = await _svc.GetProfileByUsernameAsync(username);

        if (profile == null)
            return NotFound();

        return Ok(profile);
    }
}
