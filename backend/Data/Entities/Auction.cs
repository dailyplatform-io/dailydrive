namespace Ride.Api.Data.Entities;

public class Auction
{
    public Guid Id { get; set; }
    public Guid CarId { get; set; }
    public Car Car { get; set; } = null!;

    public Guid OwnerId { get; set; }
    public ApplicationUser Owner { get; set; } = null!;

    public decimal StartPriceEur { get; set; }
    public decimal? BuyNowPriceEur { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Description { get; set; }

    public List<string> Issues { get; set; } = new();
    public List<string> ImageUrls { get; set; } = new();
    public List<string> VideoUrls { get; set; } = new();

    public ICollection<AuctionBid> Bids { get; set; } = new List<AuctionBid>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
