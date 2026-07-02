using System.Diagnostics;
using Klc.LogicRoute.Application.TerritoryPlanning.Models;

namespace Klc.LogicRoute.Application.TerritoryPlanning;

/// <summary>
/// K-means clustering service for geographic territory planning.
/// Uses Haversine distance, K-means++ initialization, and workload balancing.
/// </summary>
public class TerritoryPlanningService : ITerritoryPlanningService
{
    private static readonly string[] ZoneColors =
    {
        "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
        "#FF9F40", "#C9CBCF", "#7BC67E", "#E57373", "#64B5F6",
        "#81C784", "#FFD54F", "#BA68C8", "#4DD0E1", "#A1887F",
        "#90A4AE", "#F06292", "#AED581", "#FFB74D", "#CE93D8"
    };

    private const double EarthRadiusKm = 6371.0;

    public Task<TerritoryPlanResult> PlanAsync(List<DeliveryPoint> points, int zoneCount, TerritoryPlanRequest options)
    {
        if (points.Count == 0)
            throw new ArgumentException("En az bir teslimat noktası gereklidir.");

        if (zoneCount <= 0)
            throw new ArgumentException("Bölge sayısı 1 veya daha fazla olmalıdır.");

        if (zoneCount > points.Count)
            zoneCount = points.Count;

        var sw = Stopwatch.StartNew();

        // K-means++ initialization
        var centroids = InitializeCentroidsKMeansPlusPlus(points, zoneCount);

        // K-means iteration
        var assignments = new int[points.Count];
        bool converged = false;
        int iterations = 0;

        for (int iter = 0; iter < options.MaxIterations; iter++)
        {
            iterations++;
            bool changed = false;

            // Assignment step: assign each point to nearest centroid
            for (int i = 0; i < points.Count; i++)
            {
                int nearest = FindNearestCentroid(points[i], centroids);
                if (nearest != assignments[i])
                {
                    assignments[i] = nearest;
                    changed = true;
                }
            }

            if (!changed)
            {
                converged = true;
                break;
            }

            // Update step: recalculate centroids
            centroids = RecalculateCentroids(points, assignments, zoneCount, centroids);
        }

        // Post-process: balance workload across clusters
        if (options.BalanceWorkload && zoneCount > 1)
        {
            assignments = BalanceWorkload(points, assignments, centroids, zoneCount, options.BalanceWeight);
            // Final centroid update after balancing
            centroids = RecalculateCentroids(points, assignments, zoneCount, centroids);
        }

        // Build result
        var result = BuildResult(points, assignments, centroids, zoneCount, iterations, converged);
        sw.Stop();
        result.ComputeTimeMs = sw.ElapsedMilliseconds;

        return Task.FromResult(result);
    }

    /// <summary>
    /// K-means++ initialization: select initial centroids with probability
    /// proportional to squared distance from nearest existing centroid.
    /// </summary>
    private (double Lat, double Lng)[] InitializeCentroidsKMeansPlusPlus(List<DeliveryPoint> points, int k)
    {
        var rng = new Random(42); // deterministic seed for reproducibility
        var centroids = new (double Lat, double Lng)[k];
        var distances = new double[points.Count];

        // Pick first centroid randomly
        int firstIdx = rng.Next(points.Count);
        centroids[0] = (points[firstIdx].Lat, points[firstIdx].Lng);

        for (int c = 1; c < k; c++)
        {
            double totalDist = 0;

            // Calculate squared distance from each point to nearest existing centroid
            for (int i = 0; i < points.Count; i++)
            {
                double minDist = double.MaxValue;
                for (int j = 0; j < c; j++)
                {
                    double d = HaversineDistance(points[i].Lat, points[i].Lng, centroids[j].Lat, centroids[j].Lng);
                    if (d < minDist) minDist = d;
                }
                distances[i] = minDist * minDist;
                totalDist += distances[i];
            }

            // Weighted random selection
            double threshold = rng.NextDouble() * totalDist;
            double cumulative = 0;
            int selected = points.Count - 1;
            for (int i = 0; i < points.Count; i++)
            {
                cumulative += distances[i];
                if (cumulative >= threshold)
                {
                    selected = i;
                    break;
                }
            }

            centroids[c] = (points[selected].Lat, points[selected].Lng);
        }

        return centroids;
    }

    private int FindNearestCentroid(DeliveryPoint point, (double Lat, double Lng)[] centroids)
    {
        int nearest = 0;
        double minDist = double.MaxValue;

        for (int c = 0; c < centroids.Length; c++)
        {
            double d = HaversineDistance(point.Lat, point.Lng, centroids[c].Lat, centroids[c].Lng);
            if (d < minDist)
            {
                minDist = d;
                nearest = c;
            }
        }

        return nearest;
    }

    private (double Lat, double Lng)[] RecalculateCentroids(
        List<DeliveryPoint> points, int[] assignments, int k, (double Lat, double Lng)[] previousCentroids)
    {
        var centroids = new (double Lat, double Lng)[k];
        var counts = new int[k];

        // Sum coordinates per cluster
        for (int i = 0; i < points.Count; i++)
        {
            int cluster = assignments[i];
            centroids[cluster].Lat += points[i].Lat;
            centroids[cluster].Lng += points[i].Lng;
            counts[cluster]++;
        }

        // Average, or keep previous centroid if cluster is empty
        for (int c = 0; c < k; c++)
        {
            if (counts[c] > 0)
            {
                centroids[c].Lat /= counts[c];
                centroids[c].Lng /= counts[c];
            }
            else
            {
                centroids[c] = previousCentroids[c];
            }
        }

        return centroids;
    }

    /// <summary>
    /// Redistributes points between clusters to equalize total workload (weight).
    /// Moves points from overloaded clusters to underloaded ones if it reduces imbalance.
    /// </summary>
    private int[] BalanceWorkload(
        List<DeliveryPoint> points, int[] assignments,
        (double Lat, double Lng)[] centroids, int k, double balanceWeight)
    {
        var result = (int[])assignments.Clone();
        double avgWorkload = points.Sum(p => p.WeightKg) / k;

        // Multiple passes for convergence
        for (int pass = 0; pass < 10; pass++)
        {
            bool moved = false;
            var clusterWeights = new double[k];
            for (int i = 0; i < points.Count; i++)
                clusterWeights[result[i]] += points[i].WeightKg;

            for (int i = 0; i < points.Count; i++)
            {
                int currentCluster = result[i];
                double currentClusterWeight = clusterWeights[currentCluster];

                // Only consider moving from overloaded clusters
                if (currentClusterWeight <= avgWorkload * 1.1) continue;

                // Find best target cluster
                int bestTarget = -1;
                double bestImprovement = 0;

                for (int c = 0; c < k; c++)
                {
                    if (c == currentCluster) continue;
                    double targetWeight = clusterWeights[c];

                    // Only move to underloaded clusters
                    if (targetWeight >= avgWorkload * 0.95) continue;

                    double distToCurrent = HaversineDistance(points[i].Lat, points[i].Lng,
                        centroids[currentCluster].Lat, centroids[currentCluster].Lng);
                    double distToTarget = HaversineDistance(points[i].Lat, points[i].Lng,
                        centroids[c].Lat, centroids[c].Lng);

                    // Combined score: geographic proximity + workload balance
                    double geoScore = (distToCurrent - distToTarget) / Math.Max(distToCurrent, 0.001);
                    double currentImbalance = Math.Abs(currentClusterWeight - avgWorkload) +
                                              Math.Abs(targetWeight - avgWorkload);
                    double newImbalance = Math.Abs(currentClusterWeight - points[i].WeightKg - avgWorkload) +
                                          Math.Abs(targetWeight + points[i].WeightKg - avgWorkload);
                    double balanceScore = (currentImbalance - newImbalance) / Math.Max(avgWorkload, 0.001);

                    double improvement = (1 - balanceWeight) * geoScore + balanceWeight * balanceScore;

                    if (improvement > bestImprovement)
                    {
                        bestImprovement = improvement;
                        bestTarget = c;
                    }
                }

                if (bestTarget >= 0 && bestImprovement > 0.01)
                {
                    clusterWeights[currentCluster] -= points[i].WeightKg;
                    clusterWeights[bestTarget] += points[i].WeightKg;
                    result[i] = bestTarget;
                    moved = true;
                }
            }

            if (!moved) break;
        }

        return result;
    }

    private TerritoryPlanResult BuildResult(
        List<DeliveryPoint> points, int[] assignments,
        (double Lat, double Lng)[] centroids, int k, int iterations, bool converged)
    {
        var zones = new List<Territory>();
        var stats = new List<ZoneStatistics>();
        double totalWeight = points.Sum(p => p.WeightKg);

        for (int c = 0; c < k; c++)
        {
            var zonePoints = new List<DeliveryPoint>();
            for (int i = 0; i < points.Count; i++)
            {
                if (assignments[i] == c)
                    zonePoints.Add(points[i]);
            }

            double zoneWeight = zonePoints.Sum(p => p.WeightKg);
            double zoneVolume = zonePoints.Sum(p => p.VolumeM3);

            var distances = zonePoints.Select(p =>
                HaversineDistance(p.Lat, p.Lng, centroids[c].Lat, centroids[c].Lng)).ToList();

            var zone = new Territory
            {
                ZoneId = c + 1,
                Name = $"Bölge {c + 1}",
                CentroidLat = centroids[c].Lat,
                CentroidLng = centroids[c].Lng,
                Color = ZoneColors[c % ZoneColors.Length],
                Stops = zonePoints,
                TotalWeightKg = zoneWeight,
                TotalVolumeM3 = zoneVolume,
                StopCount = zonePoints.Count
            };
            zones.Add(zone);

            stats.Add(new ZoneStatistics
            {
                ZoneId = c + 1,
                Name = zone.Name,
                StopCount = zonePoints.Count,
                TotalWeightKg = zoneWeight,
                TotalVolumeM3 = zoneVolume,
                AvgDistanceFromCentroidKm = distances.Count > 0 ? Math.Round(distances.Average(), 2) : 0,
                MaxDistanceFromCentroidKm = distances.Count > 0 ? Math.Round(distances.Max(), 2) : 0,
                WorkloadPercent = totalWeight > 0 ? Math.Round(zoneWeight / totalWeight * 100, 1) : 0
            });
        }

        return new TerritoryPlanResult
        {
            Zones = zones,
            TotalStops = points.Count,
            TotalWeightKg = totalWeight,
            TotalVolumeM3 = points.Sum(p => p.VolumeM3),
            Iterations = iterations,
            Converged = converged,
            Statistics = stats
        };
    }

    /// <summary>
    /// Haversine formula: calculates the great-circle distance between two points on Earth.
    /// </summary>
    private static double HaversineDistance(double lat1, double lng1, double lat2, double lng2)
    {
        double dLat = ToRadians(lat2 - lat1);
        double dLng = ToRadians(lng2 - lng1);

        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                   Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return EarthRadiusKm * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;
}
