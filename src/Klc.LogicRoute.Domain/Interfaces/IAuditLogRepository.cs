using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IAuditLogRepository
{
    Task<IEnumerable<AuditLog>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 50);
    Task<IEnumerable<AuditLog>> GetByEntityAsync(string entityType, Guid entityId, Guid tenantId);
    Task InsertAsync(AuditLog auditLog);
}
