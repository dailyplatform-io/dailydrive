namespace Ride.Api.Models.Dto;

public record CarLocationDto(string City, string FullAddress, string? MapLabel, double? Lat, double? Lng);
