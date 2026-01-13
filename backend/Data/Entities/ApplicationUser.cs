using Microsoft.AspNetCore.Identity;

namespace Ride.Api.Data.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? SellerName { get; set; }
    public string? SellerSlug { get; set; }
    public string? InstagramName { get; set; }
    public string? FacebookName { get; set; }
    public OwnerProfileType ProfileType { get; set; } = OwnerProfileType.Rent;
    public string? SubscriptionTier { get; set; }
    public string? City { get; set; }
    public string? Address { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    
    /// <summary>
    /// Whether the user account is active (payment completed or in trial period)
    /// </summary>
    public bool IsActive { get; set; } = false;
    
    /// <summary>
    /// Whether the subscription payment has been completed
    /// </summary>
    public bool PaymentCompleted { get; set; } = false;
    
    /// <summary>
    /// Date when the free trial ends (7 days from registration)
    /// </summary>
    public DateTime? TrialEndsAt { get; set; }
    
    /// <summary>
    /// Date when the subscription ends (1 year from payment)
    /// </summary>
    public DateTime? SubscriptionUntil { get; set; }
    
    /// <summary>
    /// Whether the user is currently in a free trial period
    /// </summary>
    public bool IsInTrial 
    {
        get
        {
            if (!TrialEndsAt.HasValue || PaymentCompleted) 
                return false;
                
            // Ensure we're comparing in UTC
            var trialEndUtc = TrialEndsAt.Value.Kind == DateTimeKind.Utc 
                ? TrialEndsAt.Value 
                : TrialEndsAt.Value.ToUniversalTime();
                
            return DateTime.UtcNow < trialEndUtc;
        }
    }
    
    /// <summary>
    /// Whether the user can access the system (active subscription or valid trial)
    /// </summary>
    public bool CanAccess => IsActive || IsInTrial;
    
    /// <summary>
    /// PayPal transaction ID if paid via PayPal
    /// </summary>
    public string? PayPalTransactionId { get; set; }
    
    /// <summary>
    /// Payment method used (PayPal, WhatsApp, etc.)
    /// </summary>
    public string? PaymentMethod { get; set; }
    
    /// <summary>
    /// Annual subscription price in EUR
    /// </summary>
    public decimal SubscriptionPriceEur { get; set; } = 0;

    public string DisplayName => $"{FirstName} {LastName}".Trim();
}
