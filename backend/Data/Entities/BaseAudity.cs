using System.ComponentModel.DataAnnotations;

namespace Ride.Api.Data.Entities;

public abstract class BaseAudity<T>
{
    [Key]
    public T Id { get; set; } = default!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
