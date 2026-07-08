using System.Collections.Concurrent;
using Dapper;
using Klc.LogicRoute.Application.Common.Geo;
using Klc.LogicRoute.Domain.Interfaces;
using Klc.LogicRoute.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Infrastructure.ExternalServices.Traffic;

/// <summary>
/// logistics.traffic_speed_profiles tablosundan (Ibb + kendi ogrenme ile doldurulur)
/// geohash6 x haftalik-saat bazli sure carpanini saglar. Tablo bellekte cache'lenir
/// ve periyodik yenilenir. Tablo bossa null doner (cagiran global carpana duser).
/// </summary>
public class IbbTrafficProfileProvider : ITrafficProfileProvider
{
    private readonly IPostgresConnectionFactory _connectionFactory;
    private readonly ILogger<IbbTrafficProfileProvider> _logger;

    private readonly SemaphoreSlim _refreshLock = new(1, 1);
    private volatile Dictionary<string, double> _cache = new();
    private DateTime _loadedAtUtc = DateTime.MinValue;
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(30);

    // Carpan sinirlari: OSRM suresi zaten kabaca serbest-akis oldugu icin trafik
    // yalnizca YAVASLATIR -> alt sinir 1.0. Ust sinir asiri degerleri kirpar.
    private const double MinMultiplier = 1.0;
    private const double MaxMultiplier = 2.5;

    public IbbTrafficProfileProvider(
        IPostgresConnectionFactory connectionFactory,
        ILogger<IbbTrafficProfileProvider> logger)
    {
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

    public async Task<double?> GetSpeedMultiplierAsync(
        double lat, double lng, DateTime localTime, CancellationToken cancellationToken = default)
    {
        var cache = await GetCacheAsync(cancellationToken);
        if (cache.Count == 0)
            return null;

        var geohash = GeoHash.Encode(lat, lng, 6);
        var how = GeoHash.HourOfWeek(localTime);

        return cache.TryGetValue($"{geohash}:{how}", out var m) ? m : null;
    }

    public async Task<int> GetProfileCountAsync(CancellationToken cancellationToken = default)
    {
        await using var conn = _connectionFactory.CreateConnection();
        await conn.OpenAsync(cancellationToken);
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*)::int FROM logistics.traffic_speed_profiles");
    }

    private async Task<Dictionary<string, double>> GetCacheAsync(CancellationToken cancellationToken)
    {
        if (DateTime.UtcNow - _loadedAtUtc < CacheTtl)
            return _cache;

        await _refreshLock.WaitAsync(cancellationToken);
        try
        {
            if (DateTime.UtcNow - _loadedAtUtc < CacheTtl)
                return _cache;

            await using var conn = _connectionFactory.CreateConnection();
            await conn.OpenAsync(cancellationToken);
            var rows = await conn.QueryAsync<TrafficProfileRow>(
                "SELECT geohash, hour_of_week, avg_speed_kmh, free_flow_kmh FROM logistics.traffic_speed_profiles");

            var map = new Dictionary<string, double>();
            foreach (var r in rows)
            {
                var speed = r.AvgSpeedKmh <= 0 ? 1.0 : r.AvgSpeedKmh;
                var mult = Math.Clamp(r.FreeFlowKmh / speed, MinMultiplier, MaxMultiplier);
                map[$"{r.Geohash}:{r.HourOfWeek}"] = mult;
            }

            _cache = map;
            _loadedAtUtc = DateTime.UtcNow;
            _logger.LogInformation("Trafik profili yuklendi: {Count} hucre/saat girdisi", map.Count);
            return _cache;
        }
        finally
        {
            _refreshLock.Release();
        }
    }

    private sealed class TrafficProfileRow
    {
        public string Geohash { get; set; } = "";
        public int HourOfWeek { get; set; }
        public double AvgSpeedKmh { get; set; }
        public double FreeFlowKmh { get; set; }
    }
}
