using Microsoft.EntityFrameworkCore;
using Ride.Api.Data;
using Ride.Api.Data.Entities;
using Ride.Api.Data.Repositories.Interface;
using Ride.Api.Models.Request;
using Ride.Api.Models.Response;
using Ride.Api.Services.Interface;
using Ride.Api.Utilities.Exceptions;
using Ride.Api.Utilities.Extensions;

namespace Ride.Api.Services;

public class ReservationService : IReservationService
{
    private readonly IReservationRepository _reservationRepository;
    private readonly IApplicationDbContext _context;

    public ReservationService(IReservationRepository reservationRepository, IApplicationDbContext context)
    {
        _reservationRepository = reservationRepository;
        _context = context;
    }

    public async Task<ReservationResponse?> GetByIdAsync(Guid id)
    {
        var reservation = await _reservationRepository.GetByIdAsync(id);
        return reservation == null ? null : MapToResponse(reservation);
    }

    public async Task<List<ReservationResponse>> GetByCarIdAsync(Guid carId)
    {
        var reservations = await _reservationRepository.GetByCarIdAsync(carId);
        return reservations.Select(MapToResponse).ToList();
    }

    public async Task<List<ReservationResponse>> GetByOwnerIdAsync(Guid ownerId)
    {
        var reservations = await _reservationRepository.GetByOwnerIdAsync(ownerId);
        return reservations.Select(MapToResponse).ToList();
    }

    public async Task<List<ReservationResponse>> GetByRenterIdAsync(Guid renterId)
    {
        var reservations = await _reservationRepository.GetByRenterIdAsync(renterId);
        return reservations.Select(MapToResponse).ToList();
    }

    public async Task<List<CalendarReservationResponse>> GetOwnerCalendarReservationsAsync(Guid ownerId, DateTime startDate, DateTime endDate)
    {
        var reservations = await _reservationRepository.GetOwnerReservationsCalendarAsync(ownerId, startDate, endDate);
        return reservations.Select(r => new CalendarReservationResponse
        {
            Id = r.Id,
            CarId = r.CarId,
            CarBrand = r.Car?.Brand ?? string.Empty,
            CarModel = r.Car?.Model ?? string.Empty,
            CarColor = r.Car?.Color ?? string.Empty,
            CarImageUrl = r.Car?.Images?.FirstOrDefault()?.Url() ?? r.Car?.ImageUrl,
            RenterName = r.Renter?.DisplayName ?? "Unknown",
            StartDate = r.StartDate,
            EndDate = r.EndDate,
            TotalPrice = r.TotalPrice,
            Status = r.Status.ToString()
        }).ToList();
    }

    public async Task<AvailabilityResponse> CheckAvailabilityAsync(Guid carId, DateTime startDate, DateTime endDate)
    {
        var car = await _context.Cars.FindAsync(carId);
        if (car == null || !car.IsForRent)
        {
            return new AvailabilityResponse { IsAvailable = false };
        }

        var isAvailable = await _reservationRepository.IsCarAvailableAsync(carId, startDate, endDate);
        
        var unavailableDates = new List<DateRange>();
        if (!isAvailable)
        {
            var conflictingReservations = await _context.Reservations
                .Where(r => r.CarId == carId 
                    && r.Status != ReservationStatus.Cancelled 
                    && r.StartDate < endDate 
                    && r.EndDate > startDate)
                .Select(r => new DateRange { StartDate = r.StartDate, EndDate = r.EndDate })
                .ToListAsync();
            
            unavailableDates = conflictingReservations;
        }

        return new AvailabilityResponse 
        { 
            IsAvailable = isAvailable,
            UnavailableDates = unavailableDates
        };
    }

    public async Task<ReservationResponse> CreateAsync(Guid renterId, CreateReservationRequest request)
    {
        // Validate car exists and is for rent
        var car = await _context.Cars
            .Include(c => c.Images)
            .Include(c => c.Owner)
            .FirstOrDefaultAsync(c => c.Id == request.CarId);
        
        if (car == null)
        {
            throw new KeyNotFoundException("Car not found");
        }

        if (!car.IsForRent)
        {
            throw new ArgumentException("Car is not available for rent");
        }

        // Validate dates
        if (request.StartDate >= request.EndDate)
        {
            throw new ArgumentException("End date must be after start date");
        }

        if (request.StartDate < DateTime.UtcNow)
        {
            throw new ArgumentException("Start date cannot be in the past");
        }

        // Check availability
        var isAvailable = await _reservationRepository.IsCarAvailableAsync(request.CarId, request.StartDate, request.EndDate);
        if (!isAvailable)
        {
            throw new ArgumentException("Car is not available for the selected dates");
        }

        // Calculate total price
        var duration = request.EndDate - request.StartDate;
        var totalDays = (decimal)duration.TotalDays;
        var totalPrice = (car.RentPricePerDay ?? 0) * totalDays;

        // Create reservation
        var reservation = new Reservation
        {
            CarId = request.CarId,
            RenterId = renterId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            TotalPrice = totalPrice,
            Status = ReservationStatus.Pending,
            Notes = request.Notes
        };

        var created = await _reservationRepository.CreateAsync(reservation);
        
        // Load navigation properties
        var fullReservation = await _reservationRepository.GetByIdAsync(created.Id);
        return MapToResponse(fullReservation!);
    }

    public async Task<ReservationResponse> UpdateAsync(Guid id, UpdateReservationRequest request)
    {
        var reservation = await _reservationRepository.GetByIdAsync(id);
        if (reservation == null)
        {
            throw new KeyNotFoundException("Reservation not found");
        }

        // Update dates if provided
        if (request.StartDate.HasValue || request.EndDate.HasValue)
        {
            var newStartDate = request.StartDate ?? reservation.StartDate;
            var newEndDate = request.EndDate ?? reservation.EndDate;

            if (newStartDate >= newEndDate)
            {
                throw new ArgumentException("End date must be after start date");
            }

            // Check availability for new dates (excluding current reservation)
            var isAvailable = await _reservationRepository.IsCarAvailableAsync(
                reservation.CarId, newStartDate, newEndDate, id);
            
            if (!isAvailable)
            {
                throw new ArgumentException("Car is not available for the selected dates");
            }

            reservation.StartDate = newStartDate;
            reservation.EndDate = newEndDate;

            // Recalculate price
            var duration = newEndDate - newStartDate;
            var totalDays = (decimal)duration.TotalDays;
            var car = await _context.Cars.FindAsync(reservation.CarId);
            reservation.TotalPrice = (car?.RentPricePerDay ?? 0) * totalDays;
        }

        // Update status
        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<ReservationStatus>(request.Status, out var status))
        {
            reservation.Status = status;
        }

        // Update notes
        if (request.Notes != null)
        {
            reservation.Notes = request.Notes;
        }

        // Update cancellation reason
        if (request.CancellationReason != null)
        {
            reservation.CancellationReason = request.CancellationReason;
        }

        await _reservationRepository.UpdateAsync(reservation);
        
        var updated = await _reservationRepository.GetByIdAsync(id);
        return MapToResponse(updated!);
    }

    public async Task<ReservationResponse> ConfirmAsync(Guid id)
    {
        var reservation = await _reservationRepository.GetByIdAsync(id);
        if (reservation == null)
        {
            throw new KeyNotFoundException("Reservation not found");
        }

        reservation.Status = ReservationStatus.Confirmed;
        reservation.ConfirmedAt = DateTime.UtcNow;

        await _reservationRepository.UpdateAsync(reservation);
        
        var updated = await _reservationRepository.GetByIdAsync(id);
        return MapToResponse(updated!);
    }

    public async Task<ReservationResponse> CancelAsync(Guid id, string? reason)
    {
        var reservation = await _reservationRepository.GetByIdAsync(id);
        if (reservation == null)
        {
            throw new KeyNotFoundException("Reservation not found");
        }

        reservation.Status = ReservationStatus.Cancelled;
        reservation.CancelledAt = DateTime.UtcNow;
        reservation.CancellationReason = reason;

        await _reservationRepository.UpdateAsync(reservation);
        
        var updated = await _reservationRepository.GetByIdAsync(id);
        return MapToResponse(updated!);
    }

    public async Task DeleteAsync(Guid id)
    {
        await _reservationRepository.DeleteAsync(id);
    }

    private static ReservationResponse MapToResponse(Reservation reservation)
    {
        return new ReservationResponse
        {
            Id = reservation.Id,
            CarId = reservation.CarId,
            CarBrand = reservation.Car?.Brand ?? string.Empty,
            CarModel = reservation.Car?.Model ?? string.Empty,
            CarImageUrl = reservation.Car?.Images?.FirstOrDefault()?.Url() ?? reservation.Car?.ImageUrl,
            RenterId = reservation.RenterId,
            RenterName = reservation.Renter?.DisplayName ?? "Unknown",
            RenterEmail = reservation.Renter?.Email,
            StartDate = reservation.StartDate,
            EndDate = reservation.EndDate,
            TotalPrice = reservation.TotalPrice,
            Status = reservation.Status.ToString(),
            Notes = reservation.Notes,
            CreatedAt = reservation.CreatedAt,
            ConfirmedAt = reservation.ConfirmedAt,
            CancelledAt = reservation.CancelledAt,
            CancellationReason = reservation.CancellationReason
        };
    }
}
