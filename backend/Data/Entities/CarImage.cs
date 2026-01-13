using System.ComponentModel.DataAnnotations;

namespace Ride.Api.Data.Entities;

public class CarImage : BaseAudity<Guid>
{
    [Required]
    public Guid CarId { get; set; }
    public Car? Car { get; set; }

    [Required, MaxLength(512)]
    public string BlobName { get; set; } = string.Empty;

    public bool IsCover { get; set; }
    public int SortOrder { get; set; }
}
