namespace Ride.Api.Data.Entities;

public class AuctionBid
{
    public Guid Id { get; set; }
    public Guid AuctionId { get; set; }
    public Auction Auction { get; set; } = null!;

    public Guid? BidderId { get; set; }
    public ApplicationUser? Bidder { get; set; }
    public string BidderName { get; set; } = string.Empty;

    public decimal AmountEur { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
