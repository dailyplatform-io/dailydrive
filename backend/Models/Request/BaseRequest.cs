using System.ComponentModel.DataAnnotations;

namespace Ride.Api.Models.Request;

public abstract class BaseRequest : IBaseRequest
{
    [MaxLength(200)]
    public string? SearchKey { get; init; }

    [Range(1, int.MaxValue)]
    public int PageNumber { get; init; } = 1;

    [Range(1, int.MaxValue)]
    public int PageSize { get; init; } = 20;

    public bool IsDescending { get; init; } = true;

    [MaxLength(100)]
    public string? ColumnName { get; init; }
}
