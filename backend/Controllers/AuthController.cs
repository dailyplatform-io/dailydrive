using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ride.Api.Models.Request;
using Ride.Api.Models.Response;
using Ride.Api.Services.Interface;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Ride.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService authService, ILogger<AuthController> logger) : ControllerBase
{
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthResponse>> GetCurrentUser(CancellationToken cancellationToken)
    {
        var userId = GetUserIdFromClaims(User);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var result = await authService.GetCurrentUserAsync(userId, cancellationToken);
        if (!result.Succeeded || result.Data is null)
        {
            return BadRequest(new AuthResponse(string.Empty, DateTime.UtcNow, Guid.Empty, string.Empty)
            {
                Success = false,
                Message = result.Error
            });
        }

        return Ok(result.Data);
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<ActionResult<AuthResponse>> UpdateProfile(
        [FromBody] UpdateOwnerProfileRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserIdFromClaims(User);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var result = await authService.UpdateOwnerProfileAsync(userId, request, cancellationToken);
        if (!result.Succeeded || result.Data is null)
        {
            return BadRequest(new AuthResponse(string.Empty, DateTime.UtcNow, Guid.Empty, string.Empty)
            {
                Success = false,
                Message = result.Error
            });
        }

        return Ok(result.Data);
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register(
        [FromBody] RegisterUserRequest request,
        CancellationToken cancellationToken)
    {
        var result = await authService.RegisterAsync(request, cancellationToken);
        if (!result.Succeeded || result.Data is null)
        {
            logger.LogWarning("Registration failed for {Email}: {Error}", request.Email, result.Error);
            return BadRequest(new AuthResponse(string.Empty, DateTime.UtcNow, Guid.Empty, request.Email)
            {
                Success = false,
                Message = result.Error
            });
        }

        return Ok(result.Data);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var result = await authService.LoginAsync(request, cancellationToken);
        if (!result.Succeeded || result.Data is null)
        {
            logger.LogWarning("Login failed for {Email}: {Error}", request.Email, result.Error);
            return Unauthorized(new AuthResponse(string.Empty, DateTime.UtcNow, Guid.Empty, request.Email)
            {
                Success = false,
                Message = result.Error
            });
        }

        return Ok(result.Data);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var result = await authService.ChangePasswordAsync(userId, request, cancellationToken);
        if (!result.Succeeded)
        {
            logger.LogWarning("Password change failed for user {UserId}: {Error}", userId, result.Error);
            return BadRequest(new { success = false, message = result.Error });
        }

        return Ok(new { success = true, message = "Password changed successfully." });
    }

    [HttpPost("complete-payment")]
    [Authorize]
    public async Task<ActionResult> CompletePayment(
        [FromBody] CompletePaymentRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var result = await authService.CompletePaymentAsync(userId, request, cancellationToken);
        if (!result.Succeeded)
        {
            logger.LogError("Payment completion failed for user {UserId} with PayPal transaction {TransactionId}: {Error}", 
                userId, request.PayPalTransactionId, result.Error);
            
            // If this was a PayPal payment and we have a transaction ID, log for manual refund processing
            if (request.PaymentMethod == "PayPal" && !string.IsNullOrEmpty(request.PayPalTransactionId))
            {
                logger.LogCritical("PAYPAL REFUND REQUIRED - User: {UserId}, Transaction: {TransactionId}, Reason: {Error}", 
                    userId, request.PayPalTransactionId, result.Error);
            }
            
            return BadRequest(new { 
                success = false, 
                message = result.Error,
                requiresRefund = request.PaymentMethod == "PayPal" && !string.IsNullOrEmpty(request.PayPalTransactionId)
            });
        }

        return Ok(new { 
            success = true, 
            message = "Payment completed successfully.", 
            data = result.Data,
            source = request.Source // Include source in response for frontend routing
        });
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<ActionResult<RefreshTokenResponse>> RefreshToken(
        [FromBody] RefreshTokenRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await authService.RefreshTokenAsync(request.RefreshToken, cancellationToken);
            if (!result.Succeeded || result.Data is null)
            {
                logger.LogWarning("Token refresh failed: {Error}", result.Error);
                return Unauthorized(new RefreshTokenResponse 
                { 
                    Success = false, 
                    Error = result.Error ?? "Invalid refresh token" 
                });
            }

            return Ok(new RefreshTokenResponse 
            { 
                Success = true, 
                AccessToken = result.Data.Token, 
                RefreshToken = request.RefreshToken, // For now, return same refresh token
                ExpiresAt = result.Data.ExpiresAt,
                Message = "Token refreshed successfully"
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Token refresh error");
            return StatusCode(500, new RefreshTokenResponse 
            { 
                Success = false, 
                Error = "Internal server error during token refresh" 
            });
        }
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public ActionResult Logout(
        [FromBody] RefreshTokenRequest? request = null)
    {
        try
        {
            // For now, just return success as we don't have refresh token storage yet
            // In a full implementation, this would revoke the refresh token
            logger.LogInformation("User logout requested");
            return Ok(new { success = true, message = "Logged out successfully" });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Logout error");
            return StatusCode(500, new { success = false, message = "Logout failed" });
        }
    }

    private static string? GetUserIdFromClaims(ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? user.FindFirstValue("uid")
               ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);
    }
}
