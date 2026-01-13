using Ride.Api.Data.Entities;

namespace Ride.Api.Utilities.Extensions;

public static class CarImageExtensions
{
    public static string? Url(this CarImage carImage)
    {
        if (string.IsNullOrEmpty(carImage.BlobName))
        {
            return null;
        }

        // You can configure this base URL from configuration if needed
        // For now, assuming BlobName is already a full URL or will be processed by BlobStorageService
        return carImage.BlobName;
    }
}
