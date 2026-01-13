using Ride.Api.Models.Dto;

namespace Ride.Api.Models.Response;

public record CarResponse(CarDto Car) : IBaseResponse
{
    public bool Success { get; init; } = true;
    public string? Message { get; init; }
}
