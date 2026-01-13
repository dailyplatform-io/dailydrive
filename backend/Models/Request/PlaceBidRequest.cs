using System.ComponentModel.DataAnnotations;

namespace Ride.Api.Models.Request;

public class PlaceBidRequest
{
    [Required]
    [Range(0, double.MaxValue)]
    public decimal AmountEur { get; set; }

    [MaxLength(80)]
    public string? DisplayName { get; set; }
}
