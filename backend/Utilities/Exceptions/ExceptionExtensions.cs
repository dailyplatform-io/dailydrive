namespace Ride.Api.Utilities.Exceptions;

public static class ExceptionExtensions
{
    public static string ToProblemMessage(this Exception exception)
    {
        return exception.InnerException is null
            ? exception.Message
            : $"{exception.Message} ({exception.InnerException.Message})";
    }
}
