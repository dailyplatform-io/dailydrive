using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ride.Api.Data;
using Ride.Api.Models.Response;

namespace Ride.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CarMakesController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public CarMakesController(IApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all car makes
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CarMakeResponse>>> GetCarMakes()
    {
        var makes = await _context.CarMakes
            .OrderBy(m => m.Name)
            .Select(m => new CarMakeResponse
            {
                Id = m.Id,
                Name = m.Name,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt
            })
            .ToListAsync();

        return Ok(makes);
    }

    /// <summary>
    /// Get a specific car make by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<CarMakeResponse>> GetCarMake(int id)
    {
        var make = await _context.CarMakes
            .Where(m => m.Id == id)
            .Select(m => new CarMakeResponse
            {
                Id = m.Id,
                Name = m.Name,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (make == null)
        {
            return NotFound();
        }

        return Ok(make);
    }

    /// <summary>
    /// Get all models for a specific car make
    /// </summary>
    [HttpGet("{id}/models")]
    public async Task<ActionResult<IEnumerable<CarModelResponse>>> GetCarModelsByMake(int id)
    {
        var makeExists = await _context.CarMakes.AnyAsync(m => m.Id == id);
        if (!makeExists)
        {
            return NotFound($"Car make with ID {id} not found");
        }

        var models = await _context.CarModels
            .Where(m => m.CarMakeId == id)
            .Include(m => m.CarMake)
            .OrderBy(m => m.Name)
            .Select(m => new CarModelResponse
            {
                Id = m.Id,
                Name = m.Name,
                CarMakeId = m.CarMakeId,
                CarMakeName = m.CarMake.Name,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt
            })
            .ToListAsync();

        return Ok(models);
    }
}