using System.Text.Json;
using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/webhooks")]
[AllowAnonymous]
public class WebhookIntegrationController(
    IOrderRepository orderRepository,
    IWebhookEventRepository webhookEventRepository,
    ITenantProvider tenantProvider,
    IConfiguration configuration) : ControllerBase
{
    // ─── Generic order webhook ───
    [HttpPost("orders")]
    public async Task<ActionResult<ApiResponse<object>>> ReceiveOrder([FromBody] GenericOrderWebhook payload)
    {
        if (!ValidateApiKey(out var tenantId))
            return Unauthorized(ApiResponse<object>.Fail("Geçersiz API anahtarı"));

        var order = MapGenericToOrder(payload, tenantId);
        var orderId = await orderRepository.InsertAsync(order);
        await InsertLines(order.Lines, orderId, tenantId);
        await LogWebhookEvent(tenantId, "generic", "order.created", payload.ExternalId, payload);

        return Ok(ApiResponse<object>.Ok(new { orderId, orderNumber = order.OrderNumber }));
    }

    // ─── Shopify webhook ───
    [HttpPost("shopify")]
    public async Task<ActionResult<ApiResponse<object>>> ReceiveShopify([FromBody] ShopifyOrderWebhook payload)
    {
        if (!ValidateApiKey(out var tenantId))
            return Unauthorized(ApiResponse<object>.Fail("Geçersiz API anahtarı"));

        var order = MapShopifyToOrder(payload, tenantId);
        var orderId = await orderRepository.InsertAsync(order);
        await InsertLines(order.Lines, orderId, tenantId);
        await LogWebhookEvent(tenantId, "shopify", "order.created", payload.Id.ToString(), payload);

        return Ok(ApiResponse<object>.Ok(new { orderId, orderNumber = order.OrderNumber }));
    }

    // ─── Trendyol webhook ───
    [HttpPost("trendyol")]
    public async Task<ActionResult<ApiResponse<object>>> ReceiveTrendyol([FromBody] TrendyolOrderWebhook payload)
    {
        if (!ValidateApiKey(out var tenantId))
            return Unauthorized(ApiResponse<object>.Fail("Geçersiz API anahtarı"));

        var order = MapTrendyolToOrder(payload, tenantId);
        var orderId = await orderRepository.InsertAsync(order);
        await InsertLines(order.Lines, orderId, tenantId);
        await LogWebhookEvent(tenantId, "trendyol", "order.created", payload.OrderNumber, payload);

        return Ok(ApiResponse<object>.Ok(new { orderId, orderNumber = order.OrderNumber }));
    }

    // ─── Auth ───
    private bool ValidateApiKey(out Guid tenantId)
    {
        tenantId = Guid.Empty;
        if (!Request.Headers.TryGetValue("X-Api-Key", out var apiKeyHeader))
            return false;

        var apiKey = apiKeyHeader.ToString();
        // Check configured webhook API keys: "WebhookApiKeys:{key}" = "{tenantId}"
        var tenantIdStr = configuration[$"WebhookApiKeys:{apiKey}"];
        if (string.IsNullOrEmpty(tenantIdStr) || !Guid.TryParse(tenantIdStr, out tenantId))
        {
            // Fallback: accept any key and use tenant from header
            var headerTenant = Request.Headers["X-Tenant-Id"].ToString();
            if (!string.IsNullOrEmpty(headerTenant) && Guid.TryParse(headerTenant, out tenantId))
            {
                var validKeys = configuration.GetSection("WebhookApiKeys").GetChildren().Select(c => c.Key);
                return validKeys.Contains(apiKey) || !string.IsNullOrEmpty(apiKey);
            }
            return false;
        }
        return true;
    }

    // ─── Mappers ───
    private static Order MapGenericToOrder(GenericOrderWebhook w, Guid tenantId)
    {
        return new Order
        {
            TenantId = tenantId,
            OrderNumber = w.OrderNumber ?? $"WH-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
            ErpReferenceId = w.ExternalId,
            CustomerName = w.CustomerName,
            DestinationAddress = w.ShippingAddress,
            DestinationCity = w.ShippingCity,
            TotalWeightKg = w.TotalWeightKg,
            TotalVolumeM3 = w.TotalVolumeM3,
            TotalAmount = w.TotalAmount,
            Currency = w.Currency ?? "TRY",
            Notes = w.Notes,
            Status = OrderStatus.Draft,
            Priority = MapPriority(w.Priority),
            RequestedDeliveryDate = w.RequestedDeliveryDate,
            Lines = w.Items?.Select(MapGenericLineToOrderLine).ToList() ?? []
        };
    }

    private static Order MapShopifyToOrder(ShopifyOrderWebhook w, Guid tenantId)
    {
        var shipping = w.ShippingAddress;
        return new Order
        {
            TenantId = tenantId,
            OrderNumber = w.Name ?? $"SHOP-{w.Id}",
            ErpReferenceId = w.Id.ToString(),
            CustomerName = shipping?.Name ?? w.Email,
            DestinationAddress = shipping != null ? $"{shipping.Address1} {shipping.Address2}".Trim() : null,
            DestinationCity = shipping?.City,
            TotalAmount = decimal.TryParse(w.TotalPrice, out var tp) ? tp : 0,
            Currency = w.Currency ?? "TRY",
            TotalWeightKg = w.TotalWeight / 1000m, // Shopify sends grams
            Notes = w.Note,
            Status = OrderStatus.Draft,
            Priority = OrderPriority.Normal,
            Lines = w.LineItems?.Select(MapShopifyLineToOrderLine).ToList() ?? []
        };
    }

    private static Order MapTrendyolToOrder(TrendyolOrderWebhook w, Guid tenantId)
    {
        return new Order
        {
            TenantId = tenantId,
            OrderNumber = w.OrderNumber ?? $"TY-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
            ErpReferenceId = w.OrderNumber,
            CustomerName = $"{w.CustomerFirstName} {w.CustomerLastName}".Trim(),
            DestinationAddress = w.ShippingAddress,
            DestinationCity = w.ShippingCity,
            TotalAmount = w.TotalPrice,
            Currency = "TRY",
            TotalWeightKg = w.Lines?.Sum(l => l.Quantity * (l.WeightKg ?? 0)) ?? 0,
            Status = OrderStatus.Draft,
            Priority = OrderPriority.Normal,
            Lines = w.Lines?.Select(MapTrendyolLineToOrderLine).ToList() ?? []
        };
    }

    private static OrderLine MapGenericLineToOrderLine(GenericOrderItem item)
    {
        return new OrderLine
        {
            ProductCode = item.Sku,
            ProductName = item.ProductName,
            Quantity = item.Quantity,
            WeightKg = item.WeightKg,
        };
    }

    private static OrderLine MapShopifyLineToOrderLine(ShopifyLineItem item)
    {
        return new OrderLine
        {
            ProductCode = item.Sku,
            ProductName = item.Title,
            Quantity = item.Quantity,
            WeightKg = item.Grams / 1000m,
        };
    }

    private static OrderLine MapTrendyolLineToOrderLine(TrendyolLineItem item)
    {
        return new OrderLine
        {
            ProductCode = item.Barcode ?? item.ProductCode,
            ProductName = item.ProductName,
            Quantity = item.Quantity,
            WeightKg = item.WeightKg ?? 0,
        };
    }

    private static OrderPriority MapPriority(string? priority) => priority?.ToLowerInvariant() switch
    {
        "urgent" or "high" => OrderPriority.Urgent,
        "priority" or "medium" => OrderPriority.Priority,
        _ => OrderPriority.Normal
    };

    private async Task InsertLines(List<OrderLine> lines, Guid orderId, Guid tenantId)
    {
        foreach (var line in lines)
        {
            line.OrderId = orderId;
            line.TenantId = tenantId;
            if (line.DesiWeight == 0 && line.WidthCm > 0 && line.HeightCm > 0 && line.DepthCm > 0)
                line.DesiWeight = line.WidthCm * line.HeightCm * line.DepthCm / 3000m;
            await orderRepository.InsertLineAsync(line);
        }
    }

    private async Task LogWebhookEvent(Guid tenantId, string providerCode, string eventType, string? reference, object payload)
    {
        var webhookEvent = new WebhookEvent
        {
            TenantId = tenantId,
            ProviderCode = providerCode,
            EventType = eventType,
            TrackingNumber = reference,
            Payload = JsonSerializer.Serialize(payload),
            Status = "Processed"
        };
        await webhookEventRepository.InsertAsync(webhookEvent);
    }
}

// ─── Generic Webhook Models ───
public record GenericOrderWebhook
{
    public string? ExternalId { get; init; }
    public string? OrderNumber { get; init; }
    public string? CustomerName { get; init; }
    public string? ShippingAddress { get; init; }
    public string? ShippingCity { get; init; }
    public decimal TotalWeightKg { get; init; }
    public decimal TotalVolumeM3 { get; init; }
    public decimal? TotalAmount { get; init; }
    public string? Currency { get; init; }
    public string? Priority { get; init; }
    public string? Notes { get; init; }
    public DateTime? RequestedDeliveryDate { get; init; }
    public List<GenericOrderItem>? Items { get; init; }
}

public record GenericOrderItem
{
    public string? Sku { get; init; }
    public string? ProductName { get; init; }
    public int Quantity { get; init; } = 1;
    public decimal WeightKg { get; init; }
    public decimal UnitPrice { get; init; }
}

// ─── Shopify Webhook Models ───
public record ShopifyOrderWebhook
{
    public long Id { get; init; }
    public string? Name { get; init; } // e.g. "#1001"
    public string? Email { get; init; }
    public string? TotalPrice { get; init; }
    public string? Currency { get; init; }
    public decimal TotalWeight { get; init; } // grams
    public string? Note { get; init; }
    public ShopifyAddress? ShippingAddress { get; init; }
    public List<ShopifyLineItem>? LineItems { get; init; }
}

public record ShopifyAddress
{
    public string? Name { get; init; }
    public string? Address1 { get; init; }
    public string? Address2 { get; init; }
    public string? City { get; init; }
    public string? Province { get; init; }
    public string? Country { get; init; }
    public string? Zip { get; init; }
    public string? Phone { get; init; }
}

public record ShopifyLineItem
{
    public long Id { get; init; }
    public string? Title { get; init; }
    public string? Sku { get; init; }
    public int Quantity { get; init; }
    public string? Price { get; init; }
    public decimal Grams { get; init; }
}

// ─── Trendyol Webhook Models ───
public record TrendyolOrderWebhook
{
    public string? OrderNumber { get; init; }
    public string? CustomerFirstName { get; init; }
    public string? CustomerLastName { get; init; }
    public string? ShippingAddress { get; init; }
    public string? ShippingCity { get; init; }
    public string? ShippingDistrict { get; init; }
    public decimal TotalPrice { get; init; }
    public string? CargoProviderName { get; init; }
    public List<TrendyolLineItem>? Lines { get; init; }
}

public record TrendyolLineItem
{
    public string? ProductCode { get; init; }
    public string? Barcode { get; init; }
    public string? ProductName { get; init; }
    public int Quantity { get; init; }
    public decimal Price { get; init; }
    public decimal? WeightKg { get; init; }
}
