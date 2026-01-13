using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Ride.Api.Data.Entities;

public class Car : BaseAudity<Guid>
{
    [Required]
    public Guid OwnerId { get; set; }
    public ApplicationUser? Owner { get; set; }

    [Required]
    public int CarMakeId { get; set; }
    public CarMake CarMake { get; set; } = null!;

    [Required]
    public int CarModelId { get; set; }
    public CarModel CarModel { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string Brand { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Model { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? Subtitle { get; set; }

    public int Year { get; set; }
    public BodyStyle BodyStyle { get; set; }
    public FuelType FuelType { get; set; }
    public Transmission Transmission { get; set; }
    public int EnginePowerHp { get; set; }
    public decimal EngineVolumeL { get; set; }
    public int Seats { get; set; }
    public int Doors { get; set; }
    public string Color { get; set; } = "Black";
    public string ExteriorColor { get; set; } = "Black";
    public string InteriorColor { get; set; } = "Black";
    public int MileageKm { get; set; }
    public bool IsForRent { get; set; }
    public bool IsForSale { get; set; }
    public decimal? RentPricePerHour { get; set; }
    public decimal? RentPricePerDay { get; set; }
    public decimal? SalePrice { get; set; }
    public int AccidentsCount { get; set; }
    public int OwnersCount { get; set; }
    public string? ServiceHistory { get; set; }
    public string? Description { get; set; }
    public decimal Fees { get; set; }
    public decimal Taxes { get; set; }
    public double Rating { get; set; }
    public int ReviewsCount { get; set; }
    public int? DistanceMeters { get; set; }
    public string? DistanceText { get; set; }
    public bool AvailableNow { get; set; } = true;
    public string? AvailableIn { get; set; }

    public ListingStatus ListingStatus { get; set; } = ListingStatus.Active;

    [MaxLength(512)]
    public string? ImageUrl { get; set; }

    public string? CoverImageId { get; set; }
    public ICollection<CarImage> Images { get; set; } = new List<CarImage>();

    public CarLocation Location { get; set; } = new();

    [Column(TypeName = "TEXT")]
    public List<OptionGroup> OptionGroups { get; set; } = new();
}
