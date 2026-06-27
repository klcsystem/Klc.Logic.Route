using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IDriverLocationRepository
{
    Task CreateBatchAsync(IEnumerable<DriverLocation> locations);
    Task<DriverLocation?> GetLatestByDriverAsync(Guid driverId, Guid tenantId);
    Task<IEnumerable<DriverLocation>> GetByShipmentIdsAsync(IEnumerable<Guid> shipmentIds, Guid tenantId);
}
