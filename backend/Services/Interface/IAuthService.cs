using Ride.Api.Models.Request;
using Ride.Api.Models.Response;
using Ride.Api.Utilities.Results;

namespace Ride.Api.Services.Interface;

public interface IAuthService
{
    Task<Result<AuthResponse>> RegisterAsync(RegisterUserRequest request, CancellationToken cancellationToken = default);
    Task<Result<AuthResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<Result<bool>> ChangePasswordAsync(string userId, ChangePasswordRequest request, CancellationToken cancellationToken = default);
    Task<Result<AuthResponse>> CompletePaymentAsync(string userId, CompletePaymentRequest request, CancellationToken cancellationToken = default);
    Task<Result<AuthResponse>> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task<Result<AuthResponse>> GetCurrentUserAsync(string userId, CancellationToken cancellationToken = default);
    Task<Result<AuthResponse>> UpdateOwnerProfileAsync(string userId, UpdateOwnerProfileRequest request, CancellationToken cancellationToken = default);
}
