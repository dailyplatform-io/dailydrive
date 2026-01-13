namespace Ride.Api.Models.Request;

public interface IBaseRequest
{
    string? SearchKey { get; }
    int PageNumber { get; }
    int PageSize { get; }
    bool IsDescending { get; }
    string? ColumnName { get; }
}
