using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Domain.Interfaces;

public interface IErpAdapter
{
    ErpType SupportedType { get; }
    Task<bool> TestConnectionAsync(ErpConnection connection);
    Task<List<Order>> SyncOrdersAsync(ErpConnection connection, DateTime? since = null);
}
