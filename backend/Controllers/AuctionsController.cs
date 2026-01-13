using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ride.Api.Middleware.Common;
using Ride.Api.Models.Dto;
using Ride.Api.Models.Request;
using Ride.Api.Models.Response;
using Ride.Api.Services.Interface;

namespace Ride.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuctionsController(IAuctionService auctionService, ILogger<AuctionsController> logger) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<AuctionDto>>> GetAuctions(CancellationToken cancellationToken)
    {
        var result = await auctionService.GetActiveAsync(cancellationToken);
        if (!result.Succeeded || result.Data is null)
        {
            return HandleFailure(result.Error ?? "Unable to fetch auctions.");
        }

        return Ok(result.Data);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<AuctionDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await auctionService.GetByIdAsync(id, cancellationToken);
        if (!result.Succeeded || result.Data is null)
        {
            return HandleFailure(result.Error ?? "Auction not found.");
        }

        return Ok(result.Data);
    }

    [HttpPost("{id:guid}/bids")]
    [Authorize]
    public async Task<ActionResult<AuctionDto>> PlaceBid(
        Guid id,
        [FromBody] PlaceBidRequest request,
        CancellationToken cancellationToken)
    {
        var bidderId = User.FindFirstValue("uid");
        Guid? parsedBidderId = null;
        if (Guid.TryParse(bidderId, out var guid))
        {
            parsedBidderId = guid;
        }

        var result = await auctionService.PlaceBidAsync(id, request, parsedBidderId, User.Identity?.Name, cancellationToken);
        if (!result.Succeeded || result.Data is null)
        {
            logger.LogWarning("Bid failed for auction {AuctionId}: {Error}", id, result.Error);
            return HandleFailure(result.Error ?? "Unable to place bid.");
        }

        logger.LogInformation("Bid placed on auction {AuctionId} by {User}", id, parsedBidderId ?? Guid.Empty);
        return Ok(result.Data);
    }

    private ActionResult HandleFailure(string error)
    {
        var response = new ErrorResponse { Message = error };
        return error.Contains("not found", StringComparison.OrdinalIgnoreCase)
            ? NotFound(response)
            : BadRequest(response);
    }
}
