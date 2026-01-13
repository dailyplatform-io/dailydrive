using System.ComponentModel.DataAnnotations;
using Ride.Api.Utilities.Validation;

namespace Ride.Api.Models.Request;

public class ChangePasswordRequest
{
    [Required]
    public string CurrentPassword { get; init; } = string.Empty;

    [Required, StrongPassword, MaxLength(100)]
    public string NewPassword { get; init; } = string.Empty;

    [Required, Compare(nameof(NewPassword), ErrorMessage = "The new password and confirmation password do not match.")]
    public string ConfirmNewPassword { get; init; } = string.Empty;
}