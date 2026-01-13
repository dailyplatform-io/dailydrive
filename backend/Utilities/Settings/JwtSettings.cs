namespace Ride.Api.Utilities.Settings;

public class JwtSettings
{
    public const string SectionName = "Jwt";
    public string Issuer { get; set; } = "ride-api";
    public string Audience { get; set; } = "ride-api-clients";
    public string SigningKey { get; set; } = "change-this-key-use-env";
    public int AccessTokenMinutes { get; set; } = 60;
    public string CorsOrigin { get; set; } = "http://localhost:5173";
}
