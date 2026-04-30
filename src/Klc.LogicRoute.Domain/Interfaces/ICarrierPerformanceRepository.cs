using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface ICarrierPerformanceRepository
{
    Task<IEnumerable<CarrierPerformance>> GetAllAsync(Guid tenantId, int? year = null, int? month = null);
    Task<CarrierPerformance?> GetByProviderAsync(Guid providerId, Guid tenantId, int year, int month);
    Task InsertAsync(CarrierPerformance performance);
    Task UpdateAsync(CarrierPerformance performance);
}
