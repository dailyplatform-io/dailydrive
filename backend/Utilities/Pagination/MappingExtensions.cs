namespace Ride.Api.Utilities.Pagination;

public static class MappingExtensions
{
    public static PaginatedList<TResult> Map<TSource, TResult>(
        this PaginatedList<TSource> source,
        Func<TSource, TResult> selector)
    {
        var mapped = source.Items.Select(selector);
        return PaginatedList<TResult>.From(mapped, source.TotalCount, source.PageIndex, source.PageSize);
    }
}
