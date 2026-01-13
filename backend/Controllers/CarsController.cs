using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ride.Api.Middleware.Common;
using Ride.Api.Models.Dto;
using Ride.Api.Models.Request;
using Ride.Api.Models.Response;
using Ride.Api.Services.Interface;

namespace Ride.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CarsController(ICarService carService, ILogger<CarsController> logger) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<PagedResponse<CarDto>>> GetCars(
        [FromQuery] CarFilterRequest request,
        CancellationToken cancellationToken)
    {
        var result = await carService.GetAsync(request, cancellationToken);
        if (!result.Succeeded || result.Data is null)
        {
            return HandleFailure(result.Error ?? "Unable to fetch cars.");
        }

        return Ok(PagedResponse<CarDto>.FromPagedResult(result.Data));
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<CarResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await carService.GetByIdAsync(id, cancellationToken);
        if (!result.Succeeded || result.Data is null)
        {
            return HandleFailure(result.Error ?? $"Car with id {id} was not found.");
        }

        return Ok(new CarResponse(result.Data));
    }

    [HttpPost]
    [AllowAnonymous] // TODO: Re-enable authorization once proper JWT tokens are implemented
    public async Task<ActionResult<CarResponse>> Create(
        [FromBody] CreateCarRequest request,
        CancellationToken cancellationToken)
    {
        var result = await carService.CreateAsync(request, cancellationToken);
        if (!result.Succeeded || result.Data is null)
        {
            return HandleFailure(result.Error ?? "Unable to create car.");
        }

        logger.LogInformation("Created car {CarId}", result.Data.Id);

        return CreatedAtAction(nameof(GetById), new { id = result.Data.Id }, new CarResponse(result.Data));
    }

    [HttpPut("{id:guid}")]
    [AllowAnonymous] // TODO: Re-enable authorization once proper JWT tokens are implemented
    public async Task<ActionResult<CarResponse>> Update(
        Guid id,
        [FromBody] UpdateCarRequest request,
        CancellationToken cancellationToken)
    {
        var result = await carService.UpdateAsync(id, request, cancellationToken);
        if (!result.Succeeded || result.Data is null)
        {
            return HandleFailure(result.Error ?? $"Car with id {id} was not found.");
        }

        return Ok(new CarResponse(result.Data));
    }

    [HttpDelete("{id:guid}")]
    [AllowAnonymous] // TODO: Re-enable authorization once proper JWT tokens are implemented
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await carService.DeleteAsync(id, cancellationToken);
        if (!result.Succeeded)
        {
            return HandleFailure(result.Error ?? $"Car with id {id} was not found.");
        }

        return NoContent();
    }

    private ActionResult HandleFailure(string error)
    {
        var response = new ErrorResponse { Message = error };
        return error.Contains("not found", StringComparison.OrdinalIgnoreCase)
            ? NotFound(response)
            : BadRequest(response);
    }
}
