using Klc.LogicRoute.Domain.Common;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Entities;

public class Location : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public LocationType LocationType { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool IsActive { get; set; } = true;
    public int? Capacity { get; set; }
    public string? WorkingHours { get; set; }
    public string? ContactName { get; set; }
    public string? ContactPhone { get; set; }
}
