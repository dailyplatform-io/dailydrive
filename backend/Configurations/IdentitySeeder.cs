using Microsoft.AspNetCore.Identity;
using Ride.Api.Data.Entities;
using Ride.Api.Utilities.Identity;

namespace Ride.Api.Configurations;

public static class IdentitySeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

        const string adminRole = RoleNames.Admin;
        const string regularRole = RoleNames.Regular;
        const string adminEmail = "admin@ride.local";
        const string adminPassword = "Admin123$";

        await EnsureRole(roleManager, adminRole);
        await EnsureRole(roleManager, regularRole);

        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser is null)
        {
            adminUser = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
                FirstName = "Ride",
                LastName = "Admin"
            };

            var result = await userManager.CreateAsync(adminUser, adminPassword);
            if (!result.Succeeded)
            {
                throw new InvalidOperationException($"Failed to seed admin user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }
        }

        if (!await userManager.IsInRoleAsync(adminUser, adminRole))
        {
            await userManager.AddToRoleAsync(adminUser, adminRole);
        }
    }

    private static async Task EnsureRole(RoleManager<IdentityRole<Guid>> roleManager, string roleName)
    {
        if (!await roleManager.RoleExistsAsync(roleName))
        {
            await roleManager.CreateAsync(new IdentityRole<Guid>(roleName));
        }
    }
}
