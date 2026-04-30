using Npgsql;

namespace Klc.LogicRoute.Infrastructure.Persistence;

public interface IPostgresConnectionFactory
{
    NpgsqlConnection CreateConnection();
}
