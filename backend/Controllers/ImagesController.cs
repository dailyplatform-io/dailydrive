using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ride.Api.Services.Interface;

namespace Ride.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ImagesController(IBlobStorageService blobStorageService, ILogger<ImagesController> logger) : ControllerBase
{
    [HttpPost("upload")]
    public async Task<IActionResult> UploadImage(IFormFile file, CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file provided");
        }

        // Validate file type
        var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
        {
            return BadRequest("Invalid file type. Only JPEG, PNG and WebP images are allowed.");
        }

        // Validate file size (max 10MB)
        if (file.Length > 10 * 1024 * 1024)
        {
            return BadRequest("File size exceeds maximum limit of 10MB.");
        }

        try
        {
            // Generate unique blob name with extension
            var extension = Path.GetExtension(file.FileName).ToLower();
            var blobName = $"{Guid.NewGuid()}{extension}";

            // Upload to blob storage
            using var stream = file.OpenReadStream();
            var result = await blobStorageService.UploadAsync(stream, blobName, file.ContentType, cancellationToken);

            logger.LogInformation("Image uploaded successfully: {BlobName}", blobName);

            return Ok(new
            {
                id = blobName, // Return full blob name with extension
                blobName = result.BlobName,
                url = result.Url
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to upload image");
            return StatusCode(500, "Failed to upload image");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteImage(string id, CancellationToken cancellationToken = default)
    {
        try
        {
            // Use the ID as the blob name directly (now includes extension)
            await blobStorageService.DeleteAsync(id, cancellationToken);
            logger.LogInformation("Image deleted successfully: {BlobName}", id);
            return Ok(new { message = "Image deleted successfully" });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to delete image {ImageId}", id);
            return StatusCode(500, "Failed to delete image");
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous] // Allow public access to images
    public IActionResult GetImageUrl(string id)
    {
        try
        {
            // Use the ID as the blob name directly (now includes extension)
            var url = blobStorageService.GetPublicUrl(id);
            
            // Only return if we got a valid URL (blob exists)
            if (!string.IsNullOrEmpty(url))
            {
                return Ok(new { url });
            }

            logger.LogWarning("Image not found for ID {ImageId}", id);
            return NotFound("Image not found");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to get image URL for {ImageId}", id);
            return StatusCode(500, "Failed to get image URL");
        }
    }
}
