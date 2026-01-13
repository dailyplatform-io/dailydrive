using Ride.Api.Data.Entities;
using Ride.Api.Models.Request;
using Ride.Api.Models.Response;

namespace Ride.Api.Services.Interface;

public interface IReservationService
{
    Task<ReservationResponse?> GetByIdAsync(Guid id);
    Task<List<ReservationResponse>> GetByCarIdAsync(Guid carId);
    Task<List<ReservationResponse>> GetByOwnerIdAsync(Guid ownerId);
    Task<List<ReservationResponse>> GetByRenterIdAsync(Guid renterId);
    Task<List<CalendarReservationResponse>> GetOwnerCalendarReservationsAsync(Guid ownerId, DateTime startDate, DateTime endDate);
    Task<AvailabilityResponse> CheckAvailabilityAsync(Guid carId, DateTime startDate, DateTime endDate);
    Task<ReservationResponse> CreateAsync(Guid renterId, CreateReservationRequest request);
    Task<ReservationResponse> UpdateAsync(Guid id, UpdateReservationRequest request);
    Task<ReservationResponse> ConfirmAsync(Guid id);
    Task<ReservationResponse> CancelAsync(Guid id, string? reason);
    Task DeleteAsync(Guid id);
}
