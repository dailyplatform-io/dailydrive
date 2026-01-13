using Ride.Api.Data.Entities;
using Ride.Api.Utilities.Pagination;

namespace Ride.Api.Data.Repositories.Interface;

public interface ICarRepository : IRepository<Car>
{
    Task<PaginatedList<Car>> GetAsync(CarQueryOptions queryOptions, CancellationToken cancellationToken = default);
    Task<Car?> GetWithImagesAsync(Guid id, CancellationToken cancellationToken = default);
}
