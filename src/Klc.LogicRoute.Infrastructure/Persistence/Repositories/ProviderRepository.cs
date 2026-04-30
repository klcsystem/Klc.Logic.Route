using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class ProviderRepository(IPostgresConnectionFactory connectionFactory) : IProviderRepository
{
    public async Task<Provider?> GetByIdAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<Provider>(
            "SELECT * FROM logistics.providers WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = FALSE",
            new { Id = id, TenantId = tenantId });
    }

    public async Task<IEnumerable<Provider>> GetAllAsync(Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<Provider>(
            "SELECT * FROM logistics.providers WHERE tenant_id = @TenantId AND is_deleted = FALSE ORDER BY name",
            new { TenantId = tenantId });
    }

    public async Task<Guid> InsertAsync(Provider provider)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.providers (id, tenant_id, name, code, type, api_base_url, api_key, api_secret,
              is_active, is_global, supported_vehicle_types, service_regions,
              tax_number, address, city, phone, email, contact_person, created_by, created_at)
              VALUES (@Id, @TenantId, @Name, @Code, @Type, @ApiBaseUrl, @ApiKey, @ApiSecret,
              @IsActive, @IsGlobal, @SupportedVehicleTypes, @ServiceRegions,
              @TaxNumber, @Address, @City, @Phone, @Email, @ContactPerson, @CreatedBy, @CreatedAt)",
            new { provider.Id, provider.TenantId, provider.Name, provider.Code,
                Type = (int)provider.Type, provider.ApiBaseUrl, provider.ApiKey, provider.ApiSecret,
                provider.IsActive, provider.IsGlobal, provider.SupportedVehicleTypes, provider.ServiceRegions,
                provider.TaxNumber, provider.Address, provider.City, provider.Phone, provider.Email,
                provider.ContactPerson, provider.CreatedBy, provider.CreatedAt });
        return provider.Id;
    }

    public async Task UpdateAsync(Provider provider)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.providers SET name = @Name, code = @Code, type = @Type,
              api_base_url = @ApiBaseUrl, api_key = @ApiKey, api_secret = @ApiSecret,
              is_active = @IsActive, is_global = @IsGlobal,
              supported_vehicle_types = @SupportedVehicleTypes, service_regions = @ServiceRegions,
              tax_number = @TaxNumber, address = @Address, city = @City, phone = @Phone,
              email = @Email, contact_person = @ContactPerson,
              updated_by = @UpdatedBy, updated_at = @Now
              WHERE id = @Id AND tenant_id = @TenantId",
            new { provider.Id, provider.TenantId, provider.Name, provider.Code,
                Type = (int)provider.Type, provider.ApiBaseUrl, provider.ApiKey, provider.ApiSecret,
                provider.IsActive, provider.IsGlobal, provider.SupportedVehicleTypes, provider.ServiceRegions,
                provider.TaxNumber, provider.Address, provider.City, provider.Phone, provider.Email,
                provider.ContactPerson, provider.UpdatedBy, Now = DateTime.UtcNow });
    }

    public async Task DeleteAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.providers SET is_deleted = TRUE, updated_at = @Now WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId, Now = DateTime.UtcNow });
    }
}
