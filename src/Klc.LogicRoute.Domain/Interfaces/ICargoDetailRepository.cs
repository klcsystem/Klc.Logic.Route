using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface ICargoDetailRepository
{
    Task<CargoDetail?> GetByOrderIdAsync(Guid orderId, Guid tenantId);
    Task InsertAsync(CargoDetail cargoDetail);
    Task UpdateAsync(CargoDetail cargoDetail);
}
