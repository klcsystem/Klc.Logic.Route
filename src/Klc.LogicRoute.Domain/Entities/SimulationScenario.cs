using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class SimulationScenario : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? BaseSnapshot { get; set; } // JSON
    public string? Modifications { get; set; } // JSON
    public string Status { get; set; } = "Draft"; // Draft, Running, Completed, Failed
}
