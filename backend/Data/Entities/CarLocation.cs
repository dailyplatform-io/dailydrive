using System.ComponentModel.DataAnnotations;

namespace Ride.Api.Data.Entities;

public class CarLocation
{
    [MaxLength(120)]
    public string City { get; set; } = string.Empty;

    [MaxLength(200)]
    public string FullAddress { get; set; } = string.Empty;

    [MaxLength(120)]
    public string? MapLabel { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}
