using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ride.Api.Data;
using Ride.Api.Models.Response;

namespace Ride.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CarModelsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public CarModelsController(IApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all car models
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CarModelResponse>>> GetCarModels()
    {
        var models = await _context.CarModels
            .Include(m => m.CarMake)
            .OrderBy(m => m.CarMake.Name)
            .ThenBy(m => m.Name)
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

    /// <summary>
    /// Get a specific car model by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<CarModelResponse>> GetCarModel(int id)
    {
        var model = await _context.CarModels
            .Include(m => m.CarMake)
            .Where(m => m.Id == id)
            .Select(m => new CarModelResponse
            {
                Id = m.Id,
                Name = m.Name,
                CarMakeId = m.CarMakeId,
                CarMakeName = m.CarMake.Name,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (model == null)
        {
            return NotFound();
        }

        return Ok(model);
    }
}