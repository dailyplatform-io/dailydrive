using Ride.Api.Utilities.Pagination;

namespace Ride.Api.Utilities.Results;

public record PaginationMetadata(int PageIndex, int PageSize, int TotalCount, int TotalPages, bool HasPreviousPage, bool HasNextPage);

public record PagedResult<T>(IReadOnlyCollection<T> Items, PaginationMetadata Metadata)
{
    public static PagedResult<T> FromPaginatedList(PaginatedList<T> list)
    {
        var metadata = new PaginationMetadata(
            list.PageIndex,
            list.PageSize,
            list.TotalCount,
            list.TotalPages,
            list.HasPreviousPage,
            list.HasNextPage);

        return new PagedResult<T>(list.Items.ToList(), metadata);
    }
}
