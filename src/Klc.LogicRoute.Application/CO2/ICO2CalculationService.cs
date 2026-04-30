using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Application.CO2;

public interface ICO2CalculationService
{
    CO2Result Calculate(decimal distanceKm, decimal weightKg, VehicleCategory vehicle);
}

public record CO2Result(decimal CO2Kg, decimal CO2PerKgKm, string VehicleType, string CalculationMethod);
