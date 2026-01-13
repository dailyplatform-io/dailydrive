using Ride.Api.Data.Entities;
using Ride.Api.Models.Dto;
using Ride.Api.Models.Request;

namespace Ride.Api.Utilities.Mappings;

public static class CarMapping
{
    public static CarDto ToDto(this Car car, string? imageBaseUrl = null)
    {
        var imageBlobNames = car.Images?.Select(i => i.BlobName).ToList() ?? new List<string>();
        
        // Handle the case where CoverImageId might be a GUID string and BlobNames have extensions
        string? coverBlobName = null;
        var coverId = car.CoverImageId;
        
        if (!string.IsNullOrEmpty(coverId))
        {
            // First try exact match
            coverBlobName = car.Images?.FirstOrDefault(i => i.BlobName == coverId)?.BlobName;
            
            // If no exact match and coverId looks like a GUID, try to match by GUID part
            if (coverBlobName == null && Guid.TryParse(coverId, out var coverGuid))
            {
                var coverGuidLower = coverGuid.ToString().ToLowerInvariant();
                coverBlobName = car.Images?.FirstOrDefault(i => 
                    i.BlobName.ToLowerInvariant().StartsWith(coverGuidLower))?.BlobName;
            }
        }
        
        // Fallback to first image if no cover found
        coverBlobName ??= imageBlobNames.FirstOrDefault();
        
        // Use the blob name as the final cover ID for the DTO
        var finalCoverId = coverBlobName;
        var imageUrl = !string.IsNullOrWhiteSpace(car.ImageUrl)
            ? car.ImageUrl
            : coverBlobName is not null && imageBaseUrl is not null
                ? $"{imageBaseUrl.TrimEnd('/')}/{coverBlobName}"
                : null;

        var ownerName = car.Owner?.SellerName;
        if (string.IsNullOrWhiteSpace(ownerName))
        {
            ownerName = $"{car.Owner?.FirstName} {car.Owner?.LastName}".Trim();
        }

        return new CarDto(
            car.Id,
            car.OwnerId,
            ownerName ?? string.Empty,
            car.Owner?.ProfileType.ToReadableProfileType() ?? "rent",
            car.Owner?.PhoneNumber,
            car.Owner?.SellerSlug,
            car.Owner?.InstagramName,
            car.Owner?.FacebookName,
            car.Brand,
            car.Model,
            car.Subtitle,
            car.Year,
            car.BodyStyle.ToReadableBodyStyle(),
            car.FuelType.ToReadableFuelType(),
            car.Transmission.ToReadableTransmission(),
            car.EnginePowerHp,
            car.EngineVolumeL,
            car.Seats,
            car.Doors,
            car.Color,
            car.ExteriorColor,
            car.InteriorColor,
            car.MileageKm,
            car.IsForRent,
            car.IsForSale,
            car.RentPricePerHour,
            car.RentPricePerDay,
            car.SalePrice,
            car.AccidentsCount,
            car.OwnersCount,
            car.ServiceHistory,
            car.Description,
            car.OptionGroups?.Select(o => new OptionGroupDto(o.Title, o.Items)).ToList() ?? new List<OptionGroupDto>(),
            car.Fees,
            car.Taxes,
            car.Rating,
            car.ReviewsCount,
            car.DistanceMeters,
            car.DistanceText,
            car.AvailableNow,
            imageUrl,
            finalCoverId,
            imageBlobNames,
            new CarLocationDto(car.Location.City, car.Location.FullAddress, car.Location.MapLabel, car.Location.Latitude, car.Location.Longitude),
            car.ListingStatus.ToReadableListingStatus(),
            car.CreatedAt,
            car.UpdatedAt,
            car.AvailableIn);
    }

    public static Car ToEntity(this CreateCarRequest request)
    {
        var car = new Car
        {
            Id = Guid.NewGuid(),
            OwnerId = request.OwnerId,
            Brand = request.Brand,
            Model = request.Model,
            Subtitle = request.Subtitle,
            Year = request.Year,
            BodyStyle = request.BodyStyle,
            FuelType = request.FuelType,
            Transmission = request.Transmission,
            EnginePowerHp = request.EnginePowerHp,
            EngineVolumeL = request.EngineVolumeL,
            Seats = request.Seats,
            Doors = request.Doors,
            Color = request.Color,
            ExteriorColor = request.ExteriorColor,
            InteriorColor = request.InteriorColor,
            MileageKm = request.MileageKm,
            IsForRent = request.IsForRent,
            IsForSale = request.IsForSale,
            RentPricePerHour = request.RentPricePerHour,
            RentPricePerDay = request.RentPricePerDay,
            SalePrice = request.SalePrice,
            AccidentsCount = request.AccidentsCount ?? 0,
            OwnersCount = request.OwnersCount ?? 1,
            ServiceHistory = request.ServiceHistory,
            Description = request.Description,
            OptionGroups = request.OptionsGroups?.Select(o => new OptionGroup { Title = o.Title, Items = o.Items.ToList() }).ToList() ?? new List<OptionGroup>(),
            Fees = request.Fees,
            Taxes = request.Taxes,
            Rating = request.Rating,
            ReviewsCount = request.ReviewsCount,
            DistanceMeters = request.DistanceMeters,
            DistanceText = request.DistanceText,
            AvailableNow = request.AvailableNow,
            CoverImageId = request.CoverImageId,
            Location = new CarLocation
            {
                City = request.Location.City,
                FullAddress = request.Location.FullAddress,
                MapLabel = request.Location.MapLabel,
                Latitude = request.Location.Lat,
                Longitude = request.Location.Lng
            },
            AvailableIn = request.AvailableIn,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var images = (request.ImageIds ?? []).Select((blobName, idx) =>
            new CarImage
            {
                Id = Guid.NewGuid(), // Generate new Guid for the CarImage entity
                CarId = car.Id,
                BlobName = blobName, // Use the blob name directly (includes extension)
                IsCover = request.CoverImageId == blobName || (request.CoverImageId == null && idx == 0),
                SortOrder = idx
            }).ToList();

        car.Images = images;

        return car;
    }

    public static void ApplyUpdate(this Car car, UpdateCarRequest request)
    {
        car.Brand = request.Brand ?? car.Brand;
        car.Model = request.Model ?? car.Model;
        car.Subtitle = request.Subtitle ?? car.Subtitle;
        car.Year = request.Year ?? car.Year;
        car.BodyStyle = request.BodyStyle ?? car.BodyStyle;
        car.FuelType = request.FuelType ?? car.FuelType;
        car.Transmission = request.Transmission ?? car.Transmission;
        car.EnginePowerHp = request.EnginePowerHp ?? car.EnginePowerHp;
        car.EngineVolumeL = request.EngineVolumeL ?? car.EngineVolumeL;
        car.Seats = request.Seats ?? car.Seats;
        car.Doors = request.Doors ?? car.Doors;
        car.Color = request.Color ?? car.Color;
        car.ExteriorColor = request.ExteriorColor ?? car.ExteriorColor;
        car.InteriorColor = request.InteriorColor ?? car.InteriorColor;
        car.MileageKm = request.MileageKm ?? car.MileageKm;
        car.IsForRent = request.IsForRent ?? car.IsForRent;
        car.IsForSale = request.IsForSale ?? car.IsForSale;
        car.RentPricePerHour = request.RentPricePerHour ?? car.RentPricePerHour;
        car.RentPricePerDay = request.RentPricePerDay ?? car.RentPricePerDay;
        car.SalePrice = request.SalePrice ?? car.SalePrice;
        car.AccidentsCount = request.AccidentsCount ?? car.AccidentsCount;
        car.OwnersCount = request.OwnersCount ?? car.OwnersCount;
        car.ServiceHistory = request.ServiceHistory ?? car.ServiceHistory;
        car.Description = request.Description ?? car.Description;
        car.OptionGroups = request.OptionsGroups?.Select(o => new OptionGroup { Title = o.Title, Items = o.Items.ToList() }).ToList()
            ?? car.OptionGroups;
        car.Fees = request.Fees ?? car.Fees;
        car.Taxes = request.Taxes ?? car.Taxes;
        car.Rating = request.Rating ?? car.Rating;
        car.ReviewsCount = request.ReviewsCount ?? car.ReviewsCount;
        car.DistanceMeters = request.DistanceMeters ?? car.DistanceMeters;
        car.DistanceText = request.DistanceText ?? car.DistanceText;
        car.AvailableNow = request.AvailableNow ?? car.AvailableNow;
        car.CoverImageId = request.CoverImageId ?? car.CoverImageId;
        car.AvailableIn = request.AvailableIn ?? car.AvailableIn;

        if (request.Location is not null)
        {
            car.Location = new CarLocation
            {
                City = request.Location.City,
                FullAddress = request.Location.FullAddress,
                MapLabel = request.Location.MapLabel,
                Latitude = request.Location.Lat,
                Longitude = request.Location.Lng
            };
        }

        if (request.ImageIds is not null)
        {
            var images = request.ImageIds.Select((blobName, idx) => new CarImage
            {
                Id = Guid.NewGuid(), // Generate new Guid for the CarImage entity
                CarId = car.Id,
                BlobName = blobName, // Use the blob name directly (includes extension)
                IsCover = request.CoverImageId == blobName || (request.CoverImageId == null && idx == 0),
                SortOrder = idx
            }).ToList();

            car.Images = images;
        }

        if (request.ListingStatus is not null)
        {
            car.ListingStatus = request.ListingStatus.Value;
        }

        car.UpdatedAt = DateTime.UtcNow;
    }

    private static string ToReadableBodyStyle(this BodyStyle bodyStyle) => bodyStyle switch
    {
        BodyStyle.Suv => "SUV",
        BodyStyle.SportCoupe => "Sport coupe",
        _ => bodyStyle.ToString()
    };

    private static string ToReadableFuelType(this FuelType fuel) => fuel.ToString();
    private static string ToReadableTransmission(this Transmission transmission) => transmission.ToString();

    private static string ToReadableListingStatus(this ListingStatus status) => status switch
    {
        ListingStatus.Active => "active",
        ListingStatus.Inactive => "inactive",
        ListingStatus.Sold => "sold",
        ListingStatus.Deleted => "deleted",
        _ => status.ToString().ToLowerInvariant()
    };

    private static string ToReadableProfileType(this OwnerProfileType profileType) => profileType switch
    {
        OwnerProfileType.Rent => "rent",
        OwnerProfileType.Buy => "buy",
        _ => profileType.ToString().ToLowerInvariant()
    };
}
