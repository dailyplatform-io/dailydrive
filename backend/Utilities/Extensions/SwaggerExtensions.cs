using Microsoft.OpenApi.Models;

namespace Ride.Api.Utilities.Extensions;

public static class SwaggerExtensions
{
    public static IServiceCollection AddRideSwagger(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Ride API",
                Version = "v1",
                Description = "Backend API for ride management"
            });
        });

        return services;
    }
}
