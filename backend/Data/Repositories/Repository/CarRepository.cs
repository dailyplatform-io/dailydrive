using Microsoft.EntityFrameworkCore;
using Ride.Api.Data.Entities;
using Ride.Api.Data.Repositories.Interface;
using Ride.Api.Utilities.Pagination;

namespace Ride.Api.Data.Repositories.Repository;

public class CarRepository(ApplicationDbContext dbContext) : Repository<Car>(dbContext), ICarRepository
{
    public async Task<PaginatedList<Car>> GetAsync(CarQueryOptions queryOptions, CancellationToken cancellationToken = default)
    {
        var query = DbSet
            .Include(c => c.Owner)
            .Include(c => c.Images)
            .AsNoTracking()
            .AsQueryable();

        var nowUtc = DateTime.UtcNow;
        query = query.Where(c =>
            c.Owner != null &&
            (
                // Active with valid subscription
                (c.Owner.IsActive && (!c.Owner.SubscriptionUntil.HasValue || c.Owner.SubscriptionUntil >= nowUtc))
                // Or currently in trial (unpaid and trial end in the future)
                || (!c.Owner.PaymentCompleted && c.Owner.TrialEndsAt.HasValue && c.Owner.TrialEndsAt >= nowUtc)
            ));

        if (queryOptions.OwnerId is Guid ownerId)
        {
            query = query.Where(c => c.OwnerId == ownerId);
        }

        if (queryOptions.ListingStatus is ListingStatus status)
        {
            query = query.Where(c => c.ListingStatus == status);
        }
        else
        {
            query = query.Where(c => c.ListingStatus != ListingStatus.Deleted);
        }

        if (queryOptions.IsForRent is bool rent)
        {
            query = query.Where(c => c.IsForRent == rent);
        }

        if (queryOptions.IsForSale is bool sale)
        {
            query = query.Where(c => c.IsForSale == sale);
        }

        if (!string.IsNullOrWhiteSpace(queryOptions.City))
        {
            query = query.Where(c => c.Location.City.ToLower().Contains(queryOptions.City.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(queryOptions.SearchKey))
        {
            var term = queryOptions.SearchKey.ToLower();
            query = query.Where(c =>
                c.Brand.ToLower().Contains(term) ||
                c.Model.ToLower().Contains(term) ||
                (c.Subtitle != null && c.Subtitle.ToLower().Contains(term)));
        }

        query = ApplySorting(query, queryOptions);

        return await ToPaginatedListAsync(query, queryOptions.PageNumber, queryOptions.PageSize, cancellationToken);
    }

    public async Task<Car?> GetWithImagesAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Include(c => c.Owner)
            .Include(c => c.Images)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    private static IQueryable<Car> ApplySorting(IQueryable<Car> query, CarQueryOptions options)
    {
        var descending = options.IsDescending;
        return (options.ColumnName ?? string.Empty).ToLower() switch
        {
            "brand" => descending ? query.OrderByDescending(c => c.Brand) : query.OrderBy(c => c.Brand),
            "model" => descending ? query.OrderByDescending(c => c.Model) : query.OrderBy(c => c.Model),
            "year" => descending ? query.OrderByDescending(c => c.Year) : query.OrderBy(c => c.Year),
            "priceperday" => descending
                ? query.OrderByDescending(c => c.RentPricePerDay)
                : query.OrderBy(c => c.RentPricePerDay),
            "priceperhour" => descending
                ? query.OrderByDescending(c => c.RentPricePerHour)
                : query.OrderBy(c => c.RentPricePerHour),
            "saleprice" => descending ? query.OrderByDescending(c => c.SalePrice) : query.OrderBy(c => c.SalePrice),
            "createdat" => descending ? query.OrderByDescending(c => c.CreatedAt) : query.OrderBy(c => c.CreatedAt),
            "updatedat" => descending ? query.OrderByDescending(c => c.UpdatedAt) : query.OrderBy(c => c.UpdatedAt),
            _ => descending ? query.OrderByDescending(c => c.CreatedAt) : query.OrderBy(c => c.CreatedAt)
        };
    }
}
