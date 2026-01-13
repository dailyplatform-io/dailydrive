using Ride.Api.Data.Repositories.Interface;

namespace Ride.Api.Data.Repositories.Repository;

public class UnitOfWork(
    ApplicationDbContext dbContext,
    ICarRepository carRepository) : IUnitOfWork
{
    public ICarRepository Cars { get; } = carRepository;

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}
