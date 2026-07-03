using Microsoft.Extensions.Logging;
using Npgsql;

namespace Klc.LogicRoute.Infrastructure.Persistence;

public class DatabaseInitializer(
    IPostgresConnectionFactory connectionFactory,
    ILogger<DatabaseInitializer> logger)
{
    public async Task InitializeAsync()
    {
        var migrationPath = FindMigrationPath("Migrations");
        if (migrationPath == null)
        {
            logger.LogWarning("Migration directory not found");
            return;
        }

        var sqlFiles = Directory.GetFiles(migrationPath, "*.sql").OrderBy(f => f);
        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync();

        foreach (var file in sqlFiles)
        {
            logger.LogInformation("Executing migration: {File}", Path.GetFileName(file));
            var sql = await File.ReadAllTextAsync(file);

            try
            {
                await using var cmd = new NpgsqlCommand(sql, connection);
                cmd.CommandTimeout = 120;
                await cmd.ExecuteNonQueryAsync();
                logger.LogInformation("Migration executed: {File}", Path.GetFileName(file));
            }
            catch (Exception ex)
            {
                // Per-migration izolasyon: bir migration patlarsa TUM zinciri durdurma.
                // Uzun-omurlu/drift bir DB'de erken bir migration hata verebilir; sonraki
                // migration'lar (or. 033_ReconcileSchema eksik tablolari tamamlar) yine de
                // uygulanabilmeli. Hatayi Error seviyesinde logla ve bir sonrakine gec.
                logger.LogError(ex, "Migration FAILED, continuing to next: {File}", Path.GetFileName(file));
            }
        }

        logger.LogInformation("Database initialization completed");
    }

    private static string? FindMigrationPath(string folderName)
    {
        var candidates = new[]
        {
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Persistence", folderName),
            Path.Combine(Directory.GetCurrentDirectory(), "Persistence", folderName),
        };

        var assemblyDir = Path.GetDirectoryName(typeof(DatabaseInitializer).Assembly.Location);
        if (assemblyDir != null)
            candidates = [..candidates, Path.Combine(assemblyDir, "Persistence", folderName)];

        return candidates.FirstOrDefault(Directory.Exists);
    }
}
