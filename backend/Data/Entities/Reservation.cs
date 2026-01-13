using System.ComponentModel.DataAnnotations;

namespace Ride.Api.Data.Entities;

public class Reservation : BaseAudity<Guid>
{
    [Required]
    public Guid CarId { get; set; }
    public Car? Car { get; set; }

    [Required]
    public Guid RenterId { get; set; }
    public ApplicationUser? Renter { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    public decimal TotalPrice { get; set; }

    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;

    [MaxLength(500)]
    public string? Notes { get; set; }

    [MaxLength(100)]
    public string? PaymentTransactionId { get; set; }

    [MaxLength(50)]
    public string? PaymentMethod { get; set; }

    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    [MaxLength(500)]
    public string? CancellationReason { get; set; }
}
