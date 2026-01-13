using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using Microsoft.Extensions.Options;
using Ride.Api.Services.Interface;
using Ride.Api.Utilities.Results;
using Ride.Api.Utilities.Settings;

namespace Ride.Api.Services;

public class BlobStorageService : IBlobStorageService
{
    private readonly BlobContainerClient _container;
    private readonly StorageSettings _settings;
    private readonly ILogger<BlobStorageService> _logger;

    public BlobStorageService(IOptions<StorageSettings> options, ILogger<BlobStorageService> logger)
    {
        _settings = options.Value;
        _logger = logger;
        _container = new BlobContainerClient(_settings.ConnectionString, _settings.ContainerName);
    }

    private async Task EnsureContainerAsync(CancellationToken cancellationToken)
    {
        // Create container with blob-level public access
        await _container.CreateIfNotExistsAsync(PublicAccessType.Blob, cancellationToken: cancellationToken);
    }

    public async Task<BlobUploadResult> UploadAsync(Stream content, string blobName, string contentType, CancellationToken cancellationToken = default)
    {
        try
        {
            await EnsureContainerAsync(cancellationToken);
            var client = _container.GetBlobClient(blobName);
            content.Position = 0;
            var options = new BlobUploadOptions
            {
                HttpHeaders = new BlobHttpHeaders { ContentType = contentType }
            };
            
            var response = await client.UploadAsync(content, overwrite: true, cancellationToken);
            _logger.LogInformation("Successfully uploaded blob {BlobName} to container {Container}. Response: {Response}", 
                blobName, _settings.ContainerName, response.Value.ETag);
            
            // Verify the blob was actually uploaded
            var exists = await client.ExistsAsync(cancellationToken);
            if (!exists.Value)
            {
                _logger.LogError("Blob {BlobName} was not found after upload", blobName);
                throw new InvalidOperationException($"Failed to verify blob upload for {blobName}");
            }
            
            return new BlobUploadResult(blobName, GetPublicUrl(blobName));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload blob {BlobName} to container {Container}", blobName, _settings.ContainerName);
            throw;
        }
    }

    public async Task DeleteAsync(string blobName, CancellationToken cancellationToken = default)
    {
        await EnsureContainerAsync(cancellationToken);
        var client = _container.GetBlobClient(blobName);
        var deleted = await client.DeleteIfExistsAsync(cancellationToken: cancellationToken);
        if (deleted) _logger.LogInformation("Deleted blob {BlobName}", blobName);
    }

    public string GetPublicUrl(string blobName)
    {
        var blobClient = _container.GetBlobClient(blobName);
        
        // Check if blob exists before generating URL
        try
        {
            var exists = blobClient.Exists();
            if (!exists.Value)
            {
                _logger.LogWarning("Blob {BlobName} does not exist in container {Container}", blobName, _settings.ContainerName);
                return string.Empty; // Return empty string for non-existent blobs
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if blob {BlobName} exists", blobName);
            return string.Empty;
        }
        
        // For development: use simple public URL if ImageBaseUrl is configured
        if (!string.IsNullOrWhiteSpace(_settings.ImageBaseUrl))
        {
            return $"{_settings.ImageBaseUrl.TrimEnd('/')}/{blobName}";
        }
        
        // Fallback to SAS token approach
        BlobSasBuilder sasBuilder = new()
        {
            BlobContainerName = _container.Name,
            BlobName = blobName,
            Resource = "b",
            ExpiresOn = DateTimeOffset.UtcNow.AddHours(1),
            StartsOn = DateTimeOffset.UtcNow.AddMinutes(-5)
        };
        sasBuilder.SetPermissions(BlobSasPermissions.Read);
        
        return blobClient.GenerateSasUri(sasBuilder).ToString();
    }
}
