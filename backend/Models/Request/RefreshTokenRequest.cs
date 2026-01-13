using System.ComponentModel.DataAnnotations;

namespace Ride.Api.Models.Request;

public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; init; } = string.Empty;
}