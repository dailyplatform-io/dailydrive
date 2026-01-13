namespace Ride.Api.Utilities;

public class ApplicationLog
{
    public string Message { get; set; } = string.Empty;
    public string? CorrelationId { get; set; }
    public string? UserId { get; set; }
    public string? Path { get; set; }
    public int? StatusCode { get; set; }
    public string? Method { get; set; }
    public long? ElapsedMs { get; set; }
}
