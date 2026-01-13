namespace Ride.Api.Models.Response;

public class CarModelResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int CarMakeId { get; set; }
    public string CarMakeName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}