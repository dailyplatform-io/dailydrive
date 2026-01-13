using Ride.Api.Data.Entities;

namespace Ride.Api.Models.Request;

public class CarFilterRequest : BaseRequest
{
    public Guid? OwnerId { get; init; }
    public ListingStatus? ListingStatus { get; init; }
    public bool? IsForRent { get; init; }
    public bool? IsForSale { get; init; }
    public string? City { get; init; }
}
