using Microsoft.AspNetCore.Identity;

namespace Api.Data;


public class ApplicationUser : IdentityUser
{

    public DateOnly? DateOfBirth { get; set; }
    public string? Gender { get; set; }

    public string? AvatarUrl { get; set; }

}

