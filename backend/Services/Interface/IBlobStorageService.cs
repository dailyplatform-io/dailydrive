using Ride.Api.Utilities.Results;

namespace Ride.Api.Services.Interface;

public interface IBlobStorageService
{
    Task<BlobUploadResult> UploadAsync(Stream content, string blobName, string contentType, CancellationToken cancellationToken = default);
    Task DeleteAsync(string blobName, CancellationToken cancellationToken = default);
    string GetPublicUrl(string blobName);
}
