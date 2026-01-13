using System.Linq.Expressions;
using Ride.Api.Utilities.Pagination;

namespace Ride.Api.Data.Repositories.Interface;

public interface IRepository<TEntity> where TEntity : class
{
    IQueryable<TEntity> Query();
    Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default);
    Task AddAsync(TEntity entity, CancellationToken cancellationToken = default);
    Task AddRangeAsync(IEnumerable<TEntity> entities, CancellationToken cancellationToken = default);
    void Update(TEntity entity);
    void Remove(TEntity entity);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<PaginatedList<TEntity>> ToPaginatedListAsync(IQueryable<TEntity> source, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
}
