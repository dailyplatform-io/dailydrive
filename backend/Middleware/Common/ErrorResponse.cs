namespace Ride.Api.Middleware.Common;

public class ErrorResponse
{
    public string Message { get; set; } = "An unexpected error occurred.";
    public string? TraceId { get; set; }
    public IDictionary<string, string[]>? Errors { get; set; }
}
