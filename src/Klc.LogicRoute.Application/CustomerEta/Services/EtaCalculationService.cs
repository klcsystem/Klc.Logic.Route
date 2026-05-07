namespace Klc.LogicRoute.Application.CustomerEta.Services;

public interface IEtaCalculationService
{
    DateTime? CalculateEta(double fromLat, double fromLng, double toLat, double toLng, double averageSpeedKmh = 60.0);
}

public class EtaCalculationService : IEtaCalculationService
{
    public DateTime? CalculateEta(double fromLat, double fromLng, double toLat, double toLng, double averageSpeedKmh = 60.0)
    {
        var distanceKm = HaversineDistance(fromLat, fromLng, toLat, toLng);
        if (distanceKm < 0.1) return DateTime.UtcNow;

        var hours = distanceKm / averageSpeedKmh;
        return DateTime.UtcNow.AddHours(hours);
    }

    private static double HaversineDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371.0;
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;
}
