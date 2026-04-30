using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IVehicleRepository
{
    Task<List<Vehicle>> GetAllAsync(Guid tenantId, Guid? providerId = null);
    Task<Vehicle?> GetByIdAsync(Guid id);
    Task<Guid> InsertAsync(Vehicle vehicle);
    Task UpdateAsync(Vehicle vehicle);
    Task DeleteAsync(Guid id);
}
