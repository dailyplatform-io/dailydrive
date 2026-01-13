using Ride.Api.Models.Dto;
using Ride.Api.Models.Request;
using Ride.Api.Utilities.Results;

namespace Ride.Api.Services.Interface;

public interface ICarService
{
    Task<Result<PagedResult<CarDto>>> GetAsync(CarFilterRequest request, CancellationToken cancellationToken = default);
    Task<Result<CarDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<CarDto>> CreateAsync(CreateCarRequest request, CancellationToken cancellationToken = default);
    Task<Result<CarDto>> UpdateAsync(Guid id, UpdateCarRequest request, CancellationToken cancellationToken = default);
    Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
