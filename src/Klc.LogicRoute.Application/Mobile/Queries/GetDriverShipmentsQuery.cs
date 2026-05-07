using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;
using MediatR;

namespace Klc.LogicRoute.Application.Mobile.Queries;

public record GetDriverShipmentsQuery(Guid DriverId, Guid TenantId) : IRequest<IEnumerable<Shipment>>;

public class GetDriverShipmentsHandler(
    IShipmentRepository shipmentRepository,
    IDriverRepository driverRepository) : IRequestHandler<GetDriverShipmentsQuery, IEnumerable<Shipment>>
{
    public async Task<IEnumerable<Shipment>> Handle(GetDriverShipmentsQuery request, CancellationToken cancellationToken)
    {
        var driver = await driverRepository.GetByIdAsync(request.DriverId);
        if (driver == null || !driver.IsActive)
            return [];

        // Get all shipments for the driver's tenant, filtered by driver assignment
        var allShipments = await shipmentRepository.GetAllAsync(request.TenantId, 1, 200);
        return allShipments.Where(s =>
            s.DriverName == driver.FullName &&
            s.Status != Domain.Enums.ShipmentStatus.Cancelled &&
            s.Status != Domain.Enums.ShipmentStatus.Completed &&
            !s.IsDeleted);
    }
}
