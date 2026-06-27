using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class DeliveryFeedbackRepository(IPostgresConnectionFactory connectionFactory) : IDeliveryFeedbackRepository
{
    public async Task InsertAsync(DeliveryFeedback feedback)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.delivery_feedback
              (id, tenant_id, shipment_id, order_id, rating, comment, feedback_type,
               submitted_at, customer_name, customer_phone, driver_id, is_deleted, created_at)
              VALUES (@Id, @TenantId, @ShipmentId, @OrderId, @Rating, @Comment, @FeedbackType,
               @SubmittedAt, @CustomerName, @CustomerPhone, @DriverId, FALSE, @CreatedAt)",
            new
            {
                feedback.Id, feedback.TenantId, feedback.ShipmentId, feedback.OrderId,
                feedback.Rating, feedback.Comment, FeedbackType = (int)feedback.FeedbackType,
                feedback.SubmittedAt, feedback.CustomerName, feedback.CustomerPhone,
                feedback.DriverId, feedback.CreatedAt
            });
    }

    public async Task<IEnumerable<DeliveryFeedback>> GetAllAsync(Guid tenantId, int limit = 100, int offset = 0)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<DeliveryFeedback>(
            @"SELECT * FROM logistics.delivery_feedback
              WHERE tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY submitted_at DESC LIMIT @Limit OFFSET @Offset",
            new { TenantId = tenantId, Limit = limit, Offset = offset });
    }

    public async Task<DeliveryFeedback?> GetByIdAsync(Guid id, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<DeliveryFeedback>(
            "SELECT * FROM logistics.delivery_feedback WHERE id = @Id AND tenant_id = @TenantId AND is_deleted = FALSE",
            new { Id = id, TenantId = tenantId });
    }

    public async Task<IEnumerable<DeliveryFeedback>> GetByShipmentIdAsync(Guid shipmentId, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<DeliveryFeedback>(
            @"SELECT * FROM logistics.delivery_feedback
              WHERE shipment_id = @ShipmentId AND tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY submitted_at DESC",
            new { ShipmentId = shipmentId, TenantId = tenantId });
    }

    public async Task<IEnumerable<DeliveryFeedback>> GetByDriverIdAsync(Guid driverId, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<DeliveryFeedback>(
            @"SELECT * FROM logistics.delivery_feedback
              WHERE driver_id = @DriverId AND tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY submitted_at DESC",
            new { DriverId = driverId, TenantId = tenantId });
    }

    public async Task<FeedbackSummary> GetSummaryAsync(Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        var result = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT
                COALESCE(AVG(rating::numeric), 0) AS average_rating,
                COUNT(*) AS total_count,
                COUNT(*) FILTER (WHERE rating = 1) AS rating1_count,
                COUNT(*) FILTER (WHERE rating = 2) AS rating2_count,
                COUNT(*) FILTER (WHERE rating = 3) AS rating3_count,
                COUNT(*) FILTER (WHERE rating = 4) AS rating4_count,
                COUNT(*) FILTER (WHERE rating = 5) AS rating5_count
              FROM logistics.delivery_feedback
              WHERE tenant_id = @TenantId AND is_deleted = FALSE",
            new { TenantId = tenantId });

        if (result == null)
            return new FeedbackSummary(0, 0, 0, 0, 0, 0, 0);

        return new FeedbackSummary(
            (double)(result.average_rating ?? 0m),
            (int)(result.total_count ?? 0L),
            (int)(result.rating1_count ?? 0L),
            (int)(result.rating2_count ?? 0L),
            (int)(result.rating3_count ?? 0L),
            (int)(result.rating4_count ?? 0L),
            (int)(result.rating5_count ?? 0L));
    }
}
