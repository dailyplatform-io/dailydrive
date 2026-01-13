using System.ComponentModel.DataAnnotations;

namespace Ride.Api.Models.Request;

public class CompletePaymentRequest
{
    [Required]
    public Guid UserId { get; init; }
    
    [Required]
    public string PaymentMethod { get; init; } = string.Empty;
    
    public string? PayPalTransactionId { get; init; }
    
    public string? SubscriptionTier { get; init; }
    
    public string? Source { get; init; } // 'register', 'upgrade' - tracks where payment was initiated
}
