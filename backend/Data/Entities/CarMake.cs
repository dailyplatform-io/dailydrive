using System.ComponentModel.DataAnnotations;

namespace Ride.Api.Data.Entities;

public class CarMake : BaseAudity<int>
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public ICollection<CarModel> Models { get; set; } = new List<CarModel>();
    
    public ICollection<Car> Cars { get; set; } = new List<Car>();
}