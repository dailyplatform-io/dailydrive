using Ride.Api.Data.Entities;
using Ride.Api.Models.Response;

namespace Ride.Api.Services.Interface;

public interface IIdentityService
{
    Task<AuthResponse> CreateAuthResponseAsync(ApplicationUser user, CancellationToken cancellationToken = default);
}
