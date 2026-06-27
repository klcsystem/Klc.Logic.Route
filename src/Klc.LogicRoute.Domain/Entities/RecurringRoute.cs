using Klc.LogicRoute.Domain.Common;

namespace Klc.LogicRoute.Domain.Entities;

public class RecurringRoute : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Schedule { get; set; } = "Daily"; // Daily, Weekly, Monthly
    public string? DaysOfWeek { get; set; } // comma-separated: "Monday,Wednesday,Friday"
    public bool IsActive { get; set; } = true;
    public Guid? SourceOptimizationId { get; set; }
    public DateTime? LastActivatedAt { get; set; }
    public int ActivationCount { get; set; }

    public List<RecurringRouteStop> Stops { get; set; } = [];
}
