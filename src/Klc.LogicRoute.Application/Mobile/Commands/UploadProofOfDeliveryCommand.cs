using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using MediatR;

namespace Klc.LogicRoute.Application.Mobile.Commands;

public record UploadProofOfDeliveryCommand(
    Guid ShipmentId,
    Guid TenantId,
    string? RecipientName,
    string? Notes,
    double? Lat,
    double? Lng,
    string? PhotoPath,
    string? SignaturePath,
    string? UserId) : IRequest<UploadProofOfDeliveryResult>;

public record UploadProofOfDeliveryResult(bool Success, Guid? PodId = null, string? Message = null);

public class UploadProofOfDeliveryHandler(
    IProofOfDeliveryRepository podRepository,
    IShipmentRepository shipmentRepository) : IRequestHandler<UploadProofOfDeliveryCommand, UploadProofOfDeliveryResult>
{
    public async Task<UploadProofOfDeliveryResult> Handle(UploadProofOfDeliveryCommand request, CancellationToken cancellationToken)
    {
        var shipment = await shipmentRepository.GetByIdAsync(request.ShipmentId, request.TenantId);
        if (shipment == null)
            return new UploadProofOfDeliveryResult(false, Message: "Sevkiyat bulunamadı");

        var pod = new ProofOfDelivery
        {
            TenantId = request.TenantId,
            ShipmentId = request.ShipmentId,
            PhotoPath = request.PhotoPath,
            SignaturePath = request.SignaturePath,
            RecipientName = request.RecipientName,
            Notes = request.Notes,
            Lat = request.Lat,
            Lng = request.Lng,
            CapturedAt = DateTime.UtcNow,
            CreatedBy = request.UserId
        };

        var id = await podRepository.CreateAsync(pod);
        return new UploadProofOfDeliveryResult(true, id, "Teslimat kanıtı kaydedildi");
    }
}
