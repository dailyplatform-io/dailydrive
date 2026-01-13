using System.ComponentModel.DataAnnotations;
using Ride.Api.Utilities.Validation;

namespace Ride.Api.Models.Request;

public class UpdateOwnerProfileRequest
{
    [Required, MaxLength(120)]
    public string SellerName { get; init; } = string.Empty;

    [MaxLength(30), InstagramUsername]
    public string? InstagramName { get; init; }

    [MaxLength(100)]
    public string? FacebookName { get; init; }
}
