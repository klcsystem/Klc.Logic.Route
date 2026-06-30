using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IVehicleProfileRepository
{
    Task<List<VehicleProfile>> GetAllAsync(Guid tenantId);
    Task<VehicleProfile?> GetByIdAsync(Guid id);
    Task<Guid> InsertAsync(VehicleProfile profile);
    Task UpdateAsync(VehicleProfile profile);
    Task DeleteAsync(Guid id);
    Task AssignToVehiclesAsync(Guid profileId, List<Guid> vehicleIds);
}
