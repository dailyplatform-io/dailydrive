using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Ride.Api.Data.Repositories.Interface;
using Ride.Api.Utilities.Pagination;

namespace Ride.Api.Data.Repositories.Repository;

public class Repository<TEntity>(ApplicationDbContext dbContext) : IRepository<TEntity> where TEntity : class
{
    protected readonly ApplicationDbContext DbContext = dbContext;
    protected readonly DbSet<TEntity> DbSet = dbContext.Set<TEntity>();

    public IQueryable<TEntity> Query() => DbSet.AsQueryable();

    public async Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await DbSet.FindAsync([id], cancellationToken: cancellationToken);
    }

    public Task<bool> ExistsAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return DbSet.AnyAsync(predicate, cancellationToken);
    }

    public async Task AddAsync(TEntity entity, CancellationToken cancellationToken = default)
    {
        await DbSet.AddAsync(entity, cancellationToken);
    }

    public Task AddRangeAsync(IEnumerable<TEntity> entities, CancellationToken cancellationToken = default)
    {
        return DbSet.AddRangeAsync(entities, cancellationToken);
    }

    public void Update(TEntity entity)
    {
        DbSet.Update(entity);
    }

    public void Remove(TEntity entity)
    {
        DbSet.Remove(entity);
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return DbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<PaginatedList<TEntity>> ToPaginatedListAsync(
        IQueryable<TEntity> source,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        return await PaginatedList<TEntity>.CreateAsync(source, pageNumber, pageSize, cancellationToken);
    }
}
