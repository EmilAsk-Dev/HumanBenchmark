using Microsoft.AspNetCore.Identity;

namespace Api.Data;

public static class IdentitySeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        string[] roles = ["Admin", "User"];

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        var adminEmail = "admin@local.test";
        var admin = await userManager.FindByEmailAsync(adminEmail);
        if (admin is null)
        {
            admin = new ApplicationUser { UserName = adminEmail, Email = adminEmail, EmailConfirmed = true };
            await userManager.CreateAsync(admin, "Admin123!");
        }

        if (!await userManager.IsInRoleAsync(admin, "Admin"))
            await userManager.AddToRoleAsync(admin, "Admin");

        var userEmail = "user@local.test";
        var user = await userManager.FindByEmailAsync(userEmail);
        if (user is null)
        {
            user = new ApplicationUser { UserName = userEmail, Email = userEmail, EmailConfirmed = true };
            await userManager.CreateAsync(user, "User123!");
        }

        if (!await userManager.IsInRoleAsync(user, "User"))
            await userManager.AddToRoleAsync(user, "User");
    }
}
