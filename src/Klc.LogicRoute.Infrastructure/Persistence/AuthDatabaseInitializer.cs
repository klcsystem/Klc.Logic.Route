using Microsoft.Extensions.Logging;
using Npgsql;

namespace Klc.LogicRoute.Infrastructure.Persistence;

public class AuthDatabaseInitializer(
    IPostgresConnectionFactory connectionFactory,
    ILogger<AuthDatabaseInitializer> logger)
{
    public async Task InitializeAsync()
    {
        var migrationPath = FindMigrationPath("AuthMigrations");
        if (migrationPath == null)
        {
            logger.LogWarning("Auth migration directory not found");
            return;
        }

        var sqlFiles = Directory.GetFiles(migrationPath, "*.sql").OrderBy(f => f);
        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync();

        foreach (var file in sqlFiles)
        {
            logger.LogInformation("Executing auth migration: {File}", Path.GetFileName(file));
            var sql = await File.ReadAllTextAsync(file);

            try
            {
                await using var cmd = new NpgsqlCommand(sql, connection);
                await cmd.ExecuteNonQueryAsync();
                logger.LogInformation("Auth migration executed: {File}", Path.GetFileName(file));
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to execute auth migration: {File}", Path.GetFileName(file));
                throw;
            }
        }

        logger.LogInformation("Auth database initialization completed");
    }

    private static string? FindMigrationPath(string folderName)
    {
        var candidates = new[]
        {
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Persistence", folderName),
            Path.Combine(Directory.GetCurrentDirectory(), "Persistence", folderName),
        };

        var assemblyDir = Path.GetDirectoryName(typeof(AuthDatabaseInitializer).Assembly.Location);
        if (assemblyDir != null)
            candidates = [..candidates, Path.Combine(assemblyDir, "Persistence", folderName)];

        return candidates.FirstOrDefault(Directory.Exists);
    }
}
