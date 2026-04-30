using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class RoutingRuleRepository(IPostgresConnectionFactory connectionFactory) : IRoutingRuleRepository
{
    public async Task<IEnumerable<RoutingRule>> GetAllAsync(Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<RoutingRule>(
            "SELECT * FROM logistics.routing_rules WHERE tenant_id = @TenantId AND is_deleted = FALSE ORDER BY priority",
            new { TenantId = tenantId });
    }

    public async Task<RoutingRule?> GetByIdAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<RoutingRule>(
            "SELECT * FROM logistics.routing_rules WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = FALSE",
            new { Id = id, TenantId = tenantId });
    }

    public async Task<Guid> InsertAsync(RoutingRule rule)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.routing_rules (id, tenant_id, name, description, priority, is_active,
              origin_region, destination_region, vehicle_category, min_weight_kg, max_weight_kg,
              is_hazardous, requires_cold_chain, preferred_provider_id, preferred_contract_id,
              action, notes, created_by, created_at)
              VALUES (@Id, @TenantId, @Name, @Description, @Priority, @IsActive,
              @OriginRegion, @DestinationRegion, @VehicleCategory, @MinWeightKg, @MaxWeightKg,
              @IsHazardous, @RequiresColdChain, @PreferredProviderId, @PreferredContractId,
              @Action, @Notes, @CreatedBy, @CreatedAt)",
            new { rule.Id, rule.TenantId, rule.Name, rule.Description, rule.Priority, rule.IsActive,
                rule.OriginRegion, rule.DestinationRegion,
                VehicleCategory = rule.VehicleCategory.HasValue ? (int?)rule.VehicleCategory.Value : null,
                rule.MinWeightKg, rule.MaxWeightKg, rule.IsHazardous, rule.RequiresColdChain,
                rule.PreferredProviderId, rule.PreferredContractId, rule.Action, rule.Notes,
                rule.CreatedBy, rule.CreatedAt });
        return rule.Id;
    }

    public async Task UpdateAsync(RoutingRule rule)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.routing_rules SET name = @Name, description = @Description, priority = @Priority,
              is_active = @IsActive, origin_region = @OriginRegion, destination_region = @DestinationRegion,
              vehicle_category = @VehicleCategory, min_weight_kg = @MinWeightKg, max_weight_kg = @MaxWeightKg,
              is_hazardous = @IsHazardous, requires_cold_chain = @RequiresColdChain,
              preferred_provider_id = @PreferredProviderId, preferred_contract_id = @PreferredContractId,
              action = @Action, notes = @Notes, updated_by = @UpdatedBy, updated_at = @Now
              WHERE id = @Id AND tenant_id = @TenantId",
            new { rule.Id, rule.TenantId, rule.Name, rule.Description, rule.Priority, rule.IsActive,
                rule.OriginRegion, rule.DestinationRegion,
                VehicleCategory = rule.VehicleCategory.HasValue ? (int?)rule.VehicleCategory.Value : null,
                rule.MinWeightKg, rule.MaxWeightKg, rule.IsHazardous, rule.RequiresColdChain,
                rule.PreferredProviderId, rule.PreferredContractId, rule.Action, rule.Notes,
                rule.UpdatedBy, Now = DateTime.UtcNow });
    }

    public async Task DeleteAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.routing_rules SET is_deleted = TRUE, updated_at = @Now WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId, Now = DateTime.UtcNow });
    }
}
