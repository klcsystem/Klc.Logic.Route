using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Infrastructure.ExternalServices.Erp;

/// <summary>
/// SAP S/4HANA OData adapter. Connects to SAP via HTTPS OData services to pull
/// outbound deliveries (irsaliye) and sales orders, then maps them to LogicRoute Order entities.
///
/// Required ErpConnection fields:
/// - EndpointUrl: SAP OData base URL (e.g. "https://sap.example.com:44300")
/// - Username / Password: SAP user credentials (Basic Auth)
/// - Settings (JSON): optional overrides like {"SalesOrganization":"101","Client":"100"}
/// </summary>
public class SapAdapter(ILogger<SapAdapter> logger, IHttpClientFactory httpClientFactory) : IErpAdapter
{
    public ErpType SupportedType => ErpType.SapS4Hana;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public async Task<bool> TestConnectionAsync(ErpConnection connection)
    {
        try
        {
            using var client = CreateHttpClient(connection);
            var response = await client.GetAsync(
                "/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/ServiceCollection?$format=json&$top=1");

            if (response.IsSuccessStatusCode)
            {
                logger.LogInformation("SAP OData: Connection test successful for {Endpoint}", connection.EndpointUrl);
                return true;
            }

            logger.LogWarning("SAP OData: Connection test failed with {StatusCode} for {Endpoint}",
                response.StatusCode, connection.EndpointUrl);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "SAP OData: Connection test error for {Endpoint}", connection.EndpointUrl);
            return false;
        }
    }

    public async Task<List<Order>> SyncOrdersAsync(ErpConnection connection, DateTime? since = null)
    {
        logger.LogInformation("SAP OData: Syncing orders since {Since} from {Endpoint}", since, connection.EndpointUrl);
        var orders = new List<Order>();

        try
        {
            using var client = CreateHttpClient(connection);
            var settings = ParseSettings(connection.Settings);

            // 1. Pull outbound deliveries (irsaliyeler)
            var deliveries = await FetchOutboundDeliveriesAsync(client, since);
            logger.LogInformation("SAP OData: Fetched {Count} outbound deliveries", deliveries.Count);

            foreach (var delivery in deliveries)
            {
                var order = MapDeliveryToOrder(delivery, connection);
                orders.Add(order);
            }

            // 2. Pull sales orders if no deliveries found (fallback)
            if (orders.Count == 0)
            {
                var salesOrders = await FetchSalesOrdersAsync(client, since);
                logger.LogInformation("SAP OData: Fetched {Count} sales orders (fallback)", salesOrders.Count);

                foreach (var so in salesOrders)
                {
                    var order = MapSalesOrderToOrder(so, connection);
                    orders.Add(order);
                }
            }

            // 3. Enrich orders with customer addresses
            var customerIds = orders
                .Select(o => o.CustomerName)
                .Where(c => !string.IsNullOrEmpty(c))
                .Distinct()
                .Cast<string>()
                .ToList();

            if (customerIds.Count > 0)
            {
                var customerAddresses = await FetchCustomerAddressesAsync(client, customerIds);
                EnrichOrdersWithAddresses(orders, customerAddresses);
                logger.LogInformation("SAP OData: Enriched orders with {Count} customer addresses", customerAddresses.Count);
            }

            logger.LogInformation("SAP OData: Sync complete — {Count} orders", orders.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "SAP OData: Sync failed for {Endpoint}", connection.EndpointUrl);
        }

        return orders;
    }

    // ── OData Fetch Methods ─────────────────────────────────────────

    private async Task<List<SapDelivery>> FetchOutboundDeliveriesAsync(HttpClient client, DateTime? since)
    {
        var filter = since.HasValue
            ? $"&$filter=CreationDate ge datetime'{since.Value:yyyy-MM-ddTHH:mm:ss}'"
            : "";

        var url = "/sap/opu/odata/sap/LE_SHP_OD_LIST_SRV/I_OutboundDelivery?$format=json&$top=500"
                + "&$select=OutboundDelivery,DeliveryDocumentType,CreationDate,ShipToParty,SoldToParty,"
                + "ShippingPoint,ActualDeliveryRoute,ProposedDeliveryRoute,HeaderGrossWeight,HeaderNetWeight,"
                + "HeaderWeightUnit,HeaderVolume,HeaderVolumeUnit,PlannedGoodsIssueDate,DeliveryDate,"
                + "DeliveryPriority,OverallSDProcessStatus,TotalNetAmount,TransactionCurrency,"
                + "ActualGoodsMovementDate,DocumentDate,SalesOrganization"
                + filter
                + "&$orderby=CreationDate desc";

        return await FetchODataCollectionAsync<SapDelivery>(client, url);
    }

    private async Task<List<SapSalesOrder>> FetchSalesOrdersAsync(HttpClient client, DateTime? since)
    {
        var filter = since.HasValue
            ? $"&$filter=CreationDate ge datetime'{since.Value:yyyy-MM-ddTHH:mm:ss}'"
            : "";

        var url = "/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder?$format=json&$top=500"
                + "&$select=SalesOrder,SalesOrderType,SoldToParty,CreationDate,SalesOrganization,"
                + "TransactionCurrency,PurchaseOrderByCustomer"
                + filter
                + "&$orderby=CreationDate desc";

        return await FetchODataCollectionAsync<SapSalesOrder>(client, url);
    }

    private async Task<List<SapCustomer>> FetchCustomerAddressesAsync(HttpClient client, List<string> customerIds)
    {
        var allCustomers = new List<SapCustomer>();

        // Fetch in batches to avoid URL length limits
        foreach (var batch in customerIds.Chunk(20))
        {
            var filterParts = batch.Select(id => $"Customer eq '{id}'");
            var filter = string.Join(" or ", filterParts);
            var url = $"/sap/opu/odata/sap/LE_SHP_OD_LIST_SRV/I_Customer?$format=json&$top=100"
                    + $"&$select=Customer,CustomerName,CityName,PostalCode,StreetName,Country,Region"
                    + $"&$filter={filter}";

            try
            {
                var customers = await FetchODataCollectionAsync<SapCustomer>(client, url);
                allCustomers.AddRange(customers);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "SAP OData: Failed to fetch customer addresses for batch");
            }
        }

        return allCustomers;
    }

    private async Task<List<T>> FetchODataCollectionAsync<T>(HttpClient client, string url)
    {
        var response = await client.GetAsync(url);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            logger.LogWarning("SAP OData: {StatusCode} for {Url} — {Error}",
                response.StatusCode, url.Split('?')[0], errorBody[..Math.Min(500, errorBody.Length)]);
            return [];
        }

        var json = await response.Content.ReadAsStringAsync();
        var wrapper = JsonSerializer.Deserialize<ODataResponse<T>>(json, JsonOptions);
        return wrapper?.D?.Results ?? [];
    }

    // ── Mapping Methods ─────────────────────────────────────────────

    private static Order MapDeliveryToOrder(SapDelivery d, ErpConnection connection)
    {
        return new Order
        {
            OrderNumber = $"DLV-{d.OutboundDelivery}",
            ErpReferenceId = d.OutboundDelivery,
            ErpConnectionId = connection.Id,
            CustomerName = d.SoldToParty ?? d.ShipToParty,
            TotalWeightKg = ParseDecimal(d.HeaderGrossWeight),
            TotalVolumeM3 = ParseDecimal(d.HeaderVolume),
            Currency = d.TransactionCurrency ?? "TRY",
            Status = MapDeliveryStatus(d.OverallSDProcessStatus),
            Priority = MapDeliveryPriority(d.DeliveryPriority),
            RequestedDeliveryDate = ParseSapDate(d.DeliveryDate) ?? ParseSapDate(d.PlannedGoodsIssueDate),
            TenantId = connection.TenantId,
            Notes = $"SAP Delivery {d.OutboundDelivery} | Tip: {d.DeliveryDocumentType} | Sevk: {d.ShippingPoint} | Rota: {d.ActualDeliveryRoute ?? d.ProposedDeliveryRoute}",
            CreatedAt = ParseSapDate(d.CreationDate) ?? DateTime.UtcNow
        };
    }

    private static Order MapSalesOrderToOrder(SapSalesOrder so, ErpConnection connection)
    {
        return new Order
        {
            OrderNumber = $"SO-{so.SalesOrder}",
            ErpReferenceId = so.SalesOrder,
            ErpConnectionId = connection.Id,
            CustomerName = so.SoldToParty,
            Currency = so.TransactionCurrency ?? "TRY",
            Status = OrderStatus.Pending,
            Priority = OrderPriority.Normal,
            TenantId = connection.TenantId,
            Notes = $"SAP Sales Order {so.SalesOrder} | Tip: {so.SalesOrderType} | PO: {so.PurchaseOrderByCustomer}",
            CreatedAt = ParseSapDate(so.CreationDate) ?? DateTime.UtcNow
        };
    }

    private static void EnrichOrdersWithAddresses(List<Order> orders, List<SapCustomer> customers)
    {
        var customerMap = customers
            .GroupBy(c => c.Customer)
            .ToDictionary(g => g.Key!, g => g.First());

        foreach (var order in orders)
        {
            if (order.CustomerName is null || !customerMap.TryGetValue(order.CustomerName, out var customer))
                continue;

            order.DestinationAddress = BuildAddress(customer);
            order.DestinationCity = customer.CityName;
            order.CustomerName = customer.CustomerName ?? order.CustomerName;
        }
    }

    private static string BuildAddress(SapCustomer c)
    {
        var parts = new[] { c.StreetName, c.PostalCode, c.CityName, c.Region, c.Country }
            .Where(p => !string.IsNullOrWhiteSpace(p));
        return string.Join(", ", parts);
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private HttpClient CreateHttpClient(ErpConnection connection)
    {
        var client = httpClientFactory.CreateClient("SapOData");
        client.BaseAddress = new Uri(connection.EndpointUrl!.TrimEnd('/'));
        client.Timeout = TimeSpan.FromSeconds(60);

        if (!string.IsNullOrEmpty(connection.Username) && !string.IsNullOrEmpty(connection.Password))
        {
            var credentials = Convert.ToBase64String(
                Encoding.UTF8.GetBytes($"{connection.Username}:{connection.Password}"));
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);
        }

        client.DefaultRequestHeaders.Accept.Clear();
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        return client;
    }

    private static SapAdapterSettings ParseSettings(string? settingsJson)
    {
        if (string.IsNullOrWhiteSpace(settingsJson))
            return new SapAdapterSettings();

        try
        {
            return JsonSerializer.Deserialize<SapAdapterSettings>(settingsJson, JsonOptions)
                   ?? new SapAdapterSettings();
        }
        catch
        {
            return new SapAdapterSettings();
        }
    }

    private static DateTime? ParseSapDate(string? dateStr)
    {
        if (string.IsNullOrEmpty(dateStr)) return null;

        // SAP OData format: /Date(1717200000000)/
        if (dateStr.StartsWith("/Date(") && dateStr.EndsWith(")/"))
        {
            var msStr = dateStr[6..^2];
            if (long.TryParse(msStr, out var ms))
                return DateTimeOffset.FromUnixTimeMilliseconds(ms).UtcDateTime;
        }

        if (DateTime.TryParse(dateStr, out var dt))
            return dt;

        return null;
    }

    private static decimal ParseDecimal(string? value)
    {
        if (string.IsNullOrEmpty(value)) return 0;
        return decimal.TryParse(value, System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var d) ? d : 0;
    }

    private static OrderStatus MapDeliveryStatus(string? status) => status switch
    {
        "A" => OrderStatus.Pending,      // Not yet processed
        "B" => OrderStatus.InShipment,   // Partially processed
        "C" => OrderStatus.Completed,    // Fully processed
        _ => OrderStatus.Pending
    };

    private static OrderPriority MapDeliveryPriority(string? priority) => priority switch
    {
        "01" => OrderPriority.Urgent,
        "02" => OrderPriority.Priority,
        _ => OrderPriority.Normal
    };

    // ── OData Response Models ───────────────────────────────────────

    private sealed class ODataResponse<T>
    {
        [JsonPropertyName("d")]
        public ODataResultSet<T>? D { get; set; }
    }

    private sealed class ODataResultSet<T>
    {
        [JsonPropertyName("results")]
        public List<T>? Results { get; set; }
    }

    private sealed class SapDelivery
    {
        public string? OutboundDelivery { get; set; }
        public string? DeliveryDocumentType { get; set; }
        public string? CreationDate { get; set; }
        public string? ShipToParty { get; set; }
        public string? SoldToParty { get; set; }
        public string? ShippingPoint { get; set; }
        public string? ActualDeliveryRoute { get; set; }
        public string? ProposedDeliveryRoute { get; set; }
        public string? HeaderGrossWeight { get; set; }
        public string? HeaderNetWeight { get; set; }
        public string? HeaderWeightUnit { get; set; }
        public string? HeaderVolume { get; set; }
        public string? HeaderVolumeUnit { get; set; }
        public string? PlannedGoodsIssueDate { get; set; }
        public string? DeliveryDate { get; set; }
        public string? DeliveryPriority { get; set; }
        public string? OverallSDProcessStatus { get; set; }
        public string? TotalNetAmount { get; set; }
        public string? TransactionCurrency { get; set; }
        public string? ActualGoodsMovementDate { get; set; }
        public string? DocumentDate { get; set; }
        public string? SalesOrganization { get; set; }
    }

    private sealed class SapSalesOrder
    {
        public string? SalesOrder { get; set; }
        public string? SalesOrderType { get; set; }
        public string? SoldToParty { get; set; }
        public string? CreationDate { get; set; }
        public string? SalesOrganization { get; set; }
        public string? TransactionCurrency { get; set; }
        public string? PurchaseOrderByCustomer { get; set; }
    }

    private sealed class SapCustomer
    {
        public string? Customer { get; set; }
        public string? CustomerName { get; set; }
        public string? CityName { get; set; }
        public string? PostalCode { get; set; }
        public string? StreetName { get; set; }
        public string? Country { get; set; }
        public string? Region { get; set; }
    }

    private sealed class SapAdapterSettings
    {
        public string? SalesOrganization { get; set; }
        public string? Client { get; set; }
        public string? DeliveryServicePath { get; set; }
        public string? SalesOrderServicePath { get; set; }
    }
}
