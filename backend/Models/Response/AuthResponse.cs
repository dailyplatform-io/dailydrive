namespace Ride.Api.Models.Response;

public record AuthResponse(
    string Token, 
    DateTime ExpiresAt, 
    Guid UserId, 
    string Email, 
    Guid? OwnerId = null,
    bool IsActive = false,
    bool PaymentCompleted = false,
    bool IsInTrial = false,
    DateTime? TrialEndsAt = null,
    DateTime? SubscriptionUntil = null,
    string? SubscriptionTier = null,
    decimal SubscriptionPriceEur = 0,
    string? PaymentMethod = null,
    string? FirstName = null,
    string? LastName = null,
    string? Phone = null,
    string? SellerName = null,
    string? SellerSlug = null,
    string? InstagramName = null,
    string? FacebookName = null,
    string? ProfileType = null,
    string? City = null,
    string? Address = null,
    double? Latitude = null,
    double? Longitude = null
) : IBaseResponse
{
    public bool Success { get; init; } = true;
    public string? Message { get; init; }
}
