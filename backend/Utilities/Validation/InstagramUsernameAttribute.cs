using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Ride.Api.Utilities.Validation;

public sealed class InstagramUsernameAttribute : ValidationAttribute
{
    private static readonly Regex ValidPattern = new("^[a-zA-Z0-9._]{1,30}$", RegexOptions.Compiled);

    public InstagramUsernameAttribute()
    {
        ErrorMessage = "Invalid Instagram username. Use letters, numbers, periods, and underscores only.";
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is null) return ValidationResult.Success;

        if (value is not string raw)
        {
            return new ValidationResult(ErrorMessage);
        }

        var trimmed = raw.Trim();
        if (string.IsNullOrEmpty(trimmed)) return ValidationResult.Success;

        if (trimmed.StartsWith("@", StringComparison.Ordinal))
        {
            trimmed = trimmed[1..];
        }

        return ValidPattern.IsMatch(trimmed)
            ? ValidationResult.Success
            : new ValidationResult(ErrorMessage);
    }
}
