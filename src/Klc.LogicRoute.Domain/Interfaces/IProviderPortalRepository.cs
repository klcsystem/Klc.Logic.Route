using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IProviderPortalRepository
{
    Task<IEnumerable<Order>> GetOrdersByProviderAsync(Guid tenantId, Guid providerId, int page = 1, int pageSize = 50);
    Task<int> GetOrderCountByProviderAsync(Guid tenantId, Guid providerId);
    Task<IEnumerable<Vehicle>> GetVehiclesByProviderAsync(Guid tenantId, Guid providerId);
    Task<IEnumerable<Driver>> GetDriversByProviderAsync(Guid tenantId, Guid providerId);
    Task<IEnumerable<Shipment>> GetShipmentsByProviderAsync(Guid tenantId, Guid providerId, int page = 1, int pageSize = 50);
    Task<int> GetShipmentCountByProviderAsync(Guid tenantId, Guid providerId);
    Task<ProviderPortalStats> GetStatsAsync(Guid tenantId, Guid providerId);
}

public class ProviderPortalStats
{
    public int TotalOrders { get; set; }
    public int ActiveShipments { get; set; }
    public int TotalVehicles { get; set; }
    public int TotalDrivers { get; set; }
    public int CompletedShipments { get; set; }
    public int PendingOrders { get; set; }
}
