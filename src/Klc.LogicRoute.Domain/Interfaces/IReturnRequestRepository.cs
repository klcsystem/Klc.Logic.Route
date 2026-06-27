using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IReturnRequestRepository
{
    Task<List<ReturnRequest>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 50);
    Task<ReturnRequest?> GetByIdAsync(Guid id, Guid tenantId);
    Task<Guid> InsertAsync(ReturnRequest returnRequest);
    Task UpdateStatusAsync(Guid id, Guid tenantId, string status, DateTime? receivedAt = null);
    Task DeleteAsync(Guid id, Guid tenantId);
}
