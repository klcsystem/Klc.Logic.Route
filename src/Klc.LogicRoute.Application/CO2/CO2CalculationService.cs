using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Application.CO2;

public class CO2CalculationService : ICO2CalculationService
{
    // GLEC Framework emission factors (gCO2e per tonne-km)
    private static readonly Dictionary<VehicleCategory, decimal> EmissionFactors = new()
    {
        [VehicleCategory.Kamyonet] = 0.350m,    // 350 g/tkm
        [VehicleCategory.Kamyon] = 0.150m,       // 150 g/tkm
        [VehicleCategory.Tir] = 0.062m,          // 62 g/tkm
        [VehicleCategory.Parsiyel] = 0.200m,     // 200 g/tkm (paylasilmis)
        [VehicleCategory.Frigorifik] = 0.180m,   // 180 g/tkm (sogutma ek)
        [VehicleCategory.Tanker] = 0.080m,       // 80 g/tkm
        [VehicleCategory.LowBed] = 0.100m,       // 100 g/tkm
        [VehicleCategory.Konteyner] = 0.070m     // 70 g/tkm
    };

    public CO2Result Calculate(decimal distanceKm, decimal weightKg, VehicleCategory vehicle)
    {
        var factor = EmissionFactors.GetValueOrDefault(vehicle, 0.150m);
        var weightTonnes = weightKg / 1000m;

        // CO2 = distance_km * weight_tonnes * emission_factor
        var co2Kg = distanceKm * weightTonnes * factor;
        var co2PerKgKm = distanceKm > 0 && weightKg > 0
            ? co2Kg / (distanceKm * weightKg)
            : 0m;

        return new CO2Result(
            CO2Kg: Math.Round(co2Kg, 2),
            CO2PerKgKm: Math.Round(co2PerKgKm, 6),
            VehicleType: vehicle.ToString(),
            CalculationMethod: "GLEC Framework v3.0"
        );
    }
}
