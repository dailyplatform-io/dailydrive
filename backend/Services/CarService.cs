using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Ride.Api.Data;
using Ride.Api.Data.Entities;
using Ride.Api.Data.Repositories.Interface;
using Ride.Api.Models.Dto;
using Ride.Api.Models.Request;
using Ride.Api.Services.Interface;
using Ride.Api.Utilities.Mappings;
using Ride.Api.Utilities.Pagination;
using Ride.Api.Utilities.Results;
using Ride.Api.Utilities.Settings;

namespace Ride.Api.Services;

public class CarService(
    IUnitOfWork unitOfWork,
    ApplicationDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    IOptions<StorageSettings> storageOptions,
    IOptions<PaginationSettings> paginationOptions,
    ILogger<CarService> logger) : ICarService
{
    private readonly StorageSettings _storageSettings = storageOptions.Value;
    private readonly PaginationSettings _paginationSettings = paginationOptions.Value;

    public async Task<Result<PagedResult<CarDto>>> GetAsync(CarFilterRequest request, CancellationToken cancellationToken = default)
    {
        var pageNumber = Math.Max(request.PageNumber, 1);
        var pageSize = Math.Clamp(
            request.PageSize <= 0 ? _paginationSettings.DefaultPageSize : request.PageSize,
            1,
            _paginationSettings.MaxPageSize);
        var queryOptions = new CarQueryOptions
        {
            OwnerId = request.OwnerId,
            ListingStatus = request.ListingStatus,
            IsForRent = request.IsForRent,
            IsForSale = request.IsForSale,
            SearchKey = request.SearchKey,
            City = request.City,
            PageNumber = pageNumber,
            PageSize = pageSize,
            IsDescending = request.IsDescending,
            ColumnName = request.ColumnName
        };

        var cars = await unitOfWork.Cars.GetAsync(queryOptions, cancellationToken);
        var mapped = cars.Map(car => car.ToDto(_storageSettings.ImageBaseUrl));
        var pagedResult = PagedResult<CarDto>.FromPaginatedList(mapped);

        return Result<PagedResult<CarDto>>.Success(pagedResult);
    }

    public async Task<Result<CarDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var car = await unitOfWork.Cars.GetWithImagesAsync(id, cancellationToken);
        if (car is null)
        {
            return Result<CarDto>.Failure($"Car with id {id} was not found.");
        }

        return Result<CarDto>.Success(car.ToDto(_storageSettings.ImageBaseUrl));
    }

    public async Task<Result<CarDto>> CreateAsync(CreateCarRequest request, CancellationToken cancellationToken = default)
    {
        var owner = await userManager.FindByIdAsync(request.OwnerId.ToString());
        if (owner is null)
        {
            return Result<CarDto>.Failure($"Owner with id {request.OwnerId} was not found.");
        }

        var activeCount = await dbContext.Cars
            .Where(c => c.OwnerId == owner.Id && c.ListingStatus != ListingStatus.Deleted && c.ListingStatus != ListingStatus.Sold)
            .CountAsync(cancellationToken);

        var maxAllowed = GetMaxCarsForTier(owner.SubscriptionTier ?? "free");
        if (activeCount >= maxAllowed)
        {
            logger.LogWarning("Car limit reached for owner {OwnerId}: {Count}/{Max}", owner.Id, activeCount, maxAllowed);
            return Result<CarDto>.Failure($"Car limit reached for your subscription ({maxAllowed} cars). Upgrade to add more.");
        }

        // Find or create CarMake
        var carMake = await dbContext.CarMakes
            .FirstOrDefaultAsync(cm => cm.Name == request.Brand, cancellationToken);
        
        if (carMake is null)
        {
            carMake = new CarMake
            {
                Name = request.Brand,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            dbContext.CarMakes.Add(carMake);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        // Find or create CarModel
        var carModel = await dbContext.CarModels
            .FirstOrDefaultAsync(cm => cm.Name == request.Model && cm.CarMakeId == carMake.Id, cancellationToken);
        
        if (carModel is null)
        {
            carModel = new CarModel
            {
                Name = request.Model,
                CarMakeId = carMake.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            dbContext.CarModels.Add(carModel);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var car = request.ToEntity();
        car.Owner = owner;
        car.CarMakeId = carMake.Id;
        car.CarModelId = carModel.Id;

        await unitOfWork.Cars.AddAsync(car, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Created car {CarId} for owner {OwnerId}", car.Id, car.OwnerId);

        return Result<CarDto>.Success(car.ToDto(_storageSettings.ImageBaseUrl));
    }

    public async Task<Result<CarDto>> UpdateAsync(Guid id, UpdateCarRequest request, CancellationToken cancellationToken = default)
    {
        var car = await unitOfWork.Cars.GetWithImagesAsync(id, cancellationToken);
        if (car is null)
        {
            return Result<CarDto>.Failure($"Car with id {id} was not found.");
        }

        car.ApplyUpdate(request);
        unitOfWork.Cars.Update(car);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Updated car {CarId}", car.Id);

        return Result<CarDto>.Success(car.ToDto(_storageSettings.ImageBaseUrl));
    }

    public async Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var car = await unitOfWork.Cars.GetWithImagesAsync(id, cancellationToken);
        if (car is null)
        {
            return Result.Failure($"Car with id {id} was not found.");
        }

        car.ListingStatus = ListingStatus.Deleted;
        car.UpdatedAt = DateTime.UtcNow;
        unitOfWork.Cars.Update(car);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Soft-deleted car {CarId}", car.Id);

        return Result.Success();
    }

    private static int GetMaxCarsForTier(string tier)
    {
        return tier switch
        {
            "basic5" => 5,
            "plus10" => 10,
            "standard20" => 20,
            "pro20plus" => int.MaxValue,
            _ => 2 // free and unknown tiers default to 2
        };
    }
}
