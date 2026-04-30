using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, Guid tenantId);
    Task<User?> GetByEmailAsync(string email, Guid tenantId);
    Task<IEnumerable<User>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 50);
    Task<int> GetCountAsync(Guid tenantId);
    Task<Guid> InsertAsync(User user);
    Task UpdateAsync(User user);
    Task UpdateLastLoginAsync(Guid id, Guid tenantId);
    Task DeleteAsync(Guid id, Guid tenantId);
}
