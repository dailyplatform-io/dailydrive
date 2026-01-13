using System.ComponentModel.DataAnnotations;

namespace Ride.Api.Utilities.Validation;

public class StrongPasswordAttribute : ValidationAttribute
{
    public override bool IsValid(object? value)
    {
        if (value is not string password)
            return false;

        var result = PasswordValidator.ValidatePassword(password);
        return result.IsValid;
    }

    public override string FormatErrorMessage(string name)
    {
        return PasswordValidator.Requirements.RequirementDescription;
    }
}