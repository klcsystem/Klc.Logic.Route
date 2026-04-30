using Klc.LogicRoute.Domain.Entities;
using Klc.LogicRoute.Domain.Enums;

namespace Klc.LogicRoute.Application.CargoCalculation;

public class CargoCalculationService : ICargoCalculationService
{
    public CargoDetail Calculate(Order order)
    {
        var actualWeight = order.TotalWeightKg;
        var totalVolume = order.TotalVolumeM3;
        var totalDesi = 0m;

        foreach (var line in order.Lines)
        {
            if (line.WidthCm > 0 && line.HeightCm > 0 && line.DepthCm > 0)
                totalDesi += line.WidthCm * line.HeightCm * line.DepthCm / 3000m * line.Quantity;
        }

        // Volumetric weight: volume_m3 * 333 (standart kargo donusum faktoru)
        var volumetricWeight = totalVolume * 333m;

        // Chargeable weight = max(actual, volumetric)
        var chargeableWeight = Math.Max(actualWeight, volumetricWeight);

        // Vehicle suggestion
        var suggestedVehicle = SuggestVehicle(chargeableWeight, totalVolume, order.PalletCount,
            order.RequiresColdChain, order.IsHazardous);

        // Load type suggestion
        var suggestedLoadType = SuggestLoadType(chargeableWeight, totalVolume, order.PalletCount, suggestedVehicle);

        var notes = new List<string>();
        if (volumetricWeight > actualWeight)
            notes.Add($"Hacimsel agirlik ({volumetricWeight:F1} kg) > gercek agirlik ({actualWeight:F1} kg), hacimsel baz alinir");
        if (order.IsHazardous)
            notes.Add("ADR tehlikeli madde tasimaciligi gerekli");
        if (order.RequiresColdChain)
            notes.Add($"Soguk zincir gerekli ({order.TemperatureMin}C - {order.TemperatureMax}C)");

        return new CargoDetail
        {
            OrderId = order.Id,
            TenantId = order.TenantId,
            ActualWeightKg = actualWeight,
            VolumetricWeightKg = volumetricWeight,
            ChargeableWeightKg = chargeableWeight,
            TotalVolumeM3 = totalVolume,
            TotalPallets = order.PalletCount,
            TotalDesi = totalDesi,
            SuggestedVehicle = suggestedVehicle,
            SuggestedLoadType = suggestedLoadType,
            IsHazardous = order.IsHazardous,
            RequiresColdChain = order.RequiresColdChain,
            CalculationNotes = string.Join("; ", notes)
        };
    }

    private static VehicleCategory SuggestVehicle(decimal chargeableWeight, decimal volume, int pallets,
        bool coldChain, bool hazardous)
    {
        if (coldChain) return VehicleCategory.Frigorifik;
        if (hazardous) return VehicleCategory.Tanker;

        return chargeableWeight switch
        {
            <= 1500 => VehicleCategory.Kamyonet,
            <= 8000 => VehicleCategory.Kamyon,
            <= 24000 => VehicleCategory.Tir,
            _ => VehicleCategory.Tir
        };
    }

    private static LoadType SuggestLoadType(decimal chargeableWeight, decimal volume, int pallets,
        VehicleCategory vehicle)
    {
        if (vehicle == VehicleCategory.Tir && chargeableWeight >= 20000)
            return LoadType.FTL;
        if (chargeableWeight <= 100 && pallets <= 1)
            return LoadType.Parcel;
        return LoadType.LTL;
    }
}
