using Microsoft.EntityFrameworkCore;
using Ride.Api.Data.Entities;
using Ride.Api.Data.Repositories.Interface;

namespace Ride.Api.Data.Repositories.Repository;

public class ReservationRepository : IReservationRepository
{
    private readonly IApplicationDbContext _context;

    public ReservationRepository(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Reservation?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Reservations
            .Include(r => r.Car)
                .ThenInclude(c => c!.Images)
            .Include(r => r.Car)
                .ThenInclude(c => c!.Owner)
            .Include(r => r.Renter)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<List<Reservation>> GetByCarIdAsync(Guid carId, CancellationToken cancellationToken = default)
    {
        return await _context.Reservations
            .Include(r => r.Renter)
            .Where(r => r.CarId == carId)
            .OrderBy(r => r.StartDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Reservation>> GetByOwnerIdAsync(Guid ownerId, CancellationToken cancellationToken = default)
    {
        return await _context.Reservations
            .Include(r => r.Car)
                .ThenInclude(c => c!.Images)
            .Include(r => r.Renter)
            .Where(r => r.Car!.OwnerId == ownerId)
            .OrderByDescending(r => r.StartDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Reservation>> GetByRenterIdAsync(Guid renterId, CancellationToken cancellationToken = default)
    {
        return await _context.Reservations
            .Include(r => r.Car)
                .ThenInclude(c => c!.Images)
            .Include(r => r.Car)
                .ThenInclude(c => c!.Owner)
            .Where(r => r.RenterId == renterId)
            .OrderByDescending(r => r.StartDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Reservation>> GetByDateRangeAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
    {
        return await _context.Reservations
            .Include(r => r.Car)
            .Include(r => r.Renter)
            .Where(r => r.StartDate <= endDate && r.EndDate >= startDate)
            .OrderBy(r => r.StartDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Reservation>> GetOwnerReservationsCalendarAsync(Guid ownerId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
    {
        return await _context.Reservations
            .Include(r => r.Car)
                .ThenInclude(c => c!.Images)
            .Include(r => r.Renter)
            .Where(r => r.Car!.OwnerId == ownerId && r.StartDate <= endDate && r.EndDate >= startDate)
            .OrderBy(r => r.StartDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> IsCarAvailableAsync(Guid carId, DateTime startDate, DateTime endDate, Guid? excludeReservationId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Reservations
            .Where(r => r.CarId == carId 
                && r.Status != ReservationStatus.Cancelled 
                && r.StartDate < endDate 
                && r.EndDate > startDate);

        if (excludeReservationId.HasValue)
        {
            query = query.Where(r => r.Id != excludeReservationId.Value);
        }

        var hasConflict = await query.AnyAsync(cancellationToken);
        return !hasConflict;
    }

    public async Task<Reservation> CreateAsync(Reservation reservation, CancellationToken cancellationToken = default)
    {
        reservation.Id = Guid.NewGuid();
        reservation.CreatedAt = DateTime.UtcNow;
        reservation.UpdatedAt = DateTime.UtcNow;
        
        _context.Reservations.Add(reservation);
        await _context.SaveChangesAsync(cancellationToken);
        return reservation;
    }

    public async Task UpdateAsync(Reservation reservation, CancellationToken cancellationToken = default)
    {
        reservation.UpdatedAt = DateTime.UtcNow;
        _context.Reservations.Update(reservation);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var reservation = await _context.Reservations.FindAsync(new object[] { id }, cancellationToken);
        if (reservation != null)
        {
            _context.Reservations.Remove(reservation);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
