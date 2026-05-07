using Klc.LogicRoute.Domain.Interfaces;
using MediatR;

namespace Klc.LogicRoute.Application.CustomerEta.Queries;

public record GetPublicTrackingQuery(string Token) : IRequest<PublicTrackingResult?>;

public record PublicTrackingResult(
    string ShipmentNumber,
    string Status,
    string? OriginCity,
    string? DestinationCity,
    decimal? CurrentLatitude,
    decimal? CurrentLongitude,
    DateTime? EstimatedArrival,
    DateTime? LastEtaUpdate,
    string? DriverName,
    string? VehiclePlate,
    List<StatusTimelineEntry> Timeline);

public record StatusTimelineEntry(string Status, DateTime Timestamp);

public class GetPublicTrackingHandler(
    ICustomerTrackingRepository customerTrackingRepository,
    IShipmentRepository shipmentRepository) : IRequestHandler<GetPublicTrackingQuery, PublicTrackingResult?>
{
    public async Task<PublicTrackingResult?> Handle(GetPublicTrackingQuery request, CancellationToken cancellationToken)
    {
        var tracking = await customerTrackingRepository.GetByTokenAsync(request.Token);
        if (tracking == null || !tracking.IsActive)
            return null;

        var shipment = await shipmentRepository.GetByIdAsync(tracking.ShipmentId, tracking.TenantId);
        if (shipment == null)
            return null;

        // Build status timeline based on shipment dates
        var timeline = new List<StatusTimelineEntry>();
        if (shipment.CreatedAt != default)
            timeline.Add(new StatusTimelineEntry("Oluşturuldu", shipment.CreatedAt));
        if (shipment.ActualPickupDate.HasValue)
            timeline.Add(new StatusTimelineEntry("Yüklendi", shipment.ActualPickupDate.Value));
        if (shipment.Status >= Domain.Enums.ShipmentStatus.InTransit)
            timeline.Add(new StatusTimelineEntry("Yolda", shipment.LastTrackingUpdate ?? DateTime.UtcNow));
        if (shipment.ActualDeliveryDate.HasValue)
            timeline.Add(new StatusTimelineEntry("Teslim Edildi", shipment.ActualDeliveryDate.Value));

        return new PublicTrackingResult(
            ShipmentNumber: shipment.ShipmentNumber,
            Status: shipment.Status.ToString(),
            OriginCity: shipment.OriginCity,
            DestinationCity: shipment.DestinationCity,
            CurrentLatitude: shipment.CurrentLatitude,
            CurrentLongitude: shipment.CurrentLongitude,
            EstimatedArrival: tracking.EstimatedArrival,
            LastEtaUpdate: tracking.LastEtaUpdate,
            DriverName: shipment.DriverName,
            VehiclePlate: shipment.VehiclePlate,
            Timeline: timeline);
    }
}
