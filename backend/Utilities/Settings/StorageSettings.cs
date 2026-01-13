namespace Ride.Api.Utilities.Settings;

public class StorageSettings
{
    public const string SectionName = "Storage";
    public string ImageBaseUrl { get; set; } = "https://cdn.example.com/images";
    public string ConnectionString { get; set; } = string.Empty;
    public string ContainerName { get; set; } = "car-images";
}
