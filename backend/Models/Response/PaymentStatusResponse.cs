namespace Ride.Api.Models.Response;

public record PaymentStatusResponse(
    Guid UserId,
    bool IsActive,
    bool PaymentCompleted,
    string? SubscriptionTier,
    decimal SubscriptionPriceEur
);
