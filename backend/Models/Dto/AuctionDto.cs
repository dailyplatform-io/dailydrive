namespace Ride.Api.Models.Dto;

public record AuctionDto(
    Guid Id,
    Guid CarId,
    CarDto Car,
    decimal StartPriceEur,
    decimal? BuyNowPriceEur,
    decimal CurrentPriceEur,
    DateTime StartsAt,
    DateTime EndsAt,
    bool IsActive,
    bool HasStarted,
    bool HasEnded,
    IReadOnlyCollection<string> Issues,
    IReadOnlyCollection<string> ImageUrls,
    IReadOnlyCollection<string> VideoUrls,
    IReadOnlyCollection<AuctionBidDto> Bids);
