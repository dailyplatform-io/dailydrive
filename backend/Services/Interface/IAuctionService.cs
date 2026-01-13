using Ride.Api.Models.Dto;
using Ride.Api.Models.Request;
using Ride.Api.Utilities.Results;

namespace Ride.Api.Services.Interface;

public interface IAuctionService
{
    Task<Result<IEnumerable<AuctionDto>>> GetActiveAsync(CancellationToken cancellationToken = default);
    Task<Result<AuctionDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<AuctionDto>> PlaceBidAsync(Guid auctionId, PlaceBidRequest request, Guid? bidderId, string? bidderEmail, CancellationToken cancellationToken = default);
}
