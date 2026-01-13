namespace Ride.Api.Utilities.Settings;

public class DatabaseSettings
{
    public const string SectionName = "Database";
    public string ConnectionString { get; set; } = "Data Source=ride.db";
}
