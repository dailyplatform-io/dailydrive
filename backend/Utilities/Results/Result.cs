namespace Ride.Api.Utilities.Results;

public record Result(bool Succeeded, string? Error = null)
{
    public static Result Success() => new(true, null);
    public static Result Failure(string error) => new(false, error);
}

public record Result<T>(bool Succeeded, T? Data, string? Error = null)
{
    public static Result<T> Success(T data) => new(true, data, null);
    public static Result<T> Failure(string error) => new(false, default, error);
}
