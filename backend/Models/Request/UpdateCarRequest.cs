using Ride.Api.Data.Entities;
using Ride.Api.Models.Dto;

namespace Ride.Api.Models.Request;

public class UpdateCarRequest
{
    public string? Brand { get; init; }
    public string? Model { get; init; }
    public string? Subtitle { get; init; }
    public int? Year { get; init; }
    public BodyStyle? BodyStyle { get; init; }
    public FuelType? FuelType { get; init; }
    public Transmission? Transmission { get; init; }
    public int? EnginePowerHp { get; init; }
    public decimal? EngineVolumeL { get; init; }
    public int? Seats { get; init; }
    public int? Doors { get; init; }
    public string? Color { get; init; }
    public string? ExteriorColor { get; init; }
    public string? InteriorColor { get; init; }
    public int? MileageKm { get; init; }
    public bool? IsForRent { get; init; }
    public bool? IsForSale { get; init; }
    public decimal? RentPricePerHour { get; init; }
    public decimal? RentPricePerDay { get; init; }
    public decimal? SalePrice { get; init; }
    public int? AccidentsCount { get; init; }
    public int? OwnersCount { get; init; }
    public string? ServiceHistory { get; init; }
    public string? Description { get; init; }
    public IReadOnlyCollection<OptionGroupDto>? OptionsGroups { get; init; }
    public decimal? Fees { get; init; }
    public decimal? Taxes { get; init; }
    public double? Rating { get; init; }
    public int? ReviewsCount { get; init; }
    public int? DistanceMeters { get; init; }
    public string? DistanceText { get; init; }
    public bool? AvailableNow { get; init; }
    public string? CoverImageId { get; init; }
    public IReadOnlyCollection<string>? ImageIds { get; init; }
    public CarLocationDto? Location { get; init; }
    public ListingStatus? ListingStatus { get; init; }
    public string? AvailableIn { get; init; }
}
