using System.ComponentModel.DataAnnotations;

namespace Ride.Api.Data.Entities;

public class OptionGroup
{
    [MaxLength(80)]
    public string Title { get; set; } = string.Empty;

    public List<string> Items { get; set; } = new();
}
