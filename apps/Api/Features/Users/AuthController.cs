using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Api.Data;

namespace Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager)
    {
        _userManager = userManager;
        _signInManager = signInManager;
    }

    public record RegisterRequest(
        string Email,
        string Password,
        string Username,
        DateTime? DateOfBirth,
        string? Gender,
        string? AvatarUrl
    );

    public record LoginRequest(string Email, string Password);

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        DateOnly? dateOfBirth = req.DateOfBirth.HasValue
            ? DateOnly.FromDateTime(req.DateOfBirth.Value)
            : null;

        var user = new ApplicationUser
        {
            UserName = req.Username,
            Email = req.Email,
            DateOfBirth = dateOfBirth,
            Gender = req.Gender,
            AvatarUrl = req.AvatarUrl
        };

        var result = await _userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = "Registration failed",
                errors = result.Errors.Select(e => new { e.Code, e.Description })
            });
        }

        
        await _signInManager.SignInAsync(user, isPersistent: false);

        return Ok(new
        {
            user.Id,
            user.Email,
            user.UserName,
            user.AvatarUrl
        });
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await _userManager.FindByEmailAsync(req.Email)
                   ?? await _userManager.FindByNameAsync(req.Email);

        if (user is null)
            return Unauthorized(new { message = "Invalid credentials" });

        var result = await _signInManager.PasswordSignInAsync(
            user,
            req.Password,
            isPersistent: false,
            lockoutOnFailure: true
        );

        if (!result.Succeeded)
            return Unauthorized(new { message = "Invalid credentials" });

        
        await _signInManager.SignInAsync(user, isPersistent: false);

        
        var token = await _userManager.GenerateUserTokenAsync(
            user,
            TokenOptions.DefaultProvider,
            "Login"
        );

        return Ok(new
        {
            message = "Logged in",
            token,
            userId = user.Id,
            email = user.Email
        });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok(new { message = "Logged out" });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null) return Unauthorized();

        return Ok(new
        {
            user.Id,
            user.Email,
            user.UserName,
            user.DateOfBirth,
            user.Gender,
            user.AvatarUrl
        });
    }
}
