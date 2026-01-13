using System.Text.RegularExpressions;

namespace Ride.Api.Utilities;

public static class PasswordValidator
{
    public static class Requirements
    {
        public const int MinimumLength = 8;
        public const string RequirementDescription = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.";
    }

    public static ValidationResult ValidatePassword(string password)
    {
        var errors = new List<string>();

        // Check minimum length
        if (password.Length < Requirements.MinimumLength)
        {
            errors.Add($"Password must be at least {Requirements.MinimumLength} characters long");
        }

        // Check for uppercase letter
        if (!Regex.IsMatch(password, @"[A-Z]"))
        {
            errors.Add("Password must contain at least one uppercase letter");
        }

        // Check for lowercase letter
        if (!Regex.IsMatch(password, @"[a-z]"))
        {
            errors.Add("Password must contain at least one lowercase letter");
        }

        // Check for digit
        if (!Regex.IsMatch(password, @"[0-9]"))
        {
            errors.Add("Password must contain at least one number");
        }

        return new ValidationResult
        {
            IsValid = errors.Count == 0,
            Errors = errors
        };
    }

    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public List<string> Errors { get; set; } = new();
        public string? ErrorMessage => Errors.Count > 0 ? string.Join(". ", Errors) : null;
    }
}