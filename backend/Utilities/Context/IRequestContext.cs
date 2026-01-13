namespace Ride.Api.Utilities.Context;

public interface IRequestContext
{
    string CorrelationId { get; set; }
    string? UserId { get; set; }
    string? UserEmail { get; set; }
}
