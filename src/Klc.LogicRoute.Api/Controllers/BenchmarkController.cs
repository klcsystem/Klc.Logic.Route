using Klc.LogicRoute.Application.Common.Models;
using Klc.LogicRoute.Application.RouteOptimization.Models;
using Klc.LogicRoute.Application.RouteOptimization.Services;
using Klc.LogicRoute.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klc.LogicRoute.Api.Controllers;

/// <summary>
/// "Önce/sonra" rota optimizasyon benchmark'ı — akademik CVRP çalışmasının (7 araç /
/// 51 müşteri → ~%14) yapısını CANLI motorumuzla (OSRM + İBB trafik + OR-Tools) tekrarlar.
/// Şimdilik gerçekçi bir İstanbul ekmek-dağıtım senaryosu üretir; gerçek Estaş verisi
/// hazır olduğunda aynı akışa gerçek duraklar/araçlar beslenir.
/// </summary>
[ApiController]
[Route("api/benchmark")]
[Authorize]
public class BenchmarkController(
    IVrpSolverService vrpSolver,
    IDistanceMatrixProvider matrixProvider) : ControllerBase
{
    // Gerçek İstanbul ilçe merkezleri — duraklar bunların etrafına serpilir (denize düşmesin, yolda kalsın).
    private static readonly (double Lat, double Lng)[] Anchors =
    {
        (40.9905, 29.0256), // Kadıköy
        (41.0227, 29.0155), // Üsküdar
        (41.0422, 29.0083), // Beşiktaş
        (41.0602, 28.9877), // Şişli
        (40.9819, 28.8772), // Bakırköy
        (41.0186, 28.9497), // Fatih
        (41.0369, 28.9769), // Beyoğlu
        (40.9351, 29.1310), // Maltepe
        (41.0166, 29.1244), // Ümraniye
        (41.0345, 28.8560), // Bağcılar
    };

    private static readonly (double Lat, double Lng) Depot = (41.0110, 28.9020); // Zeytinburnu — depo

    [HttpPost("bakery")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> BakeryBenchmark(
        [FromQuery] int stops = 51, [FromQuery] int vehicles = 7, CancellationToken ct = default)
    {
        if (stops is < 1 or > 200 || vehicles is < 1 or > 30)
            return BadRequest(ApiResponse<object>.Fail("stops 1-200, vehicles 1-30 aralığında olmalı"));

        var rng = new Random(42); // tekrarlanabilir senaryo
        var stopList = new List<VrpStop>(stops);
        var points = new List<DistanceMatrixPoint> { new(Depot.Lat, Depot.Lng) }; // index 0 = depo

        for (var i = 0; i < stops; i++)
        {
            var a = Anchors[i % Anchors.Length];
            var lat = a.Lat + (rng.NextDouble() - 0.5) * 0.02; // ~±1.1km
            var lng = a.Lng + (rng.NextDouble() - 0.5) * 0.02;
            var weight = 20m + (decimal)(rng.NextDouble() * 40); // 20-60 kg ekmek
            stopList.Add(new VrpStop(Guid.NewGuid(), lat, lng, weight, 0m, null, null, ServiceMinutes: 10));
            points.Add(new DistanceMatrixPoint(lat, lng));
        }

        // Tek matris çek (trafik-farkında) — hem naive hem OR-Tools aynı yolları görsün.
        var matrix = await matrixProvider.GetDistanceMatrixAsync(points.ToArray(), ct);

        // ÖNCE (baseline = nearest-neighbor): deneyimli bir sevkiyatçının elle kurduğu
        // "makul ama optimal olmayan" rotaların gerçekçi vekili. Her araç depodan başlar,
        // kapasite dolana dek en yakın bir sonraki durağa gider, sonra depoya döner.
        const double capKg = 500;
        var visited = new bool[stops + 1];
        var remaining = stops;
        double beforeKm = 0, beforeMin = 0;
        for (var v = 0; v < vehicles && remaining > 0; v++)
        {
            var prev = 0; // depo
            double loadKg = 0;
            while (true)
            {
                var best = -1;
                var bestD = double.MaxValue;
                for (var j = 1; j <= stops; j++)
                {
                    if (visited[j] || loadKg + (double)stopList[j - 1].WeightKg > capKg) continue;
                    var d = matrix.Distances[prev, j];
                    if (d < bestD) { bestD = d; best = j; }
                }
                if (best < 0) break;
                visited[best] = true;
                remaining--;
                beforeKm += matrix.Distances[prev, best];
                beforeMin += matrix.Durations[prev, best] + stopList[best - 1].ServiceMinutes; // seyahat + servis (OR-Tools ile aynı temel)
                loadKg += (double)stopList[best - 1].WeightKg;
                prev = best;
            }
            if (prev != 0)
            {
                beforeKm += matrix.Distances[prev, 0];
                beforeMin += matrix.Durations[prev, 0];
            }
        }

        // SONRA (OR-Tools): aynı senaryo, gerçek optimizasyon.
        var vrpVehicles = Enumerable.Range(0, vehicles)
            .Select(v => new VrpVehicle(Guid.NewGuid(), $"34 BREAD {v + 1:00}", 500m, 100m, Depot.Lat, Depot.Lng))
            .ToList();
        var result = await vrpSolver.SolveAsync(new VrpRequest(vrpVehicles, stopList), ct);

        var afterKm = result.TotalDistance;
        var afterMin = result.TotalDuration;
        var kmGain = beforeKm > 0 ? Math.Round((beforeKm - afterKm) / beforeKm * 100, 1) : 0;
        var minGain = beforeMin > 0 ? Math.Round((beforeMin - afterMin) / beforeMin * 100, 1) : 0;

        return Ok(ApiResponse<object>.Ok(new
        {
            senaryo = new { duraklar = stops, araclar = vehicles, sehir = "İstanbul (ekmek dağıtım)", trafikFarkinda = true },
            once = new { toplamKm = Math.Round(beforeKm, 1), toplamDakika = Math.Round(beforeMin, 0) },
            sonra = new
            {
                toplamKm = Math.Round(afterKm, 1),
                toplamDakika = Math.Round(afterMin, 0),
                kullanilanArac = result.Routes.Count,
                atanamayanDurak = result.UnservedStops.Count
            },
            iyilesme = new { mesafeYuzde = kmGain, sureYuzde = minGain },
            baseline = "nearest-neighbor (deneyimli sevkiyatçı vekili)",
            not = "Akademik CVRP benchmark'ı (7 araç/51 müşteri ~%14) yapısı — gerçek Estaş mevcut rotaları/verisi hazır olunca aynı endpoint'e beslenir; asıl kıyas o zaman kesinleşir."
        }));
    }
}
