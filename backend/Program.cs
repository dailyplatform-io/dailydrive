using Ride.Api.Configurations;
using Ride.Api.Middleware;
using Ride.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRideServices(builder.Configuration);

var app = builder.Build();

app.UseExceptionHandler();
app.UseMiddleware<RequestResponseLoggingMiddleware>();

app.UseHttpsRedirection();

app.UseRouting();
app.UseCors("DefaultCors");

// Enable Swagger in all environments so Azure can serve it.
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Ride API v1");
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

await IdentitySeeder.SeedAsync(app.Services);
await CarDataSeeder.SeedAsync(app.Services);

app.Run();
