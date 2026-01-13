using Ride.Api.Data.Entities;

namespace Ride.Api.Models.Response;

public class ReservationResponse
{
    public Guid Id { get; set; }
    public Guid CarId { get; set; }
    public string CarBrand { get; set; } = string.Empty;
    public string CarModel { get; set; } = string.Empty;
    public string? CarImageUrl { get; set; }
    public Guid RenterId { get; set; }
    public string RenterName { get; set; } = string.Empty;
    public string? RenterEmail { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }
}

public class CalendarReservationResponse
{
    public Guid Id { get; set; }
    public Guid CarId { get; set; }
    public string CarBrand { get; set; } = string.Empty;
    public string CarModel { get; set; } = string.Empty;
    public string CarColor { get; set; } = string.Empty;
    public string? CarImageUrl { get; set; }
    public string RenterName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class AvailabilityResponse
{
    public bool IsAvailable { get; set; }
    public List<DateRange> UnavailableDates { get; set; } = new();
}

public class DateRange
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}
