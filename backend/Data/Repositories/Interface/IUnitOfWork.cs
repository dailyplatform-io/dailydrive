namespace Ride.Api.Data.Repositories.Interface;

public interface IUnitOfWork
{
    ICarRepository Cars { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
