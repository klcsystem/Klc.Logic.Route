using Klc.LogicRoute.Application.Analytics.Models;

namespace Klc.LogicRoute.Application.Analytics;

public interface IDemandForecastService
{
    Task<DemandForecastResult> ForecastAsync(Guid tenantId, int days = 7);
    Task<IEnumerable<RegionDemand>> GetDemandByRegionAsync(Guid tenantId, int lookbackDays = 30);
}
