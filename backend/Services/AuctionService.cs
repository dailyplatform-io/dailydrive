using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Ride.Api.Data;
using Ride.Api.Data.Entities;
using Ride.Api.Models.Dto;
using Ride.Api.Models.Request;
using Ride.Api.Services.Interface;
using Ride.Api.Utilities.Mappings;
using Ride.Api.Utilities.Results;
using Ride.Api.Utilities.Settings;

namespace Ride.Api.Services;

public class AuctionService(
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    IOptions<StorageSettings> storageOptions) : IAuctionService
{
    private readonly StorageSettings _storageSettings = storageOptions.Value;

    public async Task<Result<IEnumerable<AuctionDto>>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        var nowUtc = DateTime.UtcNow;
        var auctions = await dbContext.Auctions
            .Include(a => a.Car).ThenInclude(c => c.Images)
            .Include(a => a.Car.Owner)
            .Include(a => a.Bids)
            .Where(a => a.IsActive && a.EndsAt >= nowUtc)
            .ToListAsync(cancellationToken);

        var filtered = auctions
            .Where(a => a.Car.Owner != null && OwnerHasAccess(a.Car.Owner, nowUtc))
            .Select(MapToDto)
            .OrderBy(a => a.HasStarted ? 0 : 1) // ongoing first, then upcoming
            .ThenBy(a => a.StartsAt)
            .ToList();

        return Result<IEnumerable<AuctionDto>>.Success(filtered);
    }

    public async Task<Result<AuctionDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var nowUtc = DateTime.UtcNow;
        var auction = await dbContext.Auctions
            .Include(a => a.Car).ThenInclude(c => c.Images)
            .Include(a => a.Car.Owner)
            .Include(a => a.Bids)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (auction is null)
        {
            return Result<AuctionDto>.Failure("Auction not found.");
        }

        if (auction.Car.Owner is null || !OwnerHasAccess(auction.Car.Owner, nowUtc))
        {
            return Result<AuctionDto>.Failure("Auction owner is not active.");
        }

        return Result<AuctionDto>.Success(MapToDto(auction));
    }

    public async Task<Result<AuctionDto>> PlaceBidAsync(
        Guid auctionId,
        PlaceBidRequest request,
        Guid? bidderId,
        string? bidderEmail,
        CancellationToken cancellationToken = default)
    {
        var nowUtc = DateTime.UtcNow;
        var auction = await dbContext.Auctions
            .Include(a => a.Car).ThenInclude(c => c.Images)
            .Include(a => a.Car.Owner)
            .Include(a => a.Bids)
            .FirstOrDefaultAsync(a => a.Id == auctionId, cancellationToken);

        if (auction is null)
        {
            return Result<AuctionDto>.Failure("Auction not found.");
        }

        if (auction.Car.Owner is null || !OwnerHasAccess(auction.Car.Owner, nowUtc))
        {
            return Result<AuctionDto>.Failure("Auction owner is not active.");
        }

        if (!auction.IsActive)
        {
            return Result<AuctionDto>.Failure("This auction is not active.");
        }

        if (auction.StartsAt > nowUtc)
        {
            return Result<AuctionDto>.Failure("This auction has not started yet.");
        }

        if (auction.EndsAt <= nowUtc)
        {
            return Result<AuctionDto>.Failure("This auction has ended.");
        }

        var currentPrice = GetCurrentPrice(auction);
        var minBid = currentPrice + 300m;
        if (request.AmountEur < minBid)
        {
            return Result<AuctionDto>.Failure($"Minimum bid is €{minBid:0}.");
        }

        var bidderName = (request.DisplayName ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(bidderName) && bidderId.HasValue)
        {
            var user = await userManager.FindByIdAsync(bidderId.Value.ToString());
            bidderName = user?.UserName ?? user?.Email ?? bidderEmail ?? "Bidder";
        }
        else if (string.IsNullOrWhiteSpace(bidderName))
        {
            bidderName = bidderEmail ?? "Bidder";
        }

        var bid = new AuctionBid
        {
            Id = Guid.NewGuid(),
            AuctionId = auction.Id,
            AmountEur = request.AmountEur,
            BidderId = bidderId,
            BidderName = bidderName,
            CreatedAt = nowUtc
        };

        auction.Bids.Add(bid);
        auction.UpdatedAt = nowUtc;

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result<AuctionDto>.Success(MapToDto(auction));
    }

    private AuctionDto MapToDto(Auction auction)
    {
        var nowUtc = DateTime.UtcNow;
        var carDto = auction.Car.ToDto(_storageSettings.ImageBaseUrl);
        var coverUrl = auction.ImageUrls?.FirstOrDefault() ?? carDto.ImageUrl;
        var gallery = (auction.ImageUrls?.Where(u => !string.IsNullOrWhiteSpace(u)).ToList() ?? new List<string>())
            .DefaultIfEmpty(carDto.ImageUrl ?? string.Empty)
            .Where(u => !string.IsNullOrWhiteSpace(u))
            .Distinct()
            .ToList();

        // If no custom auction images were provided, build from car blobs
        if (gallery.Count == 0 && auction.Car.Images?.Count > 0)
        {
            gallery = auction.Car.Images
                .Select(i => $"{_storageSettings.ImageBaseUrl.TrimEnd('/')}/{i.BlobName}")
                .ToList();
            coverUrl = gallery.FirstOrDefault() ?? coverUrl;
        }

        var currentPrice = GetCurrentPrice(auction);

        var bids = auction.Bids
            .OrderByDescending(b => b.AmountEur)
            .ThenByDescending(b => b.CreatedAt)
            .Select(b => new AuctionBidDto(b.Id, b.BidderName, b.AmountEur, b.CreatedAt))
            .ToList();

        return new AuctionDto(
            auction.Id,
            auction.CarId,
            carDto with { ImageUrl = coverUrl },
            auction.StartPriceEur,
            auction.BuyNowPriceEur,
            currentPrice,
            auction.StartsAt,
            auction.EndsAt,
            auction.IsActive,
            auction.StartsAt <= nowUtc,
            auction.EndsAt <= nowUtc,
            auction.Issues ?? new List<string>(),
            gallery,
            auction.VideoUrls ?? new List<string>(),
            bids);
    }

    private static bool OwnerHasAccess(ApplicationUser owner, DateTime nowUtc)
    {
        var subscriptionValid = owner.IsActive && (!owner.SubscriptionUntil.HasValue || owner.SubscriptionUntil >= nowUtc);
        var trialValid = !owner.PaymentCompleted && owner.TrialEndsAt.HasValue && owner.TrialEndsAt >= nowUtc;
        return subscriptionValid || trialValid;
    }

    private static decimal GetCurrentPrice(Auction auction)
    {
        var highestBid = auction.Bids?.OrderByDescending(b => b.AmountEur).FirstOrDefault()?.AmountEur;
        var baseline = Math.Max(auction.StartPriceEur, highestBid ?? 0m);
        return baseline == 0 ? auction.StartPriceEur : baseline;
    }
}
