using Ride.Api.Data.Entities;

namespace Ride.Api.Data.Repositories.Interface;

public interface IReservationRepository
{
    Task<Reservation?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<Reservation>> GetByCarIdAsync(Guid carId, CancellationToken cancellationToken = default);
    Task<List<Reservation>> GetByOwnerIdAsync(Guid ownerId, CancellationToken cancellationToken = default);
    Task<List<Reservation>> GetByRenterIdAsync(Guid renterId, CancellationToken cancellationToken = default);
    Task<List<Reservation>> GetByDateRangeAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);
    Task<List<Reservation>> GetOwnerReservationsCalendarAsync(Guid ownerId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);
    Task<bool> IsCarAvailableAsync(Guid carId, DateTime startDate, DateTime endDate, Guid? excludeReservationId = null, CancellationToken cancellationToken = default);
    Task<Reservation> CreateAsync(Reservation reservation, CancellationToken cancellationToken = default);
    Task UpdateAsync(Reservation reservation, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
