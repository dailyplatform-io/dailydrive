namespace Ride.Api.Middleware.Common;

public class LogMessage
{
    public string Method { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string? CorrelationId { get; set; }
    public int? StatusCode { get; set; }
    public long? ElapsedMs { get; set; }
}
