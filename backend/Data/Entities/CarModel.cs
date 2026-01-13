using System.ComponentModel.DataAnnotations;

namespace Ride.Api.Data.Entities;

public class CarModel : BaseAudity<int>
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public int CarMakeId { get; set; }
    public CarMake CarMake { get; set; } = null!;

    public ICollection<Car> Cars { get; set; } = new List<Car>();
}