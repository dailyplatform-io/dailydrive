namespace Ride.Api.Models.Dto;

public record AuctionBidDto(
    Guid Id,
    string BidderName,
    decimal AmountEur,
    DateTime CreatedAt);
