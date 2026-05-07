namespace Klc.LogicRoute.Domain.Interfaces;

public interface IDistanceMatrixProvider
{
    Task<DistanceMatrixResult> GetDistanceMatrixAsync(DistanceMatrixPoint[] points, CancellationToken cancellationToken = default);
}

public record DistanceMatrixPoint(double Lat, double Lng);

public record DistanceMatrixResult(double[,] Distances, double[,] Durations);
