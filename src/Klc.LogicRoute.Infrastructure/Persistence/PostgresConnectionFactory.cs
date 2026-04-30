using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Klc.LogicRoute.Infrastructure.Persistence;

public class PostgresConnectionFactory(IConfiguration configuration) : IPostgresConnectionFactory
{
    public NpgsqlConnection CreateConnection()
    {
        var connectionString = configuration.GetConnectionString("PostgreSQL");
        return new NpgsqlConnection(connectionString);
    }
}
