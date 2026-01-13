namespace Ride.Api.Models.Response;

public class RefreshTokenResponse
{
    public bool Success { get; init; }
    public string AccessToken { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
    public DateTime ExpiresAt { get; init; }
    public string? Message { get; init; }
    public string? Error { get; init; }
}