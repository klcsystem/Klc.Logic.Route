using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Interfaces;

namespace Klc.LogicRoute.Application.Fleet;

public interface IHybridFleetService
{
    Task<FleetCapacityResult> GetAvailableCapacityAsync(Guid tenantId, DateTime date, string region);
    Task<FleetMixRecommendation> RecommendFleetMixAsync(Guid tenantId, List<FleetOrder> orders);
}

public class HybridFleetService(
    IVehicleRepository vehicleRepository,
    ICarrierNetworkRepository carrierNetworkRepository) : IHybridFleetService
{
    public async Task<FleetCapacityResult> GetAvailableCapacityAsync(Guid tenantId, DateTime date, string region)
    {
        // Get own fleet vehicles
        var ownVehicles = await vehicleRepository.GetAllAsync(tenantId);
        var ownAvailable = ownVehicles.Count;

        // Get active 3P carriers for region
        var carriers = await carrierNetworkRepository.GetActiveByRegionAsync(tenantId, region);
        var carrierList = carriers.ToList();
        var thirdPartyAvailable = carrierList.Count * 3; // Estimate ~3 vehicles per carrier

        return new FleetCapacityResult
        {
            Date = date,
            Region = region,
            OwnFleetAvailable = ownAvailable,
            ThirdPartyAvailable = thirdPartyAvailable,
            TotalCapacity = ownAvailable + thirdPartyAvailable,
            Carriers = carrierList.Select(c => new CarrierCapacitySummary
            {
                CarrierId = c.Id,
                CarrierName = c.CarrierName,
                PricingModel = c.PricingModel.ToString(),
                VehicleTypes = c.VehicleTypes
            }).ToList()
        };
    }

    public async Task<FleetMixRecommendation> RecommendFleetMixAsync(Guid tenantId, List<FleetOrder> orders)
    {
        var ownVehicles = await vehicleRepository.GetAllAsync(tenantId);
        var ownCapacity = ownVehicles.Count;

        var totalOrdersCount = orders.Count;
        var ownFleetOrders = new List<FleetOrder>();
        var thirdPartyOrders = new List<FleetOrderAssignment>();

        // Assign to own fleet first (cheaper), overflow to 3P
        foreach (var order in orders.Take(ownCapacity))
        {
            ownFleetOrders.Add(order);
        }

        var overflowOrders = orders.Skip(ownCapacity).ToList();
        if (overflowOrders.Count > 0)
        {
            // Find carriers for overflow regions
            var regions = overflowOrders.Select(o => o.Region).Distinct();
            foreach (var region in regions)
            {
                var regionOrders = overflowOrders.Where(o => o.Region == region).ToList();
                var carriers = (await carrierNetworkRepository.GetActiveByRegionAsync(tenantId, region)).ToList();

                if (carriers.Count > 0)
                {
                    // Distribute across available carriers
                    for (int i = 0; i < regionOrders.Count; i++)
                    {
                        var carrier = carriers[i % carriers.Count];
                        thirdPartyOrders.Add(new FleetOrderAssignment
                        {
                            Order = regionOrders[i],
                            CarrierId = carrier.Id,
                            CarrierName = carrier.CarrierName,
                            PricingModel = carrier.PricingModel.ToString()
                        });
                    }
                }
                else
                {
                    // No carrier available — still assign to own fleet overflow
                    ownFleetOrders.AddRange(regionOrders);
                }
            }
        }

        return new FleetMixRecommendation
        {
            TotalOrders = totalOrdersCount,
            OwnFleetCount = ownFleetOrders.Count,
            ThirdPartyCount = thirdPartyOrders.Count,
            OwnFleetOrders = ownFleetOrders,
            ThirdPartyAssignments = thirdPartyOrders,
            CostEstimate = new CostEstimate
            {
                OwnFleetCost = ownFleetOrders.Count * 50m, // Base cost estimate
                ThirdPartyCost = thirdPartyOrders.Count * 80m,
                TotalCost = (ownFleetOrders.Count * 50m) + (thirdPartyOrders.Count * 80m)
            }
        };
    }
}

// DTOs
public class FleetCapacityResult
{
    public DateTime Date { get; set; }
    public string Region { get; set; } = string.Empty;
    public int OwnFleetAvailable { get; set; }
    public int ThirdPartyAvailable { get; set; }
    public int TotalCapacity { get; set; }
    public List<CarrierCapacitySummary> Carriers { get; set; } = [];
}

public class CarrierCapacitySummary
{
    public Guid CarrierId { get; set; }
    public string CarrierName { get; set; } = string.Empty;
    public string PricingModel { get; set; } = string.Empty;
    public string? VehicleTypes { get; set; }
}

public class FleetOrder
{
    public Guid OrderId { get; set; }
    public string Region { get; set; } = string.Empty;
    public decimal WeightKg { get; set; }
}

public class FleetOrderAssignment
{
    public FleetOrder Order { get; set; } = new();
    public Guid CarrierId { get; set; }
    public string CarrierName { get; set; } = string.Empty;
    public string PricingModel { get; set; } = string.Empty;
}

public class FleetMixRecommendation
{
    public int TotalOrders { get; set; }
    public int OwnFleetCount { get; set; }
    public int ThirdPartyCount { get; set; }
    public List<FleetOrder> OwnFleetOrders { get; set; } = [];
    public List<FleetOrderAssignment> ThirdPartyAssignments { get; set; } = [];
    public CostEstimate CostEstimate { get; set; } = new();
}

public class CostEstimate
{
    public decimal OwnFleetCost { get; set; }
    public decimal ThirdPartyCost { get; set; }
    public decimal TotalCost { get; set; }
}
