using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Api.Data;

namespace Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _logger = logger;
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
        _logger.LogDebug("Registration attempt for email: {Email}, username: {Username}", req.Email, req.Username);

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
            _logger.LogWarning("Registration failed for {Email}: {Errors}",
                req.Email, string.Join(", ", result.Errors.Select(e => e.Description)));
            return BadRequest(new
            {
                message = "Registration failed",
                errors = result.Errors.Select(e => new { e.Code, e.Description })
            });
        }


        await _signInManager.SignInAsync(user, isPersistent: false);

        _logger.LogInformation("User registered successfully: {UserId} ({Email})", user.Id, user.Email);
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
        _logger.LogDebug("Login attempt for: {Email}", req.Email);

        var user = await _userManager.FindByEmailAsync(req.Email)
                   ?? await _userManager.FindByNameAsync(req.Email);

        if (user is null)
        {
            _logger.LogWarning("Login failed - user not found: {Email}", req.Email);
            return Unauthorized(new { message = "Invalid credentials" });
        }

        var result = await _signInManager.PasswordSignInAsync(
            user,
            req.Password,
            isPersistent: false,
            lockoutOnFailure: true
        );

        if (!result.Succeeded)
        {
            _logger.LogWarning("Login failed - invalid password for user: {UserId} ({Email})", user.Id, user.Email);
            return Unauthorized(new { message = "Invalid credentials" });
        }


        await _signInManager.SignInAsync(user, isPersistent: false);


        var token = await _userManager.GenerateUserTokenAsync(
            user,
            TokenOptions.DefaultProvider,
            "Login"
        );

        _logger.LogInformation("User logged in: {UserId} ({Email})", user.Id, user.Email);
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
        _logger.LogInformation("User logged out");
        await _signInManager.SignOutAsync();
        return Ok(new { message = "Logged out" });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null)
        {
            _logger.LogWarning("Me endpoint called but user not found in token");
            return Unauthorized();
        }

        _logger.LogDebug("Me endpoint called for user: {UserId}", user.Id);
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
