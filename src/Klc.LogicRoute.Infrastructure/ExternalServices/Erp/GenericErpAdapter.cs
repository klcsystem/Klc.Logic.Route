using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Infrastructure.ExternalServices.Erp;

public class GenericErpAdapter(ILogger<GenericErpAdapter> logger) : IErpAdapter
{
    public ErpType SupportedType => ErpType.Generic;

    public Task<bool> TestConnectionAsync(ErpConnection connection)
    {
        logger.LogInformation("Generic ERP stub: Testing connection to {Endpoint}", connection.EndpointUrl);
        return Task.FromResult(!string.IsNullOrEmpty(connection.EndpointUrl));
    }

    public Task<List<Order>> SyncOrdersAsync(ErpConnection connection, DateTime? since = null)
    {
        logger.LogInformation("Generic ERP stub: Syncing orders from {Endpoint} since {Since}",
            connection.EndpointUrl, since);
        return Task.FromResult(new List<Order>());
    }
}
