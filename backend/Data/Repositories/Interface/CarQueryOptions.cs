using Ride.Api.Data.Entities;

namespace Ride.Api.Data.Repositories.Interface;

public sealed class CarQueryOptions
{
    public Guid? OwnerId { get; init; }
    public ListingStatus? ListingStatus { get; init; }
    public bool? IsForRent { get; init; }
    public bool? IsForSale { get; init; }
    public string? SearchKey { get; init; }
    public string? City { get; init; }
    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public bool IsDescending { get; init; } = true;
    public string? ColumnName { get; init; }
}
