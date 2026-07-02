using Klc.LogicRoute.Application.Common.Interfaces;
using Klc.LogicRoute.Domain.Enums;
using Klc.LogicRoute.Domain.Events;
using Klc.LogicRoute.Domain.Interfaces;
using MediatR;

namespace Klc.LogicRoute.Application.Mobile.Commands;

public record UpdateShipmentStatusCommand(
    Guid ShipmentId,
    Guid TenantId,
    ShipmentStatus NewStatus,
    string? Notes = null) : IRequest<UpdateShipmentStatusResult>;

public record UpdateShipmentStatusResult(bool Success, string? Message = null);

public class UpdateShipmentStatusHandler(
    IShipmentRepository shipmentRepository,
    IEventBus eventBus) : IRequestHandler<UpdateShipmentStatusCommand, UpdateShipmentStatusResult>
{
    public async Task<UpdateShipmentStatusResult> Handle(UpdateShipmentStatusCommand request, CancellationToken cancellationToken)
    {
        var shipment = await shipmentRepository.GetByIdAsync(request.ShipmentId, request.TenantId);
        if (shipment == null)
            return new UpdateShipmentStatusResult(false, "Sevkiyat bulunamadı");

        var oldStatus = shipment.Status;
        await shipmentRepository.UpdateStatusAsync(request.ShipmentId, request.TenantId, (int)request.NewStatus);

        // Update delivery dates based on status
        if (request.NewStatus == ShipmentStatus.InTransit)
        {
            shipment.ActualPickupDate = DateTime.UtcNow;
            shipment.Status = request.NewStatus;
            shipment.UpdatedAt = DateTime.UtcNow;
            await shipmentRepository.UpdateAsync(shipment);
        }
        else if (request.NewStatus == ShipmentStatus.Delivered)
        {
            shipment.ActualDeliveryDate = DateTime.UtcNow;
            shipment.Status = request.NewStatus;
            shipment.UpdatedAt = DateTime.UtcNow;
            await shipmentRepository.UpdateAsync(shipment);
        }

        // Publish domain event
        try
        {
            await eventBus.PublishAsync(new ShipmentStatusChangedEvent(
                request.ShipmentId,
                oldStatus.ToString(),
                request.NewStatus.ToString(),
                DateTime.UtcNow), cancellationToken);
        }
        catch
        {
            // Event publishing failure should not fail the status update
        }

        return new UpdateShipmentStatusResult(true, $"Durum güncellendi: {request.NewStatus}");
    }
}
