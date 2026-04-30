using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class CargoDetailRepository(IPostgresConnectionFactory connectionFactory) : ICargoDetailRepository
{
    public async Task<CargoDetail?> GetByOrderIdAsync(Guid orderId, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<CargoDetail>(
            "SELECT * FROM logistics.cargo_details WHERE order_id = @OrderId AND tenant_id = @TenantId",
            new { OrderId = orderId, TenantId = tenantId });
    }

    public async Task InsertAsync(CargoDetail detail)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.cargo_details (id, tenant_id, order_id, actual_weight_kg, volumetric_weight_kg,
              chargeable_weight_kg, total_volume_m3, total_pallets, total_desi,
              suggested_vehicle, suggested_load_type, is_hazardous, requires_cold_chain,
              calculation_notes, calculated_at, created_by, created_at)
              VALUES (@Id, @TenantId, @OrderId, @ActualWeightKg, @VolumetricWeightKg,
              @ChargeableWeightKg, @TotalVolumeM3, @TotalPallets, @TotalDesi,
              @SuggestedVehicle, @SuggestedLoadType, @IsHazardous, @RequiresColdChain,
              @CalculationNotes, @CalculatedAt, @CreatedBy, @CreatedAt)",
            new { detail.Id, detail.TenantId, detail.OrderId, detail.ActualWeightKg, detail.VolumetricWeightKg,
                detail.ChargeableWeightKg, detail.TotalVolumeM3, detail.TotalPallets, detail.TotalDesi,
                SuggestedVehicle = (int)detail.SuggestedVehicle, SuggestedLoadType = (int)detail.SuggestedLoadType,
                detail.IsHazardous, detail.RequiresColdChain, detail.CalculationNotes, detail.CalculatedAt,
                detail.CreatedBy, detail.CreatedAt });
    }

    public async Task UpdateAsync(CargoDetail detail)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.cargo_details SET actual_weight_kg = @ActualWeightKg, volumetric_weight_kg = @VolumetricWeightKg,
              chargeable_weight_kg = @ChargeableWeightKg, total_volume_m3 = @TotalVolumeM3, total_pallets = @TotalPallets,
              total_desi = @TotalDesi, suggested_vehicle = @SuggestedVehicle, suggested_load_type = @SuggestedLoadType,
              is_hazardous = @IsHazardous, requires_cold_chain = @RequiresColdChain,
              calculation_notes = @CalculationNotes, calculated_at = @CalculatedAt
              WHERE order_id = @OrderId AND tenant_id = @TenantId",
            new { detail.OrderId, detail.TenantId, detail.ActualWeightKg, detail.VolumetricWeightKg,
                detail.ChargeableWeightKg, detail.TotalVolumeM3, detail.TotalPallets, detail.TotalDesi,
                SuggestedVehicle = (int)detail.SuggestedVehicle, SuggestedLoadType = (int)detail.SuggestedLoadType,
                detail.IsHazardous, detail.RequiresColdChain, detail.CalculationNotes, detail.CalculatedAt });
    }
}
