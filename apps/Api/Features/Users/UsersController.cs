using Api.Data;
using Api.Domain.Friends;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Api.Features.Users;

[ApiController]
[Authorize]
[Route("/api/users")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public UsersController(ApplicationDbContext db)
    {
        _db = db;
    }

    private string Me =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new Exception("Missing user id");

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(Array.Empty<object>());

        q = q.Trim();

        var users = await _db.Users
            .Where(u =>
                u.UserName != null &&
                u.UserName.Contains(q) &&
                u.Id != Me &&
                !_db.Friendships.Any(f =>
                    (f.UserAId == Me && f.UserBId == u.Id) ||
                    (f.UserBId == Me && f.UserAId == u.Id)
                )
            )
            .Select(u => new
            {
                id = u.Id,
                username = u.UserName
            })
            .Take(10)
            .ToListAsync();

        return Ok(users);
    }
}
