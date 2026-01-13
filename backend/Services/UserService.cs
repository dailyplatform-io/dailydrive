using Microsoft.AspNetCore.Identity;
using Ride.Api.Data.Entities;
using Ride.Api.Models.Request;
using Ride.Api.Models.Response;
using Ride.Api.Services.Interface;
using Ride.Api.Utilities.Results;

namespace Ride.Api.Services;

public class UserService(
    UserManager<ApplicationUser> userManager,
    ILogger<UserService> logger) : IUserService
{
    public async Task<Result<RegistrationResponse>> CompletePaymentAsync(CompletePaymentRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await userManager.FindByIdAsync(request.UserId.ToString());
            if (user is null)
            {
                return Result<RegistrationResponse>.Failure("User not found");
            }

            user.PaymentCompleted = true;
            user.IsActive = true;
            user.PaymentMethod = request.PaymentMethod;
            user.PayPalTransactionId = request.PayPalTransactionId;
            
            // Update subscription tier if provided (for upgrades)
            if (!string.IsNullOrWhiteSpace(request.SubscriptionTier))
            {
                user.SubscriptionTier = request.SubscriptionTier;
                logger.LogInformation("Updating subscription tier to {Tier} for user {UserId}", request.SubscriptionTier, user.Id);
            }

            var result = await userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                logger.LogWarning("Payment completion failed for user {UserId}: {Errors}", request.UserId, errors);
                return Result<RegistrationResponse>.Failure(errors);
            }

            logger.LogInformation("Payment completed for user {UserId} via {PaymentMethod}", user.Id, request.PaymentMethod);

            return Result<RegistrationResponse>.Success(new RegistrationResponse(
                user.Id,
                user.Email ?? string.Empty,
                user.FirstName ?? string.Empty,
                user.LastName ?? string.Empty,
                user.SubscriptionTier ?? "free",
                user.SubscriptionPriceEur,
                user.IsActive,
                user.PaymentCompleted
            ));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Payment completion error for user {UserId}", request.UserId);
            return Result<RegistrationResponse>.Failure(ex.Message);
        }
    }

    public async Task<Result<string>> BuildWhatsAppMessageAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await userManager.FindByIdAsync(userId.ToString());
            if (user is null)
            {
                return Result<string>.Failure("User not found");
            }

            var message = $"Hi! I'm {user.FirstName} {user.LastName} and I'd like to complete my DailyDrive registration.\n\n" +
                         $"User ID: {user.Id}\n" +
                         $"Email: {user.Email}\n" +
                         $"Plan: {user.SubscriptionTier}\n" +
                         $"Amount: €{user.SubscriptionPriceEur:F2}/year\n\n" +
                         "Please help me complete the payment process.";

            return Result<string>.Success(message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "WhatsApp message generation error for user {UserId}", userId);
            return Result<string>.Failure(ex.Message);
        }
    }

    public async Task<Result<PaymentStatusResponse>> GetPaymentStatusAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await userManager.FindByIdAsync(userId.ToString());
            if (user is null)
            {
                return Result<PaymentStatusResponse>.Failure("User not found");
            }

            var payload = new PaymentStatusResponse(
                user.Id,
                user.IsActive,
                user.PaymentCompleted,
                user.SubscriptionTier ?? "free",
                user.SubscriptionPriceEur);

            return Result<PaymentStatusResponse>.Success(payload);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Payment status check error for user {UserId}", userId);
            return Result<PaymentStatusResponse>.Failure(ex.Message);
        }
    }
}
