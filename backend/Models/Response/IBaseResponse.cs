namespace Ride.Api.Models.Response;

public interface IBaseResponse
{
    bool Success { get; }
    string? Message { get; }
}
