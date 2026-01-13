using Microsoft.EntityFrameworkCore;
using Ride.Api.Data.Entities;

namespace Ride.Api.Data;

public interface IApplicationDbContext
{
    DbSet<Car> Cars { get; }
    DbSet<CarImage> CarImages { get; }
    DbSet<CarMake> CarMakes { get; }
    DbSet<CarModel> CarModels { get; }
    DbSet<Reservation> Reservations { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
