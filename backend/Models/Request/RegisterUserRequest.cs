using System.ComponentModel.DataAnnotations;
using Ride.Api.Data.Entities;
using Ride.Api.Utilities.Validation;

namespace Ride.Api.Models.Request;

public class RegisterUserRequest
{
    [Required, MaxLength(100)]
    public string FirstName { get; init; } = string.Empty;

    [Required, MaxLength(100)]
    public string LastName { get; init; } = string.Empty;

    [Required, EmailAddress, MaxLength(150)]
    public string Email { get; init; } = string.Empty;

    [Required, Phone, MaxLength(30)]
    public string Phone { get; init; } = string.Empty;

    [Required, MaxLength(120)]
    public string SellerName { get; init; } = string.Empty;

    [MaxLength(30), InstagramUsername]
    public string? InstagramName { get; init; }

    [MaxLength(100)]
    public string? FacebookName { get; init; }

    [Required]
    public OwnerProfileType ProfileType { get; init; } = OwnerProfileType.Rent; // rent or buy

    [Required, MaxLength(20)]
    public string SubscriptionTier { get; init; } = "free";

    [MaxLength(80)]
    public string City { get; init; } = string.Empty;

    [MaxLength(200)]
    public string Address { get; init; } = string.Empty;

    public double? Latitude { get; init; }
    public double? Longitude { get; init; }

    [Required, StrongPassword, MaxLength(100)]
    public string Password { get; init; } = string.Empty;
}
