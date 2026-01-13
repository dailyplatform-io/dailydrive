using Microsoft.AspNetCore.Diagnostics;
using Ride.Api.Middleware.Common;

namespace Ride.Api.Middleware.Exceptions;

public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var statusCode = exception switch
        {
            CustomValidationException => StatusCodes.Status400BadRequest,
            KeyNotFoundException => StatusCodes.Status404NotFound,
            _ => StatusCodes.Status500InternalServerError
        };

        var correlationId = httpContext.TraceIdentifier;

        logger.LogError(exception, "Request failed with {StatusCode} [{CorrelationId}]", statusCode, correlationId);

        var response = new ErrorResponse
        {
            Message = exception.Message,
            TraceId = correlationId
        };

        if (exception is CustomValidationException validationException)
        {
            response.Errors = validationException.Errors;
        }

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/json";
        await httpContext.Response.WriteAsJsonAsync(response, cancellationToken);

        return true;
    }
}
