namespace Ride.Api.Models.Response;

public record RegistrationResponse(
    Guid UserId,
    string Email,
    string FirstName,
    string LastName,
    string SubscriptionTier,
    decimal SubscriptionPriceEur,
    bool IsActive,
    bool PaymentCompleted
);
