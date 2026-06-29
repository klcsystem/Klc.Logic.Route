using Klc.LogicRoute.Application.Sustainability.Models;

namespace Klc.LogicRoute.Application.Sustainability;

public interface ICarbonCreditService
{
    Task<CarbonReport> GetCarbonReportAsync(Guid tenantId, string period, int year, int? month);
    Task<EsgReport> GetEsgReportAsync(Guid tenantId, int year);
    Task<SavingsSummary> GetSavingsSummaryAsync(Guid tenantId);
}
