using Microsoft.EntityFrameworkCore;

namespace Ride.Api.Utilities.Pagination;

public class PaginatedList<T>
{
    public IReadOnlyCollection<T> Items { get; }
    public int PageIndex { get; }
    public int PageSize { get; }
    public int TotalCount { get; }
    public int TotalPages { get; }
    public bool HasPreviousPage => PageIndex > 1;
    public bool HasNextPage => PageIndex < TotalPages;

    private PaginatedList(List<T> items, int count, int pageIndex, int pageSize)
    {
        Items = items;
        TotalCount = count;
        PageIndex = pageIndex;
        PageSize = pageSize;
        TotalPages = (int)Math.Ceiling(count / (double)pageSize);
    }

    public static PaginatedList<T> From(IEnumerable<T> items, int count, int pageIndex, int pageSize)
    {
        return new PaginatedList<T>(items.ToList(), count, pageIndex, pageSize);
    }

    public static async Task<PaginatedList<T>> CreateAsync(
        IQueryable<T> source,
        int pageIndex,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var count = await source.CountAsync(cancellationToken);
        var items = await source.Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PaginatedList<T>(items, count, pageIndex, pageSize);
    }
}
