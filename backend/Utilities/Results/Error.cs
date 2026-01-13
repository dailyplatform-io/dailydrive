namespace Ride.Api.Utilities.Results;

public class Error
{
    public string Message { get; set; } = string.Empty;
    public string? TraceId { get; set; }
    public IDictionary<string, string[]>? Details { get; set; }
}
