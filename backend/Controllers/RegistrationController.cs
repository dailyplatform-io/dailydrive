using Microsoft.AspNetCore.Mvc;
using Ride.Api.Models.Request;
using Ride.Api.Models.Response;
using Ride.Api.Services.Interface;

namespace Ride.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RegistrationController(IUserService userService, ILogger<RegistrationController> logger) : ControllerBase
{
    private const string SupportPhone = "+355685555104";

    [HttpPost("complete-payment")]
    public async Task<ActionResult<RegistrationResponse>> CompletePayment(
        [FromBody] CompletePaymentRequest request,
        CancellationToken cancellationToken)
    {
        var result = await userService.CompletePaymentAsync(request, cancellationToken);
        if (!result.Succeeded || result.Data is null)
        {
            if ((result.Error ?? string.Empty).Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { Success = false, Message = result.Error });
            }
            logger.LogWarning("Payment completion failed for user {UserId}: {Error}", request.UserId, result.Error);
            return BadRequest(new { Success = false, Message = result.Error });
        }

        return Ok(result.Data);
    }

    [HttpGet("whatsapp-message/{userId}")]
    public async Task<ActionResult<string>> GetWhatsAppMessage(Guid userId)
    {
        var result = await userService.BuildWhatsAppMessageAsync(userId);
        if (!result.Succeeded || result.Data is null)
        {
            if ((result.Error ?? string.Empty).Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { Success = false, Message = result.Error });
            }
            return BadRequest(new { Success = false, Message = result.Error });
        }

        return Ok(result.Data);
    }

    [HttpGet("payment-status/{userId}")]
    public async Task<ActionResult<PaymentStatusResponse>> GetPaymentStatus(Guid userId)
    {
        var result = await userService.GetPaymentStatusAsync(userId);
        if (!result.Succeeded || result.Data is null)
        {
            if ((result.Error ?? string.Empty).Contains("not found", StringComparison.OrdinalIgnoreCase))
            {
                return NotFound(new { Success = false, Message = result.Error });
            }
            return BadRequest(new { Success = false, Message = result.Error });
        }

        return Ok(result.Data);
    }

    [HttpGet("support-phone")]
    public ActionResult<string> GetSupportPhone()
    {
        return Ok(SupportPhone);
    }
}
