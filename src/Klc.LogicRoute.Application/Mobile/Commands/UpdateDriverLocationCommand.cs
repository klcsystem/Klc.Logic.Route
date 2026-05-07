using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using MediatR;

namespace Klc.LogicRoute.Application.Mobile.Commands;

public record UpdateDriverLocationCommand(
    Guid DriverId,
    Guid TenantId,
    List<LocationPoint> Points) : IRequest<UpdateDriverLocationResult>;

public record LocationPoint(
    Guid? ShipmentId,
    double Lat,
    double Lng,
    double? Speed,
    double? Heading,
    double? Accuracy,
    DateTime? RecordedAt);

public record UpdateDriverLocationResult(bool Success, int SavedCount);

public class UpdateDriverLocationHandler(
    IDriverLocationRepository driverLocationRepository) : IRequestHandler<UpdateDriverLocationCommand, UpdateDriverLocationResult>
{
    public async Task<UpdateDriverLocationResult> Handle(UpdateDriverLocationCommand request, CancellationToken cancellationToken)
    {
        var locations = request.Points.Select(p => new DriverLocation
        {
            TenantId = request.TenantId,
            DriverId = request.DriverId,
            ShipmentId = p.ShipmentId,
            Lat = p.Lat,
            Lng = p.Lng,
            Speed = p.Speed,
            Heading = p.Heading,
            Accuracy = p.Accuracy,
            RecordedAt = p.RecordedAt ?? DateTime.UtcNow
        }).ToList();

        await driverLocationRepository.CreateBatchAsync(locations);

        return new UpdateDriverLocationResult(true, locations.Count);
    }
}
