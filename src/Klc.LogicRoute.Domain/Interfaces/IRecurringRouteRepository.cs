using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IRecurringRouteRepository
{
    Task<RecurringRoute?> GetByIdAsync(Guid id, Guid tenantId);
    Task<IEnumerable<RecurringRoute>> GetAllAsync(Guid tenantId, bool? activeOnly = null);
    Task<Guid> CreateAsync(RecurringRoute recurringRoute);
    Task CreateStopAsync(RecurringRouteStop stop);
    Task UpdateAsync(RecurringRoute recurringRoute);
    Task DeleteAsync(Guid id, Guid tenantId);
    Task<IEnumerable<RecurringRouteStop>> GetStopsByRecurringRouteIdAsync(Guid recurringRouteId, Guid tenantId);
}
