using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

namespace Klc.LogicRoute.Infrastructure.ExternalServices.Providers;

public interface IProviderApiAdapter
{
    string ProviderCode { get; }
    Task<bool> TestConnectionAsync(string apiBaseUrl, string apiKey);
    Task<ProviderQuoteResponse?> GetQuoteAsync(string apiBaseUrl, string apiKey, ProviderQuoteRequest request);
    Task<string?> CreateShipmentAsync(string apiBaseUrl, string apiKey, ProviderShipmentRequest request);
    Task<ProviderTrackingResponse?> TrackAsync(string apiBaseUrl, string apiKey, string trackingNumber);
    Task<List<ProviderShipmentStatus>?> GetShipmentsAsync(string apiBaseUrl, string apiKey, int page = 1, int size = 20);
}

public record ProviderQuoteRequest(
    string OriginCity, string DestinationCity,
    decimal WeightKg, decimal VolumeM3, int Pallets,
    bool IsHazardous, bool RequiresColdChain);

public record ProviderQuoteResponse(
    decimal Price, string Currency, string VehicleType, int EstimatedHours);

public record ProviderShipmentRequest(
    string OriginAddress, string OriginCity,
    string DestinationAddress, string DestinationCity,
    decimal WeightKg, decimal VolumeM3, int Pallets,
    string? PickupDate,
    string? OriginCompany = null, string? OriginPhone = null,
    string? DestCompany = null, string? DestPhone = null,
    double? OriginLat = null, double? OriginLng = null,
    double? DestLat = null, double? DestLng = null);

public record ProviderTrackingResponse(
    string Status, string? CurrentLocation, DateTime? EstimatedDelivery,
    double? Latitude = null, double? Longitude = null,
    string? VehiclePlate = null, string? DriverName = null);

public record ProviderShipmentStatus(
    string Id, string ShipmentType, string Status, string StatusDate,
    string OriginCity, string DestinationCity,
    string? OriginCompany, string? DestCompany,
    decimal? Price, string? Currency, string? VehicleType, string? VehiclePlate);

// ============================================================
// YOLDA GERÇEK API ENTEGRASYONU
// Auth: AWS Cognito OAuth2 (client_credentials)
// Base URL: https://alfa.api.yolda.io
// ============================================================

public class YoldaProviderAdapter(ILogger<YoldaProviderAdapter> logger) : IProviderApiAdapter
{
    public string ProviderCode => "YOLDA";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    // Yolda config — production'da environment variable'lardan okunmalı
    private const string AuthBaseUrl = "https://alfa.api.yolda.io/auth";
    private const string ClientId = "3qab6urv1la2apk1ipbtl792av";
    private const string ClientSecret = "hkurf975ekjgq40q6arnf5mt9jqu0c2etejcj1es2soue326qfs";

    private string? _cachedToken;
    private DateTime _tokenExpiry = DateTime.MinValue;

    // ---- AUTH ----

    private async Task<string> GetAccessTokenAsync(string apiKey)
    {
        if (_cachedToken != null && DateTime.UtcNow < _tokenExpiry)
            return _cachedToken;

        var client = new HttpClient();
        client.DefaultRequestHeaders.Add("x-api-key", apiKey);

        var authValue = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{ClientId}:{ClientSecret}"));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authValue);

        var body = JsonContent.Create(new { grant_type = "client_credentials" });
        var response = await client.PostAsync($"{AuthBaseUrl}/oauth2/token", body);
        var json = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            logger.LogError("Yolda auth failed: {StatusCode} {Body}", response.StatusCode, json);
            throw new Exception($"Yolda auth failed: {response.StatusCode}");
        }

        using var doc = JsonDocument.Parse(json);
        var data = doc.RootElement.GetProperty("data");
        _cachedToken = data.GetProperty("access_token").GetString()!;
        var expiresIn = data.GetProperty("expires_in").GetInt32();
        _tokenExpiry = DateTime.UtcNow.AddSeconds(expiresIn - 60); // 1 dk margin

        logger.LogInformation("Yolda: Access token alındı, {ExpiresIn}s geçerli", expiresIn);
        return _cachedToken;
    }

    private async Task<HttpClient> CreateAuthenticatedClientAsync(string apiKey)
    {
        var token = await GetAccessTokenAsync(apiKey);
        var client = new HttpClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        client.DefaultRequestHeaders.Add("x-api-key", apiKey);
        return client;
    }

    // ---- TEST CONNECTION ----

    public async Task<bool> TestConnectionAsync(string apiBaseUrl, string apiKey)
    {
        try
        {
            var client = await CreateAuthenticatedClientAsync(apiKey);
            var response = await client.GetAsync($"{apiBaseUrl}/shipments/v1?page=1&size=1");
            logger.LogInformation("Yolda: Bağlantı testi {StatusCode}", response.StatusCode);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Yolda: Bağlantı testi başarısız");
            return false;
        }
    }

    // ---- GET SHIPMENTS ----

    public async Task<List<ProviderShipmentStatus>?> GetShipmentsAsync(string apiBaseUrl, string apiKey, int page = 1, int size = 20)
    {
        try
        {
            var client = await CreateAuthenticatedClientAsync(apiKey);
            var response = await client.GetAsync($"{apiBaseUrl}/shipments/v1?page={page}&size={size}");
            var json = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Yolda: Sevkiyat listesi alınamadı: {StatusCode}", response.StatusCode);
                return null;
            }

            using var doc = JsonDocument.Parse(json);
            var dataArray = doc.RootElement.GetProperty("data");
            var results = new List<ProviderShipmentStatus>();

            foreach (var item in dataArray.EnumerateArray())
            {
                var statuses = item.GetProperty("status");
                var lastStatus = "";
                var lastStatusDate = "";
                foreach (var s in statuses.EnumerateArray())
                {
                    lastStatus = s.GetProperty("id").GetString() ?? "";
                    if (s.TryGetProperty("date", out var dateProp))
                        lastStatusDate = DateTimeOffset.FromUnixTimeMilliseconds(dateProp.GetInt64()).ToString("yyyy-MM-dd HH:mm");
                }

                var pricing = item.GetProperty("pricing");
                var vehicle = item.TryGetProperty("vehicle", out var v) ? v : default;

                results.Add(new ProviderShipmentStatus(
                    Id: item.GetProperty("id").GetString() ?? "",
                    ShipmentType: item.GetProperty("shipmentType").GetString() ?? "FTL",
                    Status: lastStatus,
                    StatusDate: lastStatusDate,
                    OriginCity: item.GetProperty("pickup").GetProperty("city").GetString() ?? "",
                    DestinationCity: item.GetProperty("dropoff").GetProperty("city").GetString() ?? "",
                    OriginCompany: item.GetProperty("pickup").GetProperty("company").GetString(),
                    DestCompany: item.GetProperty("dropoff").GetProperty("company").GetString(),
                    Price: pricing.TryGetProperty("price", out var pp) ? pp.GetDecimal() : null,
                    Currency: pricing.TryGetProperty("currency", out var cp) ? cp.GetString() : "TRY",
                    VehicleType: vehicle.ValueKind != JsonValueKind.Undefined && vehicle.TryGetProperty("type", out var vt) ? vt.GetString() : null,
                    VehiclePlate: vehicle.ValueKind != JsonValueKind.Undefined && vehicle.TryGetProperty("plateNumber", out var vp) ? vp.GetString() : null
                ));
            }

            logger.LogInformation("Yolda: {Count} sevkiyat alındı", results.Count);
            return results;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Yolda: Sevkiyat listesi alınırken hata");
            return null;
        }
    }

    // ---- GET QUOTE ----

    public async Task<ProviderQuoteResponse?> GetQuoteAsync(string apiBaseUrl, string apiKey, ProviderQuoteRequest request)
    {
        try
        {
            var client = await CreateAuthenticatedClientAsync(apiKey);

            // Yolda'da direkt quote endpoint yok — shipment oluşturup NEED_PRICE status ile fiyat alınıyor
            // Burada anlaşma bazlı fiyat hesaplama yapıyoruz (contract rate'lerden)
            logger.LogInformation("Yolda: Fiyat sorgusu {Origin} → {Destination}, {Weight}kg",
                request.OriginCity, request.DestinationCity, request.WeightKg);

            // Basit fiyat tahmini (gerçek fiyat contract rate'lerden gelecek)
            var vehicleType = request.WeightKg > 15000 ? "TIR" :
                              request.WeightKg > 5000 ? "TRUCK" :
                              request.RequiresColdChain ? "REEFER_TRUCK" :
                              request.IsHazardous ? "TANKER" : "TRUCK";

            return new ProviderQuoteResponse(
                Price: request.WeightKg * 2.8m,
                Currency: "TRY",
                VehicleType: vehicleType,
                EstimatedHours: 24);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Yolda: Fiyat sorgusu hatası");
            return null;
        }
    }

    // ---- CREATE SHIPMENT ----

    public async Task<string?> CreateShipmentAsync(string apiBaseUrl, string apiKey, ProviderShipmentRequest request)
    {
        try
        {
            var client = await CreateAuthenticatedClientAsync(apiKey);

            var vehicleType = request.WeightKg > 15000 ? "TIR" :
                              request.WeightKg > 5000 ? "TRUCK" : "TRUCK";

            var body = new
            {
                shipmentType = "FTL",
                pickup = new
                {
                    company = request.OriginCompany ?? "Gönderici",
                    name = request.OriginCompany ?? "Gönderici",
                    phoneNumber = request.OriginPhone ?? "",
                    addressType = "FACTORY",
                    countryId = "TR",
                    city = request.OriginCity,
                    address = request.OriginAddress,
                    latitude = request.OriginLat ?? 0,
                    longitude = request.OriginLng ?? 0
                },
                dropoff = new
                {
                    company = request.DestCompany ?? "Alıcı",
                    name = request.DestCompany ?? "Alıcı",
                    phoneNumber = request.DestPhone ?? "",
                    addressType = "FACTORY",
                    countryId = "TR",
                    city = request.DestinationCity,
                    address = request.DestinationAddress,
                    latitude = request.DestLat ?? 0,
                    longitude = request.DestLng ?? 0
                },
                pricing = new
                {
                    type = "FIXED",
                    deliveryType = "STANDARD",
                    price = 1.0,
                    currency = "TRY"
                },
                vehicle = new
                {
                    type = vehicleType,
                    quantity = 1
                }
            };

            var content = new StringContent(
                JsonSerializer.Serialize(body, JsonOptions),
                Encoding.UTF8, "application/json");

            var response = await client.PostAsync($"{apiBaseUrl}/shipments/v1", content);
            var json = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("Yolda: Sevkiyat oluşturulamadı: {StatusCode} {Body}", response.StatusCode, json);
                return null;
            }

            using var doc = JsonDocument.Parse(json);
            var shipmentId = doc.RootElement.GetProperty("data").GetProperty("id").GetString();
            logger.LogInformation("Yolda: Sevkiyat oluşturuldu: {ShipmentId}", shipmentId);
            return shipmentId;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Yolda: Sevkiyat oluşturulurken hata");
            return null;
        }
    }

    // ---- TRACKING ----

    public async Task<ProviderTrackingResponse?> TrackAsync(string apiBaseUrl, string apiKey, string trackingNumber)
    {
        try
        {
            var client = await CreateAuthenticatedClientAsync(apiKey);
            var response = await client.GetAsync($"{apiBaseUrl}/shipments/v1/{trackingNumber}");
            var json = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Yolda: Takip bilgisi alınamadı: {TrackingNumber} {StatusCode}", trackingNumber, response.StatusCode);
                return null;
            }

            using var doc = JsonDocument.Parse(json);
            var data = doc.RootElement.GetProperty("data");

            // Son status'u al
            var statuses = data.GetProperty("status");
            var lastStatus = "";
            foreach (var s in statuses.EnumerateArray())
                lastStatus = s.GetProperty("id").GetString() ?? "";

            // Konum bilgisi (varsa)
            double? lat = null, lng = null;
            if (data.TryGetProperty("pickup", out var pickup))
            {
                lat = pickup.TryGetProperty("latitude", out var latProp) ? latProp.GetDouble() : null;
                lng = pickup.TryGetProperty("longitude", out var lngProp) ? lngProp.GetDouble() : null;
            }

            // Araç bilgisi
            string? plate = null, driverName = null;
            if (data.TryGetProperty("vehicle", out var vehicle) && vehicle.ValueKind != JsonValueKind.Null)
            {
                plate = vehicle.TryGetProperty("plateNumber", out var pp) ? pp.GetString() : null;
            }
            if (data.TryGetProperty("driver", out var driver) && driver.ValueKind != JsonValueKind.Null)
            {
                driverName = driver.TryGetProperty("fullName", out var dp) ? dp.GetString() : null;
            }

            // Status mapping: Yolda → Logic.Route
            var mappedStatus = lastStatus switch
            {
                "NEED_PRICE" => "PendingApproval",
                "APPROVED" => "Approved",
                "VEHICLE_GETTING_SUPPLIED" => "VehicleAssigned",
                "VEHICLE_SUPPLIED" => "VehicleAssigned",
                "GOING_TO_PICKUP" => "InTransit",
                "AT_PICKUP" => "Loading",
                "LOADING" => "Loading",
                "ON_THE_WAY" => "InTransit",
                "AT_DROPOFF" => "Delivered",
                "UNLOADING" => "Delivered",
                "DELIVERED" => "Completed",
                "CANCELLED" => "Cancelled",
                _ => lastStatus
            };

            logger.LogInformation("Yolda: Takip {TrackingNumber} → {Status}", trackingNumber, mappedStatus);

            return new ProviderTrackingResponse(
                Status: mappedStatus,
                CurrentLocation: data.GetProperty("dropoff").GetProperty("city").GetString(),
                EstimatedDelivery: null,
                Latitude: lat,
                Longitude: lng,
                VehiclePlate: plate,
                DriverName: driverName);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Yolda: Takip hatası {TrackingNumber}", trackingNumber);
            return null;
        }
    }
}
