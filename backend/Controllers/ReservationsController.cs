using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ride.Api.Models.Request;
using Ride.Api.Services.Interface;
using Ride.Api.Utilities.Identity;
using Ride.Api.Utilities.Extensions;
using System.Security.Claims;

namespace Ride.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservationsController : ControllerBase
{
    private readonly IReservationService _reservationService;
    private readonly ILogger<ReservationsController> _logger;

    public ReservationsController(
        IReservationService reservationService,
        ILogger<ReservationsController> logger)
    {
        _reservationService = reservationService;
        _logger = logger;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var reservation = await _reservationService.GetByIdAsync(id);
        if (reservation == null)
        {
            return NotFound();
        }
        return Ok(reservation);
    }

    [HttpGet("car/{carId}")]
    public async Task<IActionResult> GetByCarId(Guid carId)
    {
        var reservations = await _reservationService.GetByCarIdAsync(carId);
        return Ok(reservations);
    }

    [HttpGet("owner/{ownerId}")]
    public async Task<IActionResult> GetByOwnerId(Guid ownerId)
    {
        var reservations = await _reservationService.GetByOwnerIdAsync(ownerId);
        return Ok(reservations);
    }

    [HttpGet("renter/{renterId}")]
    [Authorize]
    public async Task<IActionResult> GetByRenterId(Guid renterId)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId != renterId)
        {
            return Forbid();
        }

        var reservations = await _reservationService.GetByRenterIdAsync(renterId);
        return Ok(reservations);
    }

    [HttpGet("my-reservations")]
    [Authorize]
    public async Task<IActionResult> GetMyReservations()
    {
        var userId = User.GetUserId();
        var reservations = await _reservationService.GetByRenterIdAsync(userId);
        return Ok(reservations);
    }

    [HttpGet("owner/{ownerId}/calendar")]
    public async Task<IActionResult> GetOwnerCalendar(
        Guid ownerId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var start = startDate ?? DateTime.UtcNow.Date;
        var end = endDate ?? start.AddMonths(3);

        var reservations = await _reservationService.GetOwnerCalendarReservationsAsync(ownerId, start, end);
        return Ok(reservations);
    }

    [HttpPost("check-availability")]
    public async Task<IActionResult> CheckAvailability([FromBody] CheckAvailabilityRequest request)
    {
        var result = await _reservationService.CheckAvailabilityAsync(
            request.CarId, 
            request.StartDate, 
            request.EndDate);
        return Ok(result);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreateReservationRequest request)
    {
        var userId = User.GetUserId();
        var reservation = await _reservationService.CreateAsync(userId, request);
        return CreatedAtAction(nameof(GetById), new { id = reservation.Id }, reservation);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateReservationRequest request)
    {
        var reservation = await _reservationService.UpdateAsync(id, request);
        return Ok(reservation);
    }

    [HttpPost("{id}/confirm")]
    [Authorize]
    public async Task<IActionResult> Confirm(Guid id)
    {
        var reservation = await _reservationService.ConfirmAsync(id);
        return Ok(reservation);
    }

    [HttpPost("{id}/cancel")]
    [Authorize]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] string? reason)
    {
        var reservation = await _reservationService.CancelAsync(id, reason);
        return Ok(reservation);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _reservationService.DeleteAsync(id);
        return NoContent();
    }
}
