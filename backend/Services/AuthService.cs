using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Ride.Api.Data.Entities;
using Ride.Api.Models.Request;
using Ride.Api.Models.Response;
using Ride.Api.Services.Interface;
using Ride.Api.Utilities;
using Ride.Api.Utilities.Results;
using Ride.Api.Utilities.Settings;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Ride.Api.Services;

public class AuthService(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    IIdentityService identityService,
    ILogger<AuthService> logger,
    IOptions<JwtSettings> jwtOptions) : IAuthService
{
    private readonly JwtSettings _jwtSettings = jwtOptions.Value;

    public async Task<Result<AuthResponse>> RegisterAsync(RegisterUserRequest request, CancellationToken cancellationToken = default)
    {
        var existingUser = await userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
        {
            return Result<AuthResponse>.Failure("A user with this email already exists.");
        }

        var subscriptionPrice = CalculateSubscriptionPrice(request.ProfileType, request.SubscriptionTier);
        var trialEnabled = FeatureFlags.TrialEnabled;
        var subscriptionsEnabled = FeatureFlags.SubscriptionsEnabled;

        var sellerSlug = await GenerateUniqueSellerSlugAsync(request.SellerName, null, cancellationToken);
        var instagramName = NormalizeInstagramHandle(request.InstagramName);
        var facebookName = NormalizeOptional(request.FacebookName);

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = true,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.Phone,
            SellerName = request.SellerName.Trim(),
            SellerSlug = sellerSlug,
            InstagramName = instagramName,
            FacebookName = facebookName,
            ProfileType = request.ProfileType,
            SubscriptionTier = request.SubscriptionTier,
            City = request.City,
            Address = request.Address,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            IsActive = subscriptionsEnabled ? false : true,
            PaymentCompleted = subscriptionsEnabled ? false : true,
            PaymentMethod = subscriptionsEnabled ? "Free" : "Disabled",
            TrialEndsAt = trialEnabled ? DateTime.UtcNow.AddDays(7) : null,
            SubscriptionUntil = null, // No subscription until payment
            SubscriptionPriceEur = subscriptionPrice
        };

        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
            logger.LogWarning("User registration failed for {Email}: {Errors}", request.Email, errors);
            return Result<AuthResponse>.Failure(errors);
        }

        await userManager.AddToRoleAsync(user, "regular");

        var tokenResponse = await identityService.CreateAuthResponseAsync(user, cancellationToken);

        logger.LogInformation("Registered user {UserId} - awaiting payment", user.Id);

        return Result<AuthResponse>.Success(
            tokenResponse with
            {
                OwnerId = user.Id,
                IsActive = user.IsActive,
                PaymentCompleted = user.PaymentCompleted,
                IsInTrial = user.IsInTrial,
                TrialEndsAt = user.TrialEndsAt,
                SubscriptionTier = user.SubscriptionTier,
                SubscriptionPriceEur = user.SubscriptionPriceEur,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Phone = user.PhoneNumber,
                SellerName = user.SellerName,
                SellerSlug = user.SellerSlug,
                InstagramName = user.InstagramName,
                FacebookName = user.FacebookName,
                ProfileType = user.ProfileType.ToString().ToLowerInvariant(),
                City = user.City,
                Address = user.Address,
                Latitude = user.Latitude,
                Longitude = user.Longitude
            });
    }

    public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return Result<AuthResponse>.Failure("Invalid credentials.");
        }

        var signInResult = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: false);
        if (!signInResult.Succeeded)
        {
            return Result<AuthResponse>.Failure("Invalid credentials.");
        }

        if (FeatureFlags.SubscriptionsEnabled)
        {
            // Check if trial has expired and payment not completed
            if (user.TrialEndsAt.HasValue && DateTime.UtcNow > user.TrialEndsAt.Value && !user.PaymentCompleted)
            {
                user.IsActive = false;
                await userManager.UpdateAsync(user);
            }

            // Check if user can access (active subscription or valid trial)
            logger.LogInformation("Login access check for user {UserId}: IsActive={IsActive}, IsInTrial={IsInTrial}, CanAccess={CanAccess}, TrialEndsAt={TrialEndsAt}, UtcNow={UtcNow}", 
                user.Id, user.IsActive, user.IsInTrial, user.CanAccess, user.TrialEndsAt, DateTime.UtcNow);
                
            if (!user.CanAccess)
            {
                return Result<AuthResponse>.Failure("Account access expired. Please complete payment to continue.");
            }
        }

        var tokenResponse = await identityService.CreateAuthResponseAsync(user, cancellationToken);
        return Result<AuthResponse>.Success(
            tokenResponse with
            {
                OwnerId = user.Id,
                IsActive = user.IsActive,
                PaymentCompleted = user.PaymentCompleted,
                IsInTrial = user.IsInTrial,
                TrialEndsAt = user.TrialEndsAt,
                SubscriptionUntil = user.SubscriptionUntil,
                SubscriptionTier = user.SubscriptionTier,
                SubscriptionPriceEur = user.SubscriptionPriceEur,
                PaymentMethod = user.PaymentMethod,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Phone = user.PhoneNumber,
                SellerName = user.SellerName,
                SellerSlug = user.SellerSlug,
                InstagramName = user.InstagramName,
                FacebookName = user.FacebookName,
                ProfileType = user.ProfileType.ToString().ToLowerInvariant(),
                City = user.City,
                Address = user.Address,
                Latitude = user.Latitude,
                Longitude = user.Longitude
            });
    }

    private static decimal CalculateSubscriptionPrice(OwnerProfileType profileType, string tier)
    {
        if (tier == "free") return 0;
        return tier switch
        {
            "basic5" => 180,
            "plus10" => 250,
            "standard20" => 350,
            "pro20plus" => 450,
            _ => 0
        };
    }

    public async Task<Result<bool>> ChangePasswordAsync(string userId, ChangePasswordRequest request, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Result<bool>.Failure("User not found.");
        }

        // Validate the new password using our custom validator
        var passwordValidation = PasswordValidator.ValidatePassword(request.NewPassword);
        if (!passwordValidation.IsValid)
        {
            return Result<bool>.Failure(passwordValidation.ErrorMessage ?? "Invalid password format.");
        }

        var changePasswordResult = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!changePasswordResult.Succeeded)
        {
            var errors = string.Join(", ", changePasswordResult.Errors.Select(e => e.Description));
            logger.LogWarning("Password change failed for user {UserId}: {Errors}", userId, errors);
            return Result<bool>.Failure(errors);
        }

        logger.LogInformation("Password changed successfully for user {UserId}", userId);
        return Result<bool>.Success(true);
    }

    public async Task<Result<AuthResponse>> CompletePaymentAsync(string userId, CompletePaymentRequest request, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Result<AuthResponse>.Failure("User not found.");
        }

        // Update user payment status
        user.IsActive = true;
        user.PaymentCompleted = true;
        user.PaymentMethod = request.PaymentMethod;
        user.PayPalTransactionId = request.PayPalTransactionId;
        user.TrialEndsAt = null; // Clear trial period
        user.SubscriptionUntil = DateTime.UtcNow.AddYears(1); // 1 year subscription

        // Update subscription tier if provided
        if (!string.IsNullOrEmpty(request.SubscriptionTier))
        {
            user.SubscriptionTier = request.SubscriptionTier;
            user.SubscriptionPriceEur = CalculateSubscriptionPrice(user.ProfileType, request.SubscriptionTier);
        }

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
            logger.LogWarning("Payment completion update failed for user {UserId}: {Errors}", userId, errors);
            return Result<AuthResponse>.Failure(errors);
        }

        var tokenResponse = await identityService.CreateAuthResponseAsync(user, cancellationToken);
        
        logger.LogInformation("Payment completed successfully for user {UserId}, method: {PaymentMethod}", userId, request.PaymentMethod);
        
        return Result<AuthResponse>.Success(
            tokenResponse with
            {
                OwnerId = user.Id,
                IsActive = user.IsActive,
                PaymentCompleted = user.PaymentCompleted,
                IsInTrial = user.IsInTrial,
                TrialEndsAt = user.TrialEndsAt,
                SubscriptionTier = user.SubscriptionTier,
                SubscriptionPriceEur = user.SubscriptionPriceEur,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Phone = user.PhoneNumber,
                SellerName = user.SellerName,
                SellerSlug = user.SellerSlug,
                InstagramName = user.InstagramName,
                FacebookName = user.FacebookName,
                ProfileType = user.ProfileType.ToString().ToLowerInvariant(),
                City = user.City,
                Address = user.Address,
                Latitude = user.Latitude,
                Longitude = user.Longitude
            });
    }
    
    public async Task<Result<AuthResponse>> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                return Result<AuthResponse>.Failure("Refresh token is required");
            }
            
            logger.LogInformation("Token refresh requested with token: {TokenPrefix}...", refreshToken[..Math.Min(10, refreshToken.Length)]);
            
            // In a full implementation, you would:
            // 1. Look up the refresh token in the database to get the associated user ID
            // 2. Validate that the refresh token is not expired or revoked
            // 3. Get the user from the database using the user ID
            // 4. Generate new tokens
            
            if (!refreshToken.StartsWith("refresh-"))
            {
                return Result<AuthResponse>.Failure("Invalid refresh token format");
            }
            
            // For demonstration, try to extract a user ID from the refresh token pattern
            // Real implementation would lookup refresh token in database
            string? userId = null;
            
            try
            {
                // Try to parse refresh token format: "refresh-{timestamp}-{userid}-{randompart}"
                var parts = refreshToken.Split('-');
                if (parts.Length >= 4 && Guid.TryParse(parts[2], out _))
                {
                    userId = parts[2];
                }
            }
            catch
            {
                // Ignore parsing errors, will fall back to demo user
            }
            
            ApplicationUser? user = null;
            
            // Extract and validate user from refresh token
            if (string.IsNullOrEmpty(userId))
            {
                logger.LogWarning("Could not extract user ID from refresh token");
                return Result<AuthResponse>.Failure("Invalid refresh token format");
            }
            
            user = await userManager.FindByIdAsync(userId);
            if (user == null)
            {
                logger.LogWarning("User {UserId} not found for refresh token", userId);
                return Result<AuthResponse>.Failure("Invalid refresh token - user not found");
            }
            
            logger.LogInformation("Found user {UserId} from refresh token", userId);
            
            // Validate that user can still access (same checks as login)
            if (user.TrialEndsAt.HasValue && DateTime.UtcNow > user.TrialEndsAt.Value && !user.PaymentCompleted)
            {
                user.IsActive = false;
                await userManager.UpdateAsync(user);
            }
            
            if (!user.CanAccess)
            {
                logger.LogWarning("User {UserId} cannot access - trial expired or payment not completed", user.Id);
                return Result<AuthResponse>.Failure("Account access expired. Please complete payment to continue.");
            }
            
            // Generate new access token for the real user
            var tokenResponse = await identityService.CreateAuthResponseAsync(user, cancellationToken);
            
            // Return the full user data in the response
            var fullResponse = tokenResponse with
            {
                OwnerId = user.Id,
                IsActive = user.IsActive,
                PaymentCompleted = user.PaymentCompleted,
                IsInTrial = user.IsInTrial,
                TrialEndsAt = user.TrialEndsAt,
                SubscriptionUntil = user.SubscriptionUntil,
                SubscriptionTier = user.SubscriptionTier,
                SubscriptionPriceEur = user.SubscriptionPriceEur,
                PaymentMethod = user.PaymentMethod,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Phone = user.PhoneNumber,
                SellerName = user.SellerName,
                SellerSlug = user.SellerSlug,
                InstagramName = user.InstagramName,
                FacebookName = user.FacebookName,
                ProfileType = user.ProfileType.ToString().ToLowerInvariant(),
                City = user.City,
                Address = user.Address,
                Latitude = user.Latitude,
                Longitude = user.Longitude,
                Success = true,
                Message = "Token refreshed successfully"
            };
            
            logger.LogInformation("Token refreshed successfully for user {UserId} - {Email}", user.Id, user.Email);
            
            return Result<AuthResponse>.Success(fullResponse);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during token refresh");
            return Result<AuthResponse>.Failure("Token refresh failed");
        }
    }

    public async Task<Result<AuthResponse>> GetCurrentUserAsync(string userId, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Result<AuthResponse>.Failure("User not found.");
        }

        return Result<AuthResponse>.Success(BuildProfileResponse(user));
    }

    public async Task<Result<AuthResponse>> UpdateOwnerProfileAsync(
        string userId,
        UpdateOwnerProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Result<AuthResponse>.Failure("User not found.");
        }

        var nextSellerName = request.SellerName.Trim();
        var needsSlug = string.IsNullOrWhiteSpace(user.SellerSlug) ||
                        !string.Equals(user.SellerName, nextSellerName, StringComparison.OrdinalIgnoreCase);

        user.SellerName = nextSellerName;
        user.InstagramName = NormalizeInstagramHandle(request.InstagramName);
        user.FacebookName = NormalizeOptional(request.FacebookName);

        if (needsSlug)
        {
            user.SellerSlug = await GenerateUniqueSellerSlugAsync(nextSellerName, user.Id, cancellationToken);
        }

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
            logger.LogWarning("Profile update failed for user {UserId}: {Errors}", userId, errors);
            return Result<AuthResponse>.Failure(errors);
        }

        return Result<AuthResponse>.Success(BuildProfileResponse(user));
    }

    private static string? NormalizeOptional(string? value)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }

    private static string? NormalizeInstagramHandle(string? value)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrEmpty(trimmed)) return null;
        return trimmed.StartsWith("@", StringComparison.Ordinal) ? trimmed[1..] : trimmed;
    }

    private async Task<string> GenerateUniqueSellerSlugAsync(string sellerName, Guid? userId, CancellationToken cancellationToken)
    {
        var baseSlug = SlugHelper.Slugify(sellerName);
        if (string.IsNullOrWhiteSpace(baseSlug))
        {
            baseSlug = "seller";
        }

        var slug = baseSlug;
        var suffix = 1;

        while (await userManager.Users.AnyAsync(
                   u => u.SellerSlug == slug && (!userId.HasValue || u.Id != userId.Value),
                   cancellationToken))
        {
            slug = $"{baseSlug}-{suffix}";
            suffix++;
        }

        return slug;
    }

    private static AuthResponse BuildProfileResponse(ApplicationUser user)
    {
        return new AuthResponse(
            string.Empty,
            DateTime.UtcNow,
            user.Id,
            user.Email ?? string.Empty,
            user.Id,
            user.IsActive,
            user.PaymentCompleted,
            user.IsInTrial,
            user.TrialEndsAt,
            user.SubscriptionUntil,
            user.SubscriptionTier,
            user.SubscriptionPriceEur,
            user.PaymentMethod,
            user.FirstName,
            user.LastName,
            user.PhoneNumber,
            user.SellerName,
            user.SellerSlug,
            user.InstagramName,
            user.FacebookName,
            user.ProfileType.ToString().ToLowerInvariant(),
            user.City,
            user.Address,
            user.Latitude,
            user.Longitude
        );
    }
}
