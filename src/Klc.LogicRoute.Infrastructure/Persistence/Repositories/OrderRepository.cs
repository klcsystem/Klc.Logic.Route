using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class OrderRepository(IPostgresConnectionFactory connectionFactory) : IOrderRepository
{
    public async Task<Order?> GetByIdAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var order = await conn.QueryFirstOrDefaultAsync<Order>(
            "SELECT * FROM logistics.orders WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = FALSE",
            new { Id = id, TenantId = tenantId });
        if (order != null)
            order.Lines = (await GetLinesAsync(order.Id)).ToList();
        return order;
    }

    public async Task<IEnumerable<Order>> GetAllAsync(Guid tenantId, int page = 1, int pageSize = 50)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var offset = (page - 1) * pageSize;
        return await conn.QueryAsync<Order>(
            "SELECT * FROM logistics.orders WHERE tenant_id = @TenantId AND is_deleted = FALSE ORDER BY created_at DESC LIMIT @PageSize OFFSET @Offset",
            new { TenantId = tenantId, PageSize = pageSize, Offset = offset });
    }

    public async Task<int> GetCountAsync(Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM logistics.orders WHERE tenant_id = @TenantId AND is_deleted = FALSE",
            new { TenantId = tenantId });
    }

    public async Task<Guid> InsertAsync(Order order)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.orders (id, tenant_id, order_number, erp_reference_id, erp_connection_id,
              customer_name, origin_address, origin_city, origin_lat, origin_lng,
              destination_address, destination_city, destination_lat, destination_lng,
              total_weight_kg, total_volume_m3, pallet_count, product_category,
              is_hazardous, requires_cold_chain, temperature_min, temperature_max,
              status, priority, requested_delivery_date,
              total_amount, currency, notes, contract_id, provider_id, created_by, created_at)
              VALUES (@Id, @TenantId, @OrderNumber, @ErpReferenceId, @ErpConnectionId,
              @CustomerName, @OriginAddress, @OriginCity, @OriginLat, @OriginLng,
              @DestinationAddress, @DestinationCity, @DestinationLat, @DestinationLng,
              @TotalWeightKg, @TotalVolumeM3, @PalletCount, @ProductCategory,
              @IsHazardous, @RequiresColdChain, @TemperatureMin, @TemperatureMax,
              @Status, @Priority, @RequestedDeliveryDate,
              @TotalAmount, @Currency, @Notes, @ContractId, @ProviderId, @CreatedBy, @CreatedAt)",
            new
            {
                order.Id, order.TenantId, order.OrderNumber, order.ErpReferenceId, order.ErpConnectionId,
                order.CustomerName, order.OriginAddress, order.OriginCity, order.OriginLat, order.OriginLng,
                order.DestinationAddress, order.DestinationCity, order.DestinationLat, order.DestinationLng,
                order.TotalWeightKg, order.TotalVolumeM3, order.PalletCount, order.ProductCategory,
                order.IsHazardous, order.RequiresColdChain, order.TemperatureMin, order.TemperatureMax,
                Status = (int)order.Status, Priority = (int)order.Priority, order.RequestedDeliveryDate,
                order.TotalAmount, order.Currency, order.Notes, order.ContractId, order.ProviderId,
                order.CreatedBy, order.CreatedAt
            });
        return order.Id;
    }

    public async Task UpdateAsync(Order order)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.orders SET order_number = @OrderNumber, erp_reference_id = @ErpReferenceId,
              customer_name = @CustomerName, origin_address = @OriginAddress, origin_city = @OriginCity,
              origin_lat = @OriginLat, origin_lng = @OriginLng,
              destination_address = @DestinationAddress, destination_city = @DestinationCity,
              destination_lat = @DestinationLat, destination_lng = @DestinationLng,
              total_weight_kg = @TotalWeightKg, total_volume_m3 = @TotalVolumeM3, pallet_count = @PalletCount,
              product_category = @ProductCategory, is_hazardous = @IsHazardous,
              requires_cold_chain = @RequiresColdChain, temperature_min = @TemperatureMin, temperature_max = @TemperatureMax,
              status = @Status, priority = @Priority, requested_delivery_date = @RequestedDeliveryDate,
              total_amount = @TotalAmount, currency = @Currency, notes = @Notes,
              contract_id = @ContractId, provider_id = @ProviderId,
              updated_by = @UpdatedBy, updated_at = @Now
              WHERE id = @Id AND tenant_id = @TenantId",
            new
            {
                order.Id, order.TenantId, order.OrderNumber, order.ErpReferenceId,
                order.CustomerName, order.OriginAddress, order.OriginCity, order.OriginLat, order.OriginLng,
                order.DestinationAddress, order.DestinationCity, order.DestinationLat, order.DestinationLng,
                order.TotalWeightKg, order.TotalVolumeM3, order.PalletCount, order.ProductCategory,
                order.IsHazardous, order.RequiresColdChain, order.TemperatureMin, order.TemperatureMax,
                Status = (int)order.Status, Priority = (int)order.Priority, order.RequestedDeliveryDate,
                order.TotalAmount, order.Currency, order.Notes, order.ContractId, order.ProviderId,
                order.UpdatedBy, Now = DateTime.UtcNow
            });
    }

    public async Task UpdateStatusAsync(Guid id, Guid tenantId, int status)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.orders SET status = @Status, updated_at = @Now WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId, Status = status, Now = DateTime.UtcNow });
    }

    public async Task DeleteAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "UPDATE logistics.orders SET is_deleted = TRUE, updated_at = @Now WHERE id = @Id AND tenant_id = @TenantId",
            new { Id = id, TenantId = tenantId, Now = DateTime.UtcNow });
    }

    public async Task<IEnumerable<OrderLine>> GetLinesAsync(Guid orderId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<OrderLine>(
            "SELECT * FROM logistics.order_lines WHERE order_id = @OrderId AND is_deleted = FALSE ORDER BY line_number",
            new { OrderId = orderId });
    }

    public async Task InsertLineAsync(OrderLine line)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.order_lines (id, tenant_id, order_id, line_number, product_code, product_name,
              quantity, unit, weight_kg, volume_m3, width_cm, height_cm, depth_cm, desi_weight,
              is_stackable, notes, created_by, created_at)
              VALUES (@Id, @TenantId, @OrderId, @LineNumber, @ProductCode, @ProductName,
              @Quantity, @Unit, @WeightKg, @VolumeM3, @WidthCm, @HeightCm, @DepthCm, @DesiWeight,
              @IsStackable, @Notes, @CreatedBy, @CreatedAt)",
            new
            {
                line.Id, line.TenantId, line.OrderId, line.LineNumber, line.ProductCode, line.ProductName,
                line.Quantity, line.Unit, line.WeightKg, line.VolumeM3,
                line.WidthCm, line.HeightCm, line.DepthCm, line.DesiWeight,
                line.IsStackable, line.Notes, line.CreatedBy, line.CreatedAt
            });
    }

    public async Task DeleteLinesAsync(Guid orderId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            "DELETE FROM logistics.order_lines WHERE order_id = @OrderId", new { OrderId = orderId });
    }
}
