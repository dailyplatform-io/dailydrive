namespace Ride.Api.Utilities.Settings;

public class PaginationSettings
{
    public const string SectionName = "Pagination";
    public int DefaultPageSize { get; set; } = 20;
    public int MaxPageSize { get; set; } = 100;
}
