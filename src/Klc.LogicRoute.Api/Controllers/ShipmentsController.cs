using Klc.LogicRoute.Application.CargoCalculation;
using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.CustomerEta.Commands;
using Klc.LogicRoute.Application.DecisionEngine;
using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Interfaces;
using Klc.LogicRoute.Infrastructure.ExternalServices.Providers;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ShipmentsController(
    IShipmentRepository shipmentRepository,
    IRecommendationRepository recommendationRepository,
    ICargoCalculationService cargoCalculationService,
    IDecisionEngineService decisionEngineService,
    IProviderRepository providerRepository,
    IEnumerable<IProviderApiAdapter> providerAdapters,
    ITenantProvider tenantProvider,
    IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<Shipment>>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var tenantId = tenantProvider.GetTenantId();
        var shipments = await shipmentRepository.GetAllAsync(tenantId, page, pageSize);
        return Ok(ApiResponse<IEnumerable<Shipment>>.Ok(shipments));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<Shipment>>> GetById(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var shipment = await shipmentRepository.GetByIdAsync(id, tenantId);
        if (shipment == null) return NotFound(ApiResponse<Shipment>.Fail("Sevkiyat bulunamadı"));
        return Ok(ApiResponse<Shipment>.Ok(shipment));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Create([FromBody] Shipment shipment)
    {
        var tenantId = tenantProvider.GetTenantId();
        shipment.TenantId = tenantId;
        shipment.CreatedBy = tenantProvider.GetUserId();
        if (string.IsNullOrEmpty(shipment.ShipmentNumber))
            shipment.ShipmentNumber = $"SHP-{DateTime.UtcNow:yyyy}-{Guid.NewGuid().ToString()[..5].ToUpper()}";

        // Calculate desi & chargeable weight from items
        foreach (var item in shipment.Items)
        {
            item.TenantId = tenantId;
            item.CreatedBy = tenantProvider.GetUserId();
            if (item.DesiWeight == 0 && item.WidthCm > 0 && item.HeightCm > 0 && item.DepthCm > 0)
                item.DesiWeight = item.WidthCm * item.HeightCm * item.DepthCm / 3000m;
        }

        shipment.TotalDesiWeight = shipment.Items.Sum(i => i.DesiWeight * i.Quantity);
        shipment.ChargeableWeight = Math.Max(shipment.TotalWeightKg, shipment.TotalDesiWeight);

        var id = await shipmentRepository.InsertAsync(shipment);
        foreach (var item in shipment.Items)
        {
            item.ShipmentId = id;
            await shipmentRepository.InsertItemAsync(item);
        }

        return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<Guid>.Ok(id));
    }

    [HttpPost("{id:guid}/calculate")]
    public async Task<ActionResult<ApiResponse<Recommendation>>> Calculate(Guid id, [FromBody] DecisionCriteria? criteria = null)
    {
        var tenantId = tenantProvider.GetTenantId();
        var shipment = await shipmentRepository.GetByIdAsync(id, tenantId);
        if (shipment == null) return NotFound(ApiResponse<Recommendation>.Fail("Sevkiyat bulunamadı"));

        criteria ??= new DecisionCriteria();

        // Determine recommended vehicle
        shipment.RecommendedVehicle = DetermineVehicle(shipment);

        var recommendation = await decisionEngineService.CalculateBestOptionAsync(shipment, criteria, tenantId);
        recommendation.CreatedBy = tenantProvider.GetUserId();
        await recommendationRepository.InsertAsync(recommendation);

        // Update shipment with calculation results
        shipment.SelectedProviderId = recommendation.SelectedProviderId;
        shipment.SelectedContractRateId = recommendation.SelectedContractRateId;
        shipment.CalculatedPrice = recommendation.CalculatedPrice;
        shipment.Status = ShipmentStatus.Calculated;
        shipment.UpdatedBy = tenantProvider.GetUserId();
        await shipmentRepository.UpdateAsync(shipment);

        return Ok(ApiResponse<Recommendation>.Ok(recommendation));
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<ActionResult<ApiResponse<bool>>> Approve(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var shipment = await shipmentRepository.GetByIdAsync(id, tenantId);
        if (shipment == null) return NotFound(ApiResponse<bool>.Fail("Sevkiyat bulunamadı"));
        if (shipment.Status != ShipmentStatus.Calculated && shipment.Status != ShipmentStatus.PendingApproval)
            return BadRequest(ApiResponse<bool>.Fail("Sevkiyat onaylanabilir durumda değil"));

        await shipmentRepository.UpdateStatusAsync(id, tenantId, (int)ShipmentStatus.Approved);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpPost("{id:guid}/send-to-provider")]
    public async Task<ActionResult<ApiResponse<string>>> SendToProvider(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var shipment = await shipmentRepository.GetByIdAsync(id, tenantId);
        if (shipment == null) return NotFound(ApiResponse<string>.Fail("Sevkiyat bulunamadı"));
        if (shipment.Status != ShipmentStatus.Approved)
            return BadRequest(ApiResponse<string>.Fail("Sevkiyat onaylanmamış"));
        if (!shipment.SelectedProviderId.HasValue)
            return BadRequest(ApiResponse<string>.Fail("Provider seçilmemiş"));

        var provider = await providerRepository.GetByIdAsync(shipment.SelectedProviderId.Value, tenantId);
        if (provider == null) return NotFound(ApiResponse<string>.Fail("Provider bulunamadı"));

        var adapter = providerAdapters.FirstOrDefault(a =>
            a.ProviderCode.Equals(provider.Code, StringComparison.OrdinalIgnoreCase));

        string? referenceId = null;
        if (adapter != null && !string.IsNullOrEmpty(provider.ApiBaseUrl) && !string.IsNullOrEmpty(provider.ApiKey))
        {
            var request = new ProviderShipmentRequest(
                shipment.OriginAddress ?? "", shipment.OriginCity ?? "",
                shipment.DestinationAddress ?? "", shipment.DestinationCity ?? "",
                shipment.ChargeableWeight, shipment.TotalVolumeM3, shipment.PalletCount,
                shipment.RequestedPickupDate?.ToString("yyyy-MM-dd"));
            referenceId = await adapter.CreateShipmentAsync(provider.ApiBaseUrl, provider.ApiKey, request);
        }

        shipment.ProviderReferenceId = referenceId ?? $"REF-{Guid.NewGuid().ToString()[..8].ToUpper()}";
        shipment.Status = ShipmentStatus.SentToProvider;
        shipment.UpdatedBy = tenantProvider.GetUserId();
        await shipmentRepository.UpdateAsync(shipment);
        await shipmentRepository.UpdateStatusAsync(id, tenantId, (int)ShipmentStatus.SentToProvider);

        return Ok(ApiResponse<string>.Ok(shipment.ProviderReferenceId, "Sevkiyat provider'a gönderildi"));
    }

    [HttpGet("{id:guid}/tracking")]
    public async Task<ActionResult<ApiResponse<object>>> GetTracking(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var shipment = await shipmentRepository.GetByIdAsync(id, tenantId);
        if (shipment == null) return NotFound(ApiResponse<object>.Fail("Sevkiyat bulunamadı"));

        var tracking = new
        {
            shipment.ShipmentNumber,
            shipment.Status,
            shipment.ProviderReferenceId,
            shipment.CurrentLatitude,
            shipment.CurrentLongitude,
            shipment.LastTrackingUpdate,
            shipment.EstimatedArrival,
            shipment.DriverName,
            shipment.DriverPhone,
            shipment.VehiclePlate
        };

        return Ok(ApiResponse<object>.Ok(tracking));
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<ApiResponse<bool>>> Cancel(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var shipment = await shipmentRepository.GetByIdAsync(id, tenantId);
        if (shipment == null) return NotFound(ApiResponse<bool>.Fail("Sevkiyat bulunamadı"));
        if (shipment.Status == ShipmentStatus.Delivered || shipment.Status == ShipmentStatus.Completed)
            return BadRequest(ApiResponse<bool>.Fail("Teslim edilmiş sevkiyat iptal edilemez"));

        await shipmentRepository.UpdateStatusAsync(id, tenantId, (int)ShipmentStatus.Cancelled);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateStatus(Guid id, [FromBody] ShipmentStatusUpdate update)
    {
        var tenantId = tenantProvider.GetTenantId();
        await shipmentRepository.UpdateStatusAsync(id, tenantId, (int)update.Status);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        await shipmentRepository.DeleteAsync(id, tenantId);
        return Ok(ApiResponse<bool>.Ok(true));
    }

    [HttpPost("{id:guid}/notify-customer")]
    public async Task<ActionResult<ApiResponse<SendEtaNotificationResult>>> NotifyCustomer(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var userId = tenantProvider.GetUserId();
        var result = await mediator.Send(new SendEtaNotificationCommand(id, tenantId, userId));
        if (!result.Success)
            return BadRequest(ApiResponse<SendEtaNotificationResult>.Fail(result.Message ?? "Bildirim gönderilemedi"));
        return Ok(ApiResponse<SendEtaNotificationResult>.Ok(result));
    }

    [HttpGet("{id:guid}/recommendation")]
    public async Task<ActionResult<ApiResponse<Recommendation>>> GetRecommendation(Guid id)
    {
        var tenantId = tenantProvider.GetTenantId();
        var recs = await recommendationRepository.GetByOrderIdAsync(id, tenantId);
        var rec = recs.FirstOrDefault();
        if (rec == null) return NotFound(ApiResponse<Recommendation>.Fail("Öneri bulunamadı"));
        return Ok(ApiResponse<Recommendation>.Ok(rec));
    }

    private static VehicleCategory DetermineVehicle(Shipment shipment)
    {
        if (shipment.RequiresColdChain) return VehicleCategory.Frigorifik;
        if (shipment.IsHazardous) return VehicleCategory.Tanker;
        return shipment.ChargeableWeight switch
        {
            > 20000 => VehicleCategory.Tir,
            > 5000 => VehicleCategory.Kamyon,
            > 500 => VehicleCategory.Parsiyel,
            _ => VehicleCategory.Kamyonet
        };
    }
}

public record ShipmentStatusUpdate(ShipmentStatus Status);
