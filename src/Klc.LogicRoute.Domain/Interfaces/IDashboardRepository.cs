namespace Klc.LogicRoute.Domain.Interfaces;

public interface IDashboardRepository
{
    Task<int> GetOrderCountAsync(Guid tenantId, int? status = null);
    Task<int> GetShipmentCountAsync(Guid tenantId, int? status = null);
    Task<int> GetProviderCountAsync(Guid tenantId);
    Task<int> GetActiveContractCountAsync(Guid tenantId);
    Task<decimal> GetTotalShipmentCostAsync(Guid tenantId, int? year = null, int? month = null);
    Task<decimal> GetAverageDeliveryHoursAsync(Guid tenantId, int? year = null, int? month = null);
    Task<IEnumerable<MonthlyCostSummary>> GetMonthlyCostsAsync(Guid tenantId, int year);
    Task<IEnumerable<ProviderCostSummary>> GetProviderCostsAsync(Guid tenantId, int? year = null, int? month = null);
}

public record MonthlyCostSummary(int Month, decimal TotalCost, int ShipmentCount);
public record ProviderCostSummary(Guid ProviderId, string ProviderName, decimal TotalCost, int ShipmentCount);
