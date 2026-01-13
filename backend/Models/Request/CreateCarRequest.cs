using System.ComponentModel.DataAnnotations;
using Ride.Api.Data.Entities;
using Ride.Api.Models.Dto;

namespace Ride.Api.Models.Request;

public class CreateCarRequest
{
    [Required]
    public Guid OwnerId { get; init; }

    [Required, MaxLength(100)]
    public string Brand { get; init; } = string.Empty;

    [Required, MaxLength(100)]
    public string Model { get; init; } = string.Empty;

    [MaxLength(150)]
    public string? Subtitle { get; init; }

    [Range(1950, 2100)]
    public int Year { get; init; } = DateTime.UtcNow.Year;

    [Required]
    public BodyStyle BodyStyle { get; init; } = BodyStyle.Sedan;

    [Required]
    public FuelType FuelType { get; init; } = FuelType.Gasoline;

    [Required]
    public Transmission Transmission { get; init; } = Transmission.Automatic;

    [Range(1, 2000)]
    public int EnginePowerHp { get; init; } = 120;

    [Range(0.1, 10)]
    public decimal EngineVolumeL { get; init; } = 2.0m;

    [Range(1, 20)]
    public int Seats { get; init; } = 5;

    [Range(1, 10)]
    public int Doors { get; init; } = 4;

    [Required]
    public string Color { get; init; } = "Black";
    [Required]
    public string ExteriorColor { get; init; } = "Black";
    [Required]
    public string InteriorColor { get; init; } = "Black";

    [Range(0, int.MaxValue)]
    public int MileageKm { get; init; }

    public bool IsForRent { get; init; }
    public bool IsForSale { get; init; }

    [Range(0, 100000)]
    public decimal? RentPricePerHour { get; init; }

    [Range(0, 100000)]
    public decimal? RentPricePerDay { get; init; }

    [Range(0, 10000000)]
    public decimal? SalePrice { get; init; }

    public int? AccidentsCount { get; init; }
    public int? OwnersCount { get; init; }
    public string? ServiceHistory { get; init; }
    public string? Description { get; init; }
    public IReadOnlyCollection<OptionGroupDto>? OptionsGroups { get; init; }
    public decimal Fees { get; init; }
    public decimal Taxes { get; init; }
    public double Rating { get; init; } = 4.8;
    public int ReviewsCount { get; init; }
    public int? DistanceMeters { get; init; }
    public string? DistanceText { get; init; }
    public bool AvailableNow { get; init; } = true;
    public string? CoverImageId { get; init; }
    public IReadOnlyCollection<string>? ImageIds { get; init; }
    public CarLocationDto Location { get; init; } = new(string.Empty, string.Empty, null, null, null);
    public string? AvailableIn { get; init; }
}
