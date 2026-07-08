using System.Globalization;
using System.Text.Json;
using Dapper;
using Klc.LogicRoute.Application.Common.Geo;
using Klc.LogicRoute.Infrastructure.Persistence;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Infrastructure.ExternalServices.Traffic;

public record IbbImportResult(int RecordsProcessed, int CellsWritten, int Pages);

/// <summary>
/// İBB Açık Veri "hourly traffic density" veri setinden (CKAN datastore API) trafik
/// verisini çeker, geohash6 x haftalık-saat bazında ortalama hıza indirger,
/// hücre başına serbest-akış referansını hesaplar ve logistics.traffic_speed_profiles'a upsert eder.
///
/// Veri seti geçmiş/aylık (canlı değil) — bu yüzden tipik hız PROFİLİ çıkarmak için birebir uygun.
/// resourceId: data.ibb.gov.tr üzerindeki aylık kaynak id'si.
/// </summary>
public class IbbTrafficImportService
{
    private readonly HttpClient _httpClient;
    private readonly IPostgresConnectionFactory _connectionFactory;
    private readonly ILogger<IbbTrafficImportService> _logger;
    private readonly string _baseUrl;

    public IbbTrafficImportService(
        HttpClient httpClient,
        IPostgresConnectionFactory connectionFactory,
        IConfiguration configuration,
        ILogger<IbbTrafficImportService> logger)
    {
        _httpClient = httpClient;
        _connectionFactory = connectionFactory;
        _logger = logger;
        _baseUrl = configuration["Traffic:IbbBaseUrl"] ?? "https://data.ibb.gov.tr";
    }

    public async Task<IbbImportResult> ImportAsync(
        string resourceId, int maxRecords = 100_000, CancellationToken cancellationToken = default)
    {
        const int pageSize = 1000;
        // (geohash, hourOfWeek) -> (agirlikli hiz toplami, agirlik toplami)
        var agg = new Dictionary<(string Geo, int How), (double SpeedSum, double Weight)>();
        var processed = 0;
        var pages = 0;

        for (var offset = 0; offset < maxRecords; offset += pageSize)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var url = $"{_baseUrl.TrimEnd('/')}/api/3/action/datastore_search?resource_id={resourceId}&limit={pageSize}&offset={offset}";

            using var resp = await _httpClient.GetAsync(url, cancellationToken);
            resp.EnsureSuccessStatusCode();
            await using var stream = await resp.Content.ReadAsStreamAsync(cancellationToken);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

            if (!doc.RootElement.TryGetProperty("result", out var result) ||
                !result.TryGetProperty("records", out var records) ||
                records.GetArrayLength() == 0)
                break;

            pages++;
            foreach (var rec in records.EnumerateArray())
            {
                var geohash = GetString(rec, "GEOHASH");
                var dateStr = GetString(rec, "DATE_TIME");
                if (string.IsNullOrEmpty(geohash) || string.IsNullOrEmpty(dateStr))
                    continue;

                if (!TryGetDouble(rec, "AVERAGE_SPEED", out var speed) || speed <= 0 || speed > 200)
                    continue;
                if (!DateTime.TryParse(dateStr, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
                    continue;

                var weight = TryGetDouble(rec, "NUMBER_OF_VEHICLES", out var w) && w > 0 ? w : 1.0;
                var how = GeoHash.HourOfWeek(dt);
                var key = (geohash.Length > 6 ? geohash[..6] : geohash, how);

                if (agg.TryGetValue(key, out var cur))
                    agg[key] = (cur.SpeedSum + speed * weight, cur.Weight + weight);
                else
                    agg[key] = (speed * weight, weight);

                processed++;
            }

            if (records.GetArrayLength() < pageSize)
                break;
        }

        var cellsWritten = await PersistAsync(agg, cancellationToken);
        _logger.LogInformation(
            "İBB trafik import: {Records} kayıt, {Cells} hücre/saat, {Pages} sayfa (resource {Rid})",
            processed, cellsWritten, pages, resourceId);
        return new IbbImportResult(processed, cellsWritten, pages);
    }

    private async Task<int> PersistAsync(
        Dictionary<(string Geo, int How), (double SpeedSum, double Weight)> agg,
        CancellationToken cancellationToken)
    {
        if (agg.Count == 0)
            return 0;

        // Önce (geohash, how) -> ortalama hız; sonra geohash -> serbest-akış (en az yoğun saat).
        var hourly = agg.ToDictionary(kv => kv.Key, kv => kv.Value.SpeedSum / kv.Value.Weight);
        var freeFlow = new Dictionary<string, double>();
        foreach (var ((geo, _), avg) in hourly)
        {
            if (!freeFlow.TryGetValue(geo, out var f) || avg > f)
                freeFlow[geo] = avg;
        }

        var paramList = hourly.Select(kv => new
        {
            Geohash = kv.Key.Geo,
            HourOfWeek = (short)kv.Key.How,
            AvgSpeedKmh = (float)Math.Round(kv.Value, 2),
            FreeFlowKmh = (float)Math.Round(freeFlow[kv.Key.Geo], 2),
            SampleCount = (int)Math.Round(agg[kv.Key].Weight)
        }).ToList();

        const string sql = @"
            INSERT INTO logistics.traffic_speed_profiles
                (geohash, hour_of_week, avg_speed_kmh, free_flow_kmh, sample_count, updated_at)
            VALUES (@Geohash, @HourOfWeek, @AvgSpeedKmh, @FreeFlowKmh, @SampleCount, NOW())
            ON CONFLICT (geohash, hour_of_week) DO UPDATE SET
                avg_speed_kmh = EXCLUDED.avg_speed_kmh,
                free_flow_kmh = EXCLUDED.free_flow_kmh,
                sample_count  = EXCLUDED.sample_count,
                updated_at    = NOW();";

        await using var conn = _connectionFactory.CreateConnection();
        await conn.OpenAsync(cancellationToken);
        await using var tx = await conn.BeginTransactionAsync(cancellationToken);
        await conn.ExecuteAsync(sql, paramList, tx);
        await tx.CommitAsync(cancellationToken);
        return paramList.Count;
    }

    private static string GetString(JsonElement rec, string name)
        => rec.TryGetProperty(name, out var v) ? v.GetString() ?? "" : "";

    private static bool TryGetDouble(JsonElement rec, string name, out double value)
    {
        value = 0;
        if (!rec.TryGetProperty(name, out var v))
            return false;
        var s = v.ValueKind == JsonValueKind.String ? v.GetString() : v.ToString();
        return double.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out value);
    }
}
