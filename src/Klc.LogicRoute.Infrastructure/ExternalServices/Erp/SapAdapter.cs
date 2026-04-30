using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Infrastructure.ExternalServices.Erp;

public class SapAdapter(ILogger<SapAdapter> logger) : IErpAdapter
{
    public ErpType SupportedType => ErpType.SapS4Hana;

    public Task<bool> TestConnectionAsync(ErpConnection connection)
    {
        logger.LogInformation("SAP SOAP stub: Testing connection to {Endpoint}", connection.EndpointUrl);
        return Task.FromResult(true);
    }

    public Task<List<Order>> SyncOrdersAsync(ErpConnection connection, DateTime? since = null)
    {
        logger.LogInformation("SAP SOAP stub: Syncing orders since {Since}", since);
        var orders = new List<Order>
        {
            new()
            {
                OrderNumber = $"SAP-{DateTime.UtcNow:yyyyMMdd}-001",
                ErpReferenceId = "4500001234",
                ErpConnectionId = connection.Id,
                CustomerName = "Demo Musteri A",
                OriginCity = "Istanbul",
                OriginAddress = "Esenyurt Lojistik Merkezi",
                DestinationCity = "Ankara",
                DestinationAddress = "Sincan Sanayi Bolgesi",
                TotalWeightKg = 1500,
                TotalVolumeM3 = 8.5m,
                PalletCount = 3,
                ProductCategory = "Gida",
                RequiresColdChain = true,
                TemperatureMin = 2,
                TemperatureMax = 8,
                Status = OrderStatus.Pending,
                Priority = OrderPriority.Normal,
                TenantId = connection.TenantId
            },
            new()
            {
                OrderNumber = $"SAP-{DateTime.UtcNow:yyyyMMdd}-002",
                ErpReferenceId = "4500001235",
                ErpConnectionId = connection.Id,
                CustomerName = "Demo Musteri B",
                OriginCity = "Izmir",
                OriginAddress = "Kemalpasa OSB",
                DestinationCity = "Bursa",
                DestinationAddress = "Nilufer Sanayi Sitesi",
                TotalWeightKg = 800,
                TotalVolumeM3 = 4.2m,
                PalletCount = 2,
                ProductCategory = "Tekstil",
                IsHazardous = false,
                Status = OrderStatus.Pending,
                Priority = OrderPriority.Priority,
                TenantId = connection.TenantId
            }
        };
        return Task.FromResult(orders);
    }
}
