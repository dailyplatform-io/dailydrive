using Ride.Api.Utilities.Results;

namespace Ride.Api.Models.Response;

public record PagedResponse<T>(IReadOnlyCollection<T> Items, PaginationMetadata Pagination) : IBaseResponse
{
    public bool Success { get; init; } = true;
    public string? Message { get; init; }

    public static PagedResponse<T> FromPagedResult(PagedResult<T> result)
        => new(result.Items, result.Metadata);
}
