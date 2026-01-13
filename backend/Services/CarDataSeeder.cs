using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Ride.Api.Data;
using Ride.Api.Data.Entities;

namespace Ride.Api.Services;

public static class CarDataSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var loggerFactory = scope.ServiceProvider.GetRequiredService<ILoggerFactory>();
        var logger = loggerFactory.CreateLogger("CarDataSeeder");

        try
        {
            // Ensure database is created
            await context.Database.EnsureCreatedAsync();
            logger.LogInformation("Database ensured to be created");

            // Check if data already exists
            var carMakesCount = await context.CarMakes.CountAsync();
            logger.LogInformation($"Found {carMakesCount} car makes in database");

            if (carMakesCount > 0)
            {
                logger.LogInformation("Car makes already exist, skipping seeding");
                return; // Data already seeded
            }

            logger.LogInformation("Starting car data seeding...");

            // Read and seed car makes
            logger.LogInformation("Seeding car makes...");
            await SeedCarMakesAsync(context, logger);

            // Save car makes first
            var savedMakes = await context.SaveChangesAsync();
            logger.LogInformation($"Saved {savedMakes} car make records");

            // Read and seed car models
            logger.LogInformation("Seeding car models...");
            await SeedCarModelsAsync(context, logger);

            var savedModels = await context.SaveChangesAsync();
            logger.LogInformation($"Saved {savedModels} car model records");
            
            logger.LogInformation("Car data seeding completed successfully");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred during car data seeding");
            throw;
        }
    }

    private static async Task SeedCarMakesAsync(ApplicationDbContext context, ILogger logger)
    {
        var carMakesPath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "car-makes.json");
        logger.LogInformation($"Looking for car makes JSON at: {carMakesPath}");
        
        if (!File.Exists(carMakesPath))
        {
            logger.LogError($"Car makes JSON file not found at: {carMakesPath}");
            throw new FileNotFoundException($"Car makes JSON file not found at: {carMakesPath}");
        }

        var json = await File.ReadAllTextAsync(carMakesPath);
        logger.LogInformation($"Read {json.Length} characters from car makes JSON");
        
        var carMakesData = JsonSerializer.Deserialize<CarMakeJson[]>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (carMakesData == null) 
        {
            logger.LogWarning("Car makes data deserialized to null");
            return;
        }
        
        logger.LogInformation($"Parsed {carMakesData.Length} car makes from JSON");

        var carMakes = carMakesData.Select(make => new CarMake
        {
            Name = make.MakeName,
            CreatedAt = make.MakeCreated,
            UpdatedAt = make.MakeModified
        }).ToList();

        logger.LogInformation($"Created {carMakes.Count} CarMake entities");
        await context.CarMakes.AddRangeAsync(carMakes);
    }

    private static async Task SeedCarModelsAsync(ApplicationDbContext context, ILogger logger)
    {
        var carModelsPath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "car-models.json");
        logger.LogInformation($"Looking for car models JSON at: {carModelsPath}");
        
        if (!File.Exists(carModelsPath))
        {
            logger.LogError($"Car models JSON file not found at: {carModelsPath}");
            throw new FileNotFoundException($"Car models JSON file not found at: {carModelsPath}");
        }

        var json = await File.ReadAllTextAsync(carModelsPath);
        logger.LogInformation($"Read {json.Length} characters from car models JSON");
        
        var carModelsData = JsonSerializer.Deserialize<CarMakeModelsJson[]>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (carModelsData == null)
        {
            logger.LogWarning("Car models data deserialized to null");
            return;
        }
        
        logger.LogInformation($"Parsed {carModelsData.Length} car make-models groups from JSON");

        // Get the seeded car makes to map by name
        var carMakes = await context.CarMakes.ToDictionaryAsync(m => m.Name, m => m.Id);
        logger.LogInformation($"Found {carMakes.Count} car makes in database for mapping");

        var carModels = new List<CarModel>();

        foreach (var makeData in carModelsData)
        {
            // Find the car make by name
            if (!carMakes.TryGetValue(makeData.MakeName, out var carMakeId))
            {
                logger.LogWarning($"Car make '{makeData.MakeName}' not found in database, skipping its models");
                continue; // Skip if make not found
            }

            foreach (var modelName in makeData.Models)
            {
                carModels.Add(new CarModel
                {
                    Name = modelName,
                    CarMakeId = carMakeId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            
            logger.LogDebug($"Added {makeData.Models.Length} models for make '{makeData.MakeName}'");
        }

        logger.LogInformation($"Created {carModels.Count} CarModel entities");
        await context.CarModels.AddRangeAsync(carModels);
    }

    private class CarMakeJson
    {
        public int MakeId { get; set; }
        public string MakeName { get; set; } = string.Empty;
        public DateTime MakeCreated { get; set; }
        public DateTime MakeModified { get; set; }
    }

    private class CarMakeModelsJson
    {
        public int MakeId { get; set; }
        public string MakeName { get; set; } = string.Empty;
        public string[] Models { get; set; } = Array.Empty<string>();
    }
}