using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Ride.Api.Data;
using Ride.Api.Data.Entities;
using Ride.Api.Data.Repositories.Interface;
using Ride.Api.Data.Repositories.Repository;
using Ride.Api.Middleware.Exceptions;
using Ride.Api.Services;
using Ride.Api.Services.Interface;
using Ride.Api.Utilities.Context;
using Ride.Api.Utilities.Extensions;
using Ride.Api.Utilities.Settings;

namespace Ride.Api.Configurations;

public static class DependencyInjection
{
    public static IServiceCollection AddRideServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<RouteOptions>(options =>
        {
            options.LowercaseUrls = true;
            options.LowercaseQueryStrings = true;
        });

        services.Configure<DatabaseSettings>(configuration.GetSection(DatabaseSettings.SectionName));
        services.Configure<StorageSettings>(configuration.GetSection(StorageSettings.SectionName));
        services.Configure<PaginationSettings>(configuration.GetSection(PaginationSettings.SectionName));
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));

        var databaseSettings = configuration.GetSection(DatabaseSettings.SectionName).Get<DatabaseSettings>() ?? new DatabaseSettings();
        var jwtSettings = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>() ?? new JwtSettings();
        var connectionString = configuration.GetConnectionString("DefaultConnection") ?? databaseSettings.ConnectionString;

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseSqlServer(connectionString);
        });

        services.AddCors(options =>
        {
            options.AddPolicy("DefaultCors", policy =>
            {
                policy
                    .AllowAnyOrigin()
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });

        services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
            {
                options.User.RequireUniqueEmail = true;
                
                // Configure password requirements to match our custom validator
                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = false; // Optional special characters
                options.Password.RequiredUniqueChars = 1;
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidIssuer = jwtSettings.Issuer,
                    ValidAudience = jwtSettings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SigningKey)),
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1),
                    NameClaimType = "name",
                    RoleClaimType = "role"
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy("AdminOnly", policy => policy.RequireRole("admin"));
        });

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<ICarRepository, CarRepository>();
        services.AddScoped<IReservationRepository, ReservationRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<ICarService, CarService>();
        services.AddScoped<IAuctionService, AuctionService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<IReservationService, ReservationService>();
        services.AddSingleton<IBlobStorageService, BlobStorageService>();
        services.AddScoped<IRequestContext, RequestContext>();
        services.AddHttpContextAccessor();

        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });

        services.AddExceptionHandler<GlobalExceptionHandler>();
        services.AddProblemDetails();
        services.AddRideSwagger();

        return services;
    }
}
