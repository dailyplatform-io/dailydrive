namespace Ride.Api.Models.Request;

public class CreateReservationRequest
{
    public Guid CarId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string? Notes { get; set; }
}

public class UpdateReservationRequest
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
    public string? CancellationReason { get; set; }
}

public class CheckAvailabilityRequest
{
    public Guid CarId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}
