using Microsoft.AspNetCore.Http;

namespace Ride.Api.Utilities.Context;

public class RequestContext(IHttpContextAccessor accessor) : IRequestContext
{
    public string CorrelationId
    {
        get => accessor.HttpContext?.TraceIdentifier ?? string.Empty;
        set
        {
            if (accessor.HttpContext is { } context)
            {
                context.TraceIdentifier = value;
            }
        }
    }

    public string? UserId { get; set; }
    public string? UserEmail { get; set; }
}
