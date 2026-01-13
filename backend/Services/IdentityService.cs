using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Ride.Api.Data.Entities;
using Ride.Api.Models.Response;
using Ride.Api.Services.Interface;
using Ride.Api.Utilities.Settings;

namespace Ride.Api.Services;

public class IdentityService(
    UserManager<ApplicationUser> userManager,
    IOptions<JwtSettings> jwtOptions) : IIdentityService
{
    private readonly JwtSettings _jwtSettings = jwtOptions.Value;

    public async Task<AuthResponse> CreateAuthResponseAsync(ApplicationUser user, CancellationToken cancellationToken = default)
    {
        var roles = await userManager.GetRolesAsync(user);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.UniqueName, user.DisplayName ?? user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("uid", user.Id.ToString())
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SigningKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenMinutes);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        var jwt = new JwtSecurityTokenHandler().WriteToken(token);

        return new AuthResponse(jwt, expires, user.Id, user.Email ?? string.Empty);
    }
}
