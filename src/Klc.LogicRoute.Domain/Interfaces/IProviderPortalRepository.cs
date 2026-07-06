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

    // Frontend providerId gondermez; verilmezse tenant'in ilk saglayicisi kullanilir.
    Task<Guid> ResolveProviderIdAsync(Guid tenantId, Guid providerId);

    // Tarife (arac-tipi + KM-araligi bazli)
    Task<IEnumerable<ProviderTariffRow>> GetTariffAsync(Guid tenantId, Guid providerId, string vehicleType);
    Task SaveTariffAsync(Guid tenantId, Guid providerId, string vehicleType, IEnumerable<ProviderTariffRow> rows, string? userId);

    // Portal kullanicilari (CRUD)
    Task<IEnumerable<ProviderUser>> GetUsersAsync(Guid tenantId, Guid providerId);
    Task<ProviderUser> CreateUserAsync(Guid tenantId, Guid providerId, string name, string email, string role, bool active, string? userId);
    Task<ProviderUser?> UpdateUserAsync(Guid tenantId, Guid id, string name, string email, string role, bool active, string? userId);
    Task DeleteUserAsync(Guid tenantId, Guid id, string? userId);
}

// JSON: id, kmFrom, kmTo, price (frontend providerPortal.ts -> TariffRow).
public record ProviderTariffRow(Guid Id, int KmFrom, int KmTo, decimal Price);

// JSON: id, name, email, role, active (frontend providerPortal.ts -> PortalUser).
public record ProviderUser(Guid Id, string Name, string Email, string Role, bool Active);

public class ProviderPortalStats
{
    public int TotalOrders { get; set; }
    public int ActiveShipments { get; set; }
    public int TotalVehicles { get; set; }
    public int TotalDrivers { get; set; }
    public int CompletedShipments { get; set; }
    public int PendingOrders { get; set; }
}
