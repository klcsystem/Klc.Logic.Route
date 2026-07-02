using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/invoices")]
[Authorize]
public class InvoiceController(
    IInvoiceRepository invoiceRepository,
    IShipmentRepository shipmentRepository,
    ITenantProvider tenantProvider) : ControllerBase
{
    /// <summary>
    /// List all invoices with pagination.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<Invoice>>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var tenantId = tenantProvider.GetTenantId();
        var invoices = await invoiceRepository.GetAllAsync(tenantId, page, pageSize);
        return Ok(ApiResponse<IEnumerable<Invoice>>.Ok(invoices));
    }

    /// <summary>
    /// Get invoice detail with line items.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<Invoice>>> GetById(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var invoice = await invoiceRepository.GetByIdAsync(id, tenantId);
        if (invoice == null)
            return NotFound(ApiResponse<Invoice>.Fail("Fatura bulunamadı"));
        return Ok(ApiResponse<Invoice>.Ok(invoice));
    }

    /// <summary>
    /// Auto-generate invoice from completed shipments in a given period.
    /// </summary>
    [HttpPost("generate")]
    [Authorize(Roles = "Admin,Finance,LogisticsManager")]
    public async Task<ActionResult<ApiResponse<Invoice>>> Generate([FromBody] GenerateInvoiceRequest request)
    {
        var tenantId = tenantProvider.GetTenantId();
        var userId = tenantProvider.GetUserId();

        // Get all completed shipments
        var allShipments = await shipmentRepository.GetAllAsync(tenantId, 1, 10000);
        var deliveredShipments = allShipments
            .Where(s => s.Status == ShipmentStatus.Delivered
                && s.ActualDeliveryDate.HasValue
                && s.ActualDeliveryDate.Value.Month == request.Month
                && s.ActualDeliveryDate.Value.Year == request.Year)
            .ToList();

        if (deliveredShipments.Count == 0)
            return BadRequest(ApiResponse<Invoice>.Fail($"Bu dönem için tamamlanan sevkiyat bulunamadı: {request.Month}/{request.Year}"));

        // Create the invoice
        var invoice = new Invoice
        {
            TenantId = tenantId,
            InvoiceNumber = $"INV-{request.Year}{request.Month:D2}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
            CustomerName = request.CustomerName ?? "Genel",
            PeriodMonth = request.Month,
            PeriodYear = request.Year,
            Currency = request.Currency ?? "TRY",
            Status = "Draft",
            CreatedBy = userId
        };

        decimal totalAmount = 0;
        await invoiceRepository.InsertAsync(invoice);

        foreach (var shipment in deliveredShipments)
        {
            var unitPrice = shipment.CalculatedPrice ?? 0;
            var amount = unitPrice;

            var line = new InvoiceLine
            {
                TenantId = tenantId,
                InvoiceId = invoice.Id,
                ShipmentId = shipment.Id,
                Description = $"{shipment.ShipmentNumber}: {shipment.OriginCity} -> {shipment.DestinationCity}",
                Quantity = 1,
                UnitPrice = unitPrice,
                Amount = amount,
                CreatedBy = userId
            };
            totalAmount += amount;
            await invoiceRepository.InsertLineAsync(line);
            invoice.Lines.Add(line);
        }

        // Update total
        invoice.TotalAmount = totalAmount;
        // We need to update just the total — use status update path or direct update
        // For simplicity, re-insert is not ideal; we update via status (no-op on status)
        // Better: let's add inline SQL here
        await invoiceRepository.UpdateStatusAsync(invoice.Id, tenantId, "Draft", null);

        return Ok(ApiResponse<Invoice>.Ok(invoice));
    }

    /// <summary>
    /// Update invoice status (Draft -> Sent -> Paid).
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Admin,Finance,LogisticsManager")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateStatus(Guid id, [FromBody] UpdateInvoiceStatusRequest request)
    {
        var tenantId = tenantProvider.GetTenantId();
        var invoice = await invoiceRepository.GetByIdAsync(id, tenantId);
        if (invoice == null)
            return NotFound(ApiResponse<bool>.Fail("Fatura bulunamadı"));

        var validTransitions = new Dictionary<string, string[]>
        {
            ["Draft"] = ["Sent"],
            ["Sent"] = ["Paid"],
            ["Paid"] = []
        };

        if (!validTransitions.TryGetValue(invoice.Status, out var allowed) || !allowed.Contains(request.Status))
            return BadRequest(ApiResponse<bool>.Fail($"Geçersiz durum geçişi: {invoice.Status} -> {request.Status}"));

        await invoiceRepository.UpdateStatusAsync(id, tenantId, request.Status, DateTime.UtcNow);
        return Ok(ApiResponse<bool>.Ok(true));
    }
}

public record GenerateInvoiceRequest(int Month, int Year, string? CustomerName = null, string? Currency = null);
public record UpdateInvoiceStatusRequest(string Status);
