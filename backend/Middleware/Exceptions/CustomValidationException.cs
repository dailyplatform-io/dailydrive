namespace Ride.Api.Middleware.Exceptions;

public class CustomValidationException(IDictionary<string, string[]> errors) : Exception("Request validation failed")
{
    public IDictionary<string, string[]> Errors { get; } = errors;
}
