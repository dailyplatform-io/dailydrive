namespace Ride.Api.Models.External;

public record GeoLookupResponse(string City, string Address, double? Latitude, double? Longitude);
