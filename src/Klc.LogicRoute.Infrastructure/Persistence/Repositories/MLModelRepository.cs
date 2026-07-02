using Dapper;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Infrastructure.Persistence.Repositories;

public class MLModelRepository(IPostgresConnectionFactory connectionFactory) : IMLModelRepository
{
    public async Task<MLModelMetadata?> GetActiveModelAsync(string modelType, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryFirstOrDefaultAsync<MLModelMetadata>(
            @"SELECT * FROM logistics.ml_models
              WHERE model_type = @ModelType AND (tenant_id = @TenantId OR tenant_id = '00000000-0000-0000-0000-000000000000')
              AND is_active = TRUE AND is_deleted = FALSE
              ORDER BY trained_at DESC LIMIT 1",
            new { ModelType = modelType, TenantId = tenantId });
    }

    public async Task<IEnumerable<MLModelMetadata>> GetAllAsync(Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<MLModelMetadata>(
            @"SELECT * FROM logistics.ml_models
              WHERE (tenant_id = @TenantId OR tenant_id = '00000000-0000-0000-0000-000000000000') AND is_deleted = FALSE
              ORDER BY trained_at DESC",
            new { TenantId = tenantId });
    }

    public async Task<Guid> CreateAsync(MLModelMetadata model)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.ml_models
              (id, tenant_id, model_type, model_version, file_path, metrics, training_records,
               is_active, trained_at, is_deleted, created_at, created_by)
              VALUES (@Id, @TenantId, @ModelType, @ModelVersion, @FilePath, @Metrics::jsonb, @TrainingRecords,
               @IsActive, @TrainedAt, FALSE, @CreatedAt, @CreatedBy)",
            model);
        return model.Id;
    }

    public async Task UpdateAsync(MLModelMetadata model)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.ml_models
              SET is_active = @IsActive, metrics = @Metrics::jsonb, updated_at = @UpdatedAt
              WHERE id = @Id",
            model);
    }

    public async Task DeactivateAllAsync(string modelType, Guid tenantId)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"UPDATE logistics.ml_models SET is_active = FALSE, updated_at = @Now
              WHERE model_type = @ModelType AND (tenant_id = @TenantId OR tenant_id = '00000000-0000-0000-0000-000000000000')",
            new { ModelType = modelType, TenantId = tenantId, Now = DateTime.UtcNow });
    }
}

public class PredictionLogRepository(IPostgresConnectionFactory connectionFactory) : IPredictionLogRepository
{
    public async Task<Guid> CreateAsync(PredictionLog log)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(
            @"INSERT INTO logistics.prediction_log
              (id, tenant_id, model_id, model_type, input_features, predicted_value, actual_value,
               prediction_at, is_deleted, created_at, created_by)
              VALUES (@Id, @TenantId, @ModelId, @ModelType, @InputFeatures::jsonb, @PredictedValue, @ActualValue,
               @PredictionAt, FALSE, @CreatedAt, @CreatedBy)",
            log);
        return log.Id;
    }

    public async Task<IEnumerable<PredictionLog>> GetByModelTypeAsync(string modelType, Guid tenantId, int limit = 100)
    {
        await using var conn = connectionFactory.CreateConnection();
        await conn.OpenAsync();
        return await conn.QueryAsync<PredictionLog>(
            @"SELECT * FROM logistics.prediction_log
              WHERE model_type = @ModelType AND tenant_id = @TenantId AND is_deleted = FALSE
              ORDER BY prediction_at DESC LIMIT @Limit",
            new { ModelType = modelType, TenantId = tenantId, Limit = limit });
    }
}
