using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ride.Api.Utilities;

namespace Ride.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ValidationController : ControllerBase
{
    [HttpGet("password-requirements")]
    [AllowAnonymous]
    public ActionResult<object> GetPasswordRequirements()
    {
        return Ok(new
        {
            minimumLength = PasswordValidator.Requirements.MinimumLength,
            description = PasswordValidator.Requirements.RequirementDescription,
            requirements = new[]
            {
                $"At least {PasswordValidator.Requirements.MinimumLength} characters",
                "At least one uppercase letter (A-Z)",
                "At least one lowercase letter (a-z)",
                "At least one number (0-9)"
            }
        });
    }
}