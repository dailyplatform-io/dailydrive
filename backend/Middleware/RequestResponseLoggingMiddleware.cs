using System.Diagnostics;
using Ride.Api.Middleware.Common;

namespace Ride.Api.Middleware;

public class RequestResponseLoggingMiddleware(
    RequestDelegate next,
    ILogger<RequestResponseLoggingMiddleware> logger)
{
    public async Task Invoke(HttpContext context)
    {
        var requestContext = context.RequestServices.GetRequiredService<Utilities.Context.IRequestContext>();
        var correlationId = GetCorrelationId(context);
        requestContext.CorrelationId = correlationId;
        context.Response.Headers["X-Correlation-Id"] = correlationId;

        var logMessage = new LogMessage
        {
            Method = context.Request.Method,
            Path = context.Request.Path
        };

        var stopwatch = Stopwatch.StartNew();
        logger.LogInformation("Handling {Method} {Path} [{CorrelationId}]", logMessage.Method, logMessage.Path, correlationId);

        await next(context);

        stopwatch.Stop();
        logMessage.ElapsedMs = stopwatch.ElapsedMilliseconds;
        logMessage.StatusCode = context.Response.StatusCode;
        logMessage.CorrelationId = correlationId;

        logger.LogInformation(
            "Handled {Method} {Path} => {StatusCode} in {Elapsed}ms [{CorrelationId}]",
            logMessage.Method,
            logMessage.Path,
            logMessage.StatusCode,
            logMessage.ElapsedMs,
            logMessage.CorrelationId);
    }

    private static string GetCorrelationId(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue("X-Correlation-Id", out var header) && !string.IsNullOrWhiteSpace(header))
        {
            return header.ToString();
        }

        return context.TraceIdentifier ?? Guid.NewGuid().ToString();
    }
}
