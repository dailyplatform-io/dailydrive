namespace Ride.Api.Models.Dto;

public record OptionGroupDto(string Title, IReadOnlyCollection<string> Items);
