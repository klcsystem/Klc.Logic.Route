using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class ShipmentRepository(IPostgresConnectionFactory connectionFactory) : IShipmentRepository
{
    public async Task<Shipment?> GetByIdAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var shipment = await conn.QueryFirstOrDefaultAsync<Shipment>(
            "SELECT * FROM logistics.shipments WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = FALSE",
            new { Id = id, TenantId = tenantId });
        if (shipment != null)
            shipment.Items = (await GetItemsAsync(shipment.Id)).ToList();
        return shipment;
    }

    public async Task<IEnumerable<Shipment>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 50)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var offset = (page - 1) * pageSize;
        return await conn.QueryAsync<Shipment>(
            "SELECT * FROM logistics.shipments WHERE tenant_id = @TenantId AND is_deleted = FALSE ORDER BY created_at DESC LIMIT @PageSize OFFSET @Offset",
            new { TenantId = tenantId, PageSize = pageSize, Offset = offset });
    }

    public async Task<int> GetCountAsync(Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM logistics.shipments WHERE tenant_id = @TenantId AND is_deleted = FALSE",
            new { TenantId = tenantId });
    }

    public async Task<Guid> InsertAsync(Shipment s)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.shipments (id, tenant_id, shipment_number, order_id,
              origin_address, origin_city, destination_address, destination_city,
              status, priority, requested_pickup_date, requested_delivery_date,
              total_weight_kg, total_volume_m3, total_desi_weight, chargeable_weight,
              pallet_count, is_hazardous, requires_cold_chain, temperature_min, temperature_max, is_stackable,
              selected_provider_id, selected_contract_rate_id, recommended_vehicle, calculated_price, currency,
              provider_reference_id, driver_name, driver_phone, vehicle_plate, notes, created_by, created_at)
              VALUES (@Id, @TenantId, @ShipmentNumber, @OrderId,
              @OriginAddress, @OriginCity, @DestinationAddress, @DestinationCity,
              @Status, @Priority, @RequestedPickupDate, @RequestedDeliveryDate,
              @TotalWeightKg, @TotalVolumeM3, @TotalDesiWeight, @ChargeableWeight,
              @PalletCount, @IsHazardous, @RequiresColdChain, @TemperatureMin, @TemperatureMax, @IsStackable,
              @SelectedProviderId, @SelectedContractRateId, @RecommendedVehicle, @CalculatedPrice, @Currency,
              @ProviderReferenceId, @DriverName, @DriverPhone, @VehiclePlate, @Notes, @CreatedBy, @CreatedAt)",
            new {
                s.Id, s.TenantId, s.ShipmentNumber, s.OrderId,
                s.OriginAddress, s.OriginCity, s.DestinationAddress, s.DestinationCity,
                Status = (int)s.Status, Priority = (int)s.Priority, s.RequestedPickupDate, s.RequestedDeliveryDate,
                s.TotalWeightKg, s.TotalVolumeM3, s.TotalDesiWeight, s.ChargeableWeight,
                s.PalletCount, s.IsHazardous, s.RequiresColdChain, s.TemperatureMin, s.TemperatureMax, s.IsStackable,
                s.SelectedProviderId, s.SelectedContractRateId, RecommendedVehicle = (int)s.RecommendedVehicle,
                s.CalculatedPrice, s.Currency, s.ProviderReferenceId,
                s.DriverName, s.DriverPhone, s.VehiclePlate, s.Notes, s.CreatedBy, s.CreatedAt
            });
        return s.Id;
    }

    public async Task UpdateAsync(Shipment s)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.shipments SET status = @Status, priority = @Priority,
              selected_provider_id = @SelectedProviderId, selected_contract_rate_id = @SelectedContractRateId,
              recommended_vehicle = @RecommendedVehicle, calculated_price = @CalculatedPrice,
              provider_reference_id = @ProviderReferenceId,
              actual_pickup_date = @ActualPickupDate, actual_delivery_date = @ActualDeliveryDate,
              current_latitude = @CurrentLatitude, current_longitude = @CurrentLongitude,
              last_tracking_update = @LastTrackingUpdate, estimated_arrival = @EstimatedArrival,
              driver_name = @DriverName, driver_phone = @DriverPhone, vehicle_plate = @VehiclePlate,
              notes = @Notes, updated_by = @UpdatedBy, updated_at = @Now
              WHERE id = @Id AND tenant_id = @TenantId",
            new {
                s.Id, s.TenantId, Status = (int)s.Status, Priority = (int)s.Priority,
                s.SelectedProviderId, s.SelectedContractRateId, RecommendedVehicle = (int)s.RecommendedVehicle,
                s.CalculatedPrice, s.ProviderReferenceId,
                s.ActualPickupDate, s.ActualDeliveryDate,
                s.CurrentLatitude, s.CurrentLongitude, s.LastTrackingUpdate, s.EstimatedArrival,
                s.DriverName, s.DriverPhone, s.VehiclePlate, s.Notes, s.UpdatedBy, Now = DateTime.UtcNow
            });
    }

    public async Task UpdateStatusAsync(Guid id, Guid tenantId, int status)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.shipments SET status = @Status, updated_at = @Now WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId, Status = status, Now = DateTime.UtcNow });
    }

    public async Task DeleteAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.shipments SET is_deleted = TRUE, updated_at = @Now WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId, Now = DateTime.UtcNow });
    }

    public async Task<IEnumerable<ShipmentItem>> GetItemsAsync(Guid shipmentId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<ShipmentItem>(
            "SELECT * FROM logistics.shipment_items WHERE shipment_id = @ShipmentId AND is_deleted = FALSE",
            new { ShipmentId = shipmentId });
    }

    public async Task InsertItemAsync(ShipmentItem item)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.shipment_items (id, tenant_id, shipment_id, order_line_id,
              product_code, product_name, quantity, weight_kg, volume_m3,
              width_cm, height_cm, depth_cm, desi_weight, created_by, created_at)
              VALUES (@Id, @TenantId, @ShipmentId, @OrderLineId,
              @ProductCode, @ProductName, @Quantity, @WeightKg, @VolumeM3,
              @WidthCm, @HeightCm, @DepthCm, @DesiWeight, @CreatedBy, @CreatedAt)",
            new { item.Id, item.TenantId, item.ShipmentId, item.OrderLineId,
                item.ProductCode, item.ProductName, item.Quantity, item.WeightKg, item.VolumeM3,
                item.WidthCm, item.HeightCm, item.DepthCm, item.DesiWeight,
                item.CreatedBy, item.CreatedAt });
    }

    public async Task DeleteItemsAsync(Guid shipmentId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync("DELETE FROM logistics.shipment_items WHERE shipment_id = @ShipmentId",
            new { ShipmentId = shipmentId });
    }

    public async Task<IEnumerable<Shipment>> GetByIdsAsync(IEnumerable<Guid> ids, Guid tenantId)
    {
        var idArray = ids.ToArray();
        if (idArray.Length == 0)
            return [];

        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<Shipment>(
            @"SELECT * FROM logistics.shipments
              WHERE id = ANY(@Ids) AND tenant_id = @TenantId AND is_deleted = FALSE",
            new { Ids = idArray, TenantId = tenantId });
    }
}
