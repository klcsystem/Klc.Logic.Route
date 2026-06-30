using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class CarrierNetworkRepository(IPostgresConnectionFactory connectionFactory) : ICarrierNetworkRepository
{
    public async Task<CarrierNetwork?> GetByIdAsync(Guid id)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<CarrierNetwork>(
            "SELECT * FROM logistics.carrier_networks WHERE id = @Id AND is_deleted = FALSE",
            new { Id = id });
    }

    public async Task<IEnumerable<CarrierNetwork>> GetByTenantAsync(Guid tenantId, int page = 1, int pageSize = 50)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var offset = (page - 1) * pageSize;
        return await conn.QueryAsync<CarrierNetwork>(
            @"SELECT * FROM logistics.carrier_networks
              WHERE tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY carrier_name ASC LIMIT @PageSize OFFSET @Offset",
            new { TenantId = tenantId, PageSize = pageSize, Offset = offset });
    }

    public async Task<IEnumerable<CarrierNetwork>> GetActiveByRegionAsync(Guid tenantId, string region)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<CarrierNetwork>(
            @"SELECT * FROM logistics.carrier_networks
              WHERE tenant_id = @TenantId AND is_active = TRUE AND is_deleted = FALSE
              AND (supported_regions IS NULL OR supported_regions ILIKE '%' || @Region || '%')
              ORDER BY carrier_name ASC",
            new { TenantId = tenantId, Region = region });
    }

    public async Task<Guid> InsertAsync(CarrierNetwork c)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.carrier_networks
              (id, tenant_id, carrier_name, api_endpoint, api_key, supported_regions,
               vehicle_types, pricing_model, is_active, created_by, created_at)
              VALUES (@Id, @TenantId, @CarrierName, @ApiEndpoint, @ApiKey, @SupportedRegions,
               @VehicleTypes, @PricingModel, @IsActive, @CreatedBy, @CreatedAt)",
            new
            {
                c.Id, c.TenantId, c.CarrierName, c.ApiEndpoint, c.ApiKey,
                c.SupportedRegions, c.VehicleTypes, PricingModel = (int)c.PricingModel,
                c.IsActive, c.CreatedBy, c.CreatedAt
            });
        return c.Id;
    }

    public async Task UpdateAsync(CarrierNetwork c)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.carrier_networks SET
              carrier_name = @CarrierName, api_endpoint = @ApiEndpoint, api_key = @ApiKey,
              supported_regions = @SupportedRegions, vehicle_types = @VehicleTypes,
              pricing_model = @PricingModel, is_active = @IsActive,
              updated_by = @UpdatedBy, updated_at = @Now
              WHERE id = @Id",
            new
            {
                c.Id, c.CarrierName, c.ApiEndpoint, c.ApiKey,
                c.SupportedRegions, c.VehicleTypes, PricingModel = (int)c.PricingModel,
                c.IsActive, c.UpdatedBy, Now = DateTime.UtcNow
            });
    }

    public async Task DeleteAsync(Guid id)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.carrier_networks SET is_deleted = TRUE, updated_at = @Now WHERE id = @Id",
            new { Id = id, Now = DateTime.UtcNow });
    }
}
