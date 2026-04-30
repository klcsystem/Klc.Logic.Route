using Klc.LogicRoute.Domain.Entities;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IContractRepository
{
    Task<Contract?> GetByIdAsync(Guid id, Guid tenantId);
    Task<IEnumerable<Contract>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 50);
    Task<int> GetCountAsync(Guid tenantId);
    Task<Guid> InsertAsync(Contract contract);
    Task UpdateAsync(Contract contract);
    Task DeleteAsync(Guid id, Guid tenantId);
    Task<IEnumerable<ContractRate>> GetRatesAsync(Guid contractId);
    Task InsertRateAsync(ContractRate rate);
    Task UpdateRateAsync(ContractRate rate);
    Task DeleteRateAsync(Guid rateId);
    Task DeleteRatesByContractAsync(Guid contractId);
}
