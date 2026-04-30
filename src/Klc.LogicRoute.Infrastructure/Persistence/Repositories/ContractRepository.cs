using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class ContractRepository(IPostgresConnectionFactory connectionFactory) : IContractRepository
{
    public async Task<Contract?> GetByIdAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var contract = await conn.QueryFirstOrDefaultAsync<Contract>(
            "SELECT * FROM logistics.contracts WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = FALSE",
            new { Id = id, TenantId = tenantId });
        if (contract != null)
            contract.Rates = (await GetRatesAsync(contract.Id)).ToList();
        return contract;
    }

    public async Task<IEnumerable<Contract>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 50)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var offset = (page - 1) * pageSize;
        return await conn.QueryAsync<Contract>(
            "SELECT * FROM logistics.contracts WHERE tenant_id = @TenantId AND is_deleted = FALSE ORDER BY created_at DESC LIMIT @PageSize OFFSET @Offset",
            new { TenantId = tenantId, PageSize = pageSize, Offset = offset });
    }

    public async Task<int> GetCountAsync(Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM logistics.contracts WHERE tenant_id = @TenantId AND is_deleted = FALSE",
            new { TenantId = tenantId });
    }

    public async Task<Guid> InsertAsync(Contract contract)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.contracts (id, tenant_id, provider_id, contract_number, name,
              start_date, end_date, status, notes, currency, created_by, created_at)
              VALUES (@Id, @TenantId, @ProviderId, @ContractNumber, @Name,
              @StartDate, @EndDate, @Status, @Notes, @Currency, @CreatedBy, @CreatedAt)",
            new { contract.Id, contract.TenantId, contract.ProviderId, contract.ContractNumber, contract.Name,
                contract.StartDate, contract.EndDate, Status = (int)contract.Status,
                contract.Notes, contract.Currency, contract.CreatedBy, contract.CreatedAt });
        return contract.Id;
    }

    public async Task UpdateAsync(Contract contract)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.contracts SET provider_id = @ProviderId, contract_number = @ContractNumber,
              name = @Name, start_date = @StartDate, end_date = @EndDate, status = @Status,
              notes = @Notes, currency = @Currency, updated_by = @UpdatedBy, updated_at = @Now
              WHERE id = @Id AND tenant_id = @TenantId",
            new { contract.Id, contract.TenantId, contract.ProviderId, contract.ContractNumber, contract.Name,
                contract.StartDate, contract.EndDate, Status = (int)contract.Status,
                contract.Notes, contract.Currency, contract.UpdatedBy, Now = DateTime.UtcNow });
    }

    public async Task DeleteAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.contracts SET is_deleted = TRUE, updated_at = @Now WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId, Now = DateTime.UtcNow });
    }

    public async Task<IEnumerable<ContractRate>> GetRatesAsync(Guid contractId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<ContractRate>(
            "SELECT * FROM logistics.contract_rates WHERE contract_id = @ContractId AND is_deleted = FALSE",
            new { ContractId = contractId });
    }

    public async Task InsertRateAsync(ContractRate rate)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.contract_rates (id, tenant_id, contract_id, origin_region, destination_region,
              vehicle_category, min_weight_kg, max_weight_kg, price_per_unit, pricing_unit, currency,
              urgent_surcharge_percent, adr_surcharge_percent, frigo_surcharge_percent, weekend_surcharge_percent,
              is_active, created_by, created_at)
              VALUES (@Id, @TenantId, @ContractId, @OriginRegion, @DestinationRegion,
              @VehicleCategory, @MinWeightKg, @MaxWeightKg, @PricePerUnit, @PricingUnit, @Currency,
              @UrgentSurchargePercent, @AdrSurchargePercent, @FrigoSurchargePercent, @WeekendSurchargePercent,
              @IsActive, @CreatedBy, @CreatedAt)",
            new { rate.Id, rate.TenantId, rate.ContractId, rate.OriginRegion, rate.DestinationRegion,
                VehicleCategory = (int)rate.VehicleCategory, rate.MinWeightKg, rate.MaxWeightKg,
                rate.PricePerUnit, PricingUnit = (int)rate.PricingUnit, rate.Currency,
                rate.UrgentSurchargePercent, rate.AdrSurchargePercent, rate.FrigoSurchargePercent,
                rate.WeekendSurchargePercent, rate.IsActive, rate.CreatedBy, rate.CreatedAt });
    }

    public async Task UpdateRateAsync(ContractRate rate)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.contract_rates SET origin_region = @OriginRegion, destination_region = @DestinationRegion,
              vehicle_category = @VehicleCategory, min_weight_kg = @MinWeightKg, max_weight_kg = @MaxWeightKg,
              price_per_unit = @PricePerUnit, pricing_unit = @PricingUnit, currency = @Currency,
              urgent_surcharge_percent = @UrgentSurchargePercent, adr_surcharge_percent = @AdrSurchargePercent,
              frigo_surcharge_percent = @FrigoSurchargePercent, weekend_surcharge_percent = @WeekendSurchargePercent,
              is_active = @IsActive, updated_at = @Now
              WHERE id = @Id",
            new { rate.Id, rate.OriginRegion, rate.DestinationRegion,
                VehicleCategory = (int)rate.VehicleCategory, rate.MinWeightKg, rate.MaxWeightKg,
                rate.PricePerUnit, PricingUnit = (int)rate.PricingUnit, rate.Currency,
                rate.UrgentSurchargePercent, rate.AdrSurchargePercent, rate.FrigoSurchargePercent,
                rate.WeekendSurchargePercent, rate.IsActive, Now = DateTime.UtcNow });
    }

    public async Task DeleteRateAsync(Guid rateId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.contract_rates SET is_deleted = TRUE, updated_at = @Now WHERE id = @Id",
            new { Id = rateId, Now = DateTime.UtcNow });
    }

    public async Task DeleteRatesByContractAsync(Guid contractId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.contract_rates SET is_deleted = TRUE, updated_at = @Now WHERE contract_id = @ContractId",
            new { ContractId = contractId, Now = DateTime.UtcNow });
    }
}
