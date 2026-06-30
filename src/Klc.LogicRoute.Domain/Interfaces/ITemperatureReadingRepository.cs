using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface ITemperatureReadingRepository
{
    Task<TemperatureReading?> GetByIdAsync(Guid id);
    Task<IEnumerable<TemperatureReading>> GetByShipmentAsync(Guid shipmentId, int page = 1, int pageSize = 100);
    Task<IEnumerable<TemperatureReading>> GetAlarmsAsync(Guid tenantId, DateTime? since = null, int page = 1, int pageSize = 50);
    Task<Guid> InsertAsync(TemperatureReading reading);
    Task<(int TotalMonitored, int AlarmsToday, decimal AvgTemperature)> GetDashboardAsync(Guid tenantId);
}
