using Ride.Api.Models.Request;
using Ride.Api.Models.Response;
using Ride.Api.Utilities.Results;

namespace Ride.Api.Services.Interface;

public interface IUserService
{
    Task<Result<RegistrationResponse>> CompletePaymentAsync(CompletePaymentRequest request, CancellationToken cancellationToken = default);
    Task<Result<string>> BuildWhatsAppMessageAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Result<PaymentStatusResponse>> GetPaymentStatusAsync(Guid userId, CancellationToken cancellationToken = default);
}
