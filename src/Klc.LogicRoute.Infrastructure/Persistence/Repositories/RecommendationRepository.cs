using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class RecommendationRepository(IPostgresConnectionFactory connectionFactory) : IRecommendationRepository
{
    public async Task<IEnumerable<Recommendation>> GetByOrderIdAsync(Guid shipmentId, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<Recommendation>(
            "SELECT * FROM logistics.recommendations WHERE shipment_id = @ShipmentId AND tenant_id = @TenantId ORDER BY overall_score DESC",
            new { ShipmentId = shipmentId, TenantId = tenantId });
    }

    public async Task InsertAsync(Recommendation r)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.recommendations (id, tenant_id, shipment_id, selected_provider_id, selected_contract_rate_id,
              selected_provider_name, calculated_price,
              alternative_price_1, alternative_provider_id_1, alternative_provider_name_1,
              alternative_price_2, alternative_provider_id_2, alternative_provider_name_2,
              savings_amount, savings_percent, reason,
              score_price, score_speed, score_reliability, overall_score,
              recommended_vehicle, currency, explanation, calculated_at, created_by, created_at)
              VALUES (@Id, @TenantId, @ShipmentId, @SelectedProviderId, @SelectedContractRateId,
              @SelectedProviderName, @CalculatedPrice,
              @AlternativePrice1, @AlternativeProviderId1, @AlternativeProviderName1,
              @AlternativePrice2, @AlternativeProviderId2, @AlternativeProviderName2,
              @SavingsAmount, @SavingsPercent, @Reason,
              @ScorePrice, @ScoreSpeed, @ScoreReliability, @OverallScore,
              @RecommendedVehicle, @Currency, @Explanation, @CalculatedAt, @CreatedBy, @CreatedAt)",
            new {
                r.Id, r.TenantId, r.ShipmentId, r.SelectedProviderId, r.SelectedContractRateId,
                r.SelectedProviderName, r.CalculatedPrice,
                r.AlternativePrice1, r.AlternativeProviderId1, r.AlternativeProviderName1,
                r.AlternativePrice2, r.AlternativeProviderId2, r.AlternativeProviderName2,
                r.SavingsAmount, r.SavingsPercent, Reason = (int)r.Reason,
                r.ScorePrice, r.ScoreSpeed, r.ScoreReliability, r.OverallScore,
                RecommendedVehicle = (int)r.RecommendedVehicle, r.Currency, r.Explanation, r.CalculatedAt,
                r.CreatedBy, r.CreatedAt
            });
    }

    public async Task DeleteByOrderIdAsync(Guid shipmentId, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "DELETE FROM logistics.recommendations WHERE shipment_id = @ShipmentId AND tenant_id = @TenantId",
            new { ShipmentId = shipmentId, TenantId = tenantId });
    }

    public async Task SelectAsync(Guid recommendationId, Guid tenantId)
    {
        // No-op for new model — selection is done via shipment.SelectedProviderId
        await Task.CompletedTask;
    }
}
