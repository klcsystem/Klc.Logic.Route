using Microsoft.Extensions.Logging;
using Npgsql;

namespace Klc.LogicRoute.Infrastructure.Persistence;

public class SeedDataGenerator(
    IPostgresConnectionFactory connectionFactory,
    ILogger<SeedDataGenerator> logger)
{
    private static readonly Guid TenantId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    // 55 Turkish cities with real coordinates
    private static readonly (string City, double Lat, double Lng)[] TurkishCities =
    [
        ("Istanbul", 41.0082, 28.9784),
        ("Ankara", 39.9334, 32.8597),
        ("Izmir", 38.4192, 27.1287),
        ("Bursa", 40.1885, 29.0610),
        ("Antalya", 36.8969, 30.7133),
        ("Adana", 37.0000, 35.3213),
        ("Konya", 37.8746, 32.4932),
        ("Gaziantep", 37.0662, 37.3833),
        ("Mersin", 36.8121, 34.6415),
        ("Kayseri", 38.7312, 35.4787),
        ("Eskisehir", 39.7767, 30.5206),
        ("Diyarbakir", 37.9144, 40.2306),
        ("Samsun", 41.2928, 36.3313),
        ("Denizli", 37.7765, 29.0864),
        ("Trabzon", 41.0015, 39.7178),
        ("Malatya", 38.3554, 38.3335),
        ("Erzurum", 39.9055, 41.2658),
        ("Sanliurfa", 37.1591, 38.7969),
        ("Manisa", 38.6191, 27.4289),
        ("Sakarya", 40.6940, 30.4358),
        ("Balikesir", 39.6484, 27.8826),
        ("Kahramanmaras", 37.5847, 36.9371),
        ("Van", 38.5012, 43.3730),
        ("Aydin", 37.8560, 27.8416),
        ("Tekirdag", 41.2824, 27.5119),
        ("Kocaeli", 40.8533, 29.8815),
        ("Hatay", 36.4018, 36.3498),
        ("Mugla", 37.2153, 28.3636),
        ("Afyon", 38.7507, 30.5567),
        ("Kutahya", 39.4167, 29.9833),
        ("Zonguldak", 41.4564, 31.7987),
        ("Ordu", 40.9862, 37.8797),
        ("Rize", 41.0201, 40.5234),
        ("Aksaray", 38.3687, 34.0370),
        ("Nevsehir", 38.6244, 34.7239),
        ("Kirikkale", 39.8468, 33.5153),
        ("Bolu", 40.7360, 31.6061),
        ("Isparta", 37.7648, 30.5566),
        ("Sivas", 39.7477, 37.0179),
        ("Tokat", 40.3167, 36.5500),
        ("Corum", 40.5506, 34.9556),
        ("Kirklareli", 41.7333, 27.2167),
        ("Edirne", 41.6818, 26.5623),
        ("Canakkale", 40.1553, 26.4142),
        ("Usak", 38.6823, 29.4082),
        ("Yalova", 40.6500, 29.2667),
        ("Bilecik", 40.0567, 30.0153),
        ("Artvin", 41.1828, 41.8183),
        ("Agri", 39.7191, 43.0503),
        ("Mus", 38.7432, 41.5064),
        ("Bitlis", 38.3938, 42.1232),
        ("Nigde", 37.9667, 34.6833),
        ("Karaman", 37.1759, 33.2287),
        ("Kastamonu", 41.3887, 33.7827),
        ("Sinop", 42.0231, 35.1531),
    ];

    // Realistic Turkish logistics providers
    private static readonly (string Name, string Code, int Type, string City, string VehicleTypes, string Regions, string TaxNumber, string Phone, string Email, string Contact)[] Providers =
    [
        ("Yolda Lojistik", "YOLDA", 0, "Istanbul", "Tir,Kamyon,Kamyonet,Parsiyel", "Marmara,Ege,Akdeniz,Ic Anadolu", "1234567890", "+902121234567", "info@yolda.com", "Ahmet Yilmaz"),
        ("Murat Transport", "MURAT", 1, "Ankara", "Tir,Kamyon,Frigorifik", "Ic Anadolu,Karadeniz,Dogu Anadolu", "2345678901", "+903121234567", "info@murattransport.com", "Murat Ozturk"),
        ("Ege Kargo", "EGEKRG", 1, "Izmir", "Kamyon,Kamyonet,Parsiyel", "Ege,Akdeniz,Marmara", "3456789012", "+902321234567", "info@egekargo.com", "Elif Demir"),
        ("Akdeniz Lojistik", "AKDNZ", 1, "Antalya", "Tir,Kamyon,Frigorifik,Tanker", "Akdeniz,Ege,Ic Anadolu", "4567890123", "+902421234567", "info@akdenizlojistik.com", "Mehmet Kaya"),
        ("Anadolu Nakliyat", "ANDNK", 1, "Konya", "Tir,Kamyon,LowBed", "Ic Anadolu,Akdeniz,Guneydogu Anadolu", "5678901234", "+903321234567", "info@anadolunakliyat.com", "Fatma Sahin"),
        ("Karadeniz Tasima", "KRDNZ", 1, "Trabzon", "Kamyon,Kamyonet,Parsiyel", "Karadeniz,Dogu Anadolu", "6789012345", "+904621234567", "info@karadenitasima.com", "Huseyin Celik"),
        ("GAP Lojistik", "GAPLJ", 1, "Gaziantep", "Tir,Kamyon,Konteyner", "Guneydogu Anadolu,Akdeniz,Ic Anadolu", "7890123456", "+903421234567", "info@gaplojistik.com", "Ali Yildiz"),
        ("Marmara Ekspres", "MRMEK", 0, "Bursa", "Tir,Kamyon,Kamyonet,Parsiyel,Frigorifik", "Marmara,Ege,Ic Anadolu,Karadeniz", "8901234567", "+902241234567", "info@marmaraekspres.com", "Ayse Arslan"),
        ("Dogu Express", "DGUEX", 1, "Erzurum", "Tir,Kamyon,LowBed", "Dogu Anadolu,Karadeniz,Guneydogu Anadolu", "9012345678", "+904421234567", "info@doguexpress.com", "Mustafa Korkmaz"),
        ("Trakya Nakliye", "TRKYA", 1, "Edirne", "Tir,Kamyon,Konteyner", "Marmara,Trakya", "0123456789", "+902841234567", "info@trakyanakliye.com", "Zeynep Ozkan"),
    ];

    private static readonly string[] ProductCategories =
        ["Gida", "Elektronik", "Tekstil", "Otomotiv Parcasi", "Insaat Malzemesi", "Kimyasal", "Mobilya", "Tarım Urunu", "Makine", "Ilaç"];

    private static readonly string[] CustomerNames =
        ["ABC Gida A.S.", "Teknosa Dagitim", "LC Waikiki Depo", "TOFAS Otomotiv", "Cimsa Cimento", "Akzo Nobel Kimya", "Bellona Mobilya", "Cargill Tarim", "Hidromek Makine", "Bayer Saglik",
         "Eti Gida", "Vestel Elektronik", "Defacto Tekstil", "Ford Otosan", "Akcansa Beton", "Henkel Turkiye", "Istikbal Mobilya", "Ulker Bisküvi", "Turk Traktor", "Novartis Ilaç",
         "Migros Dagitim", "Arcelik Beyaz Esya", "Koton Magaza", "Hyundai Assan", "Dalsan Alci", "BASF Turkiye", "Dogtas Kelebek", "Banvit Tavuk", "Caterpillar Turkiye", "Pfizer Turkiye"];

    public async Task SeedAsync()
    {
        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync();

        // Check if seed data already exists
        await using var checkCmd = new NpgsqlCommand(
            "SELECT COUNT(*) FROM logistics.providers WHERE tenant_id = @tid", connection);
        checkCmd.Parameters.AddWithValue("tid", TenantId);
        var existingCount = (long)(await checkCmd.ExecuteScalarAsync())!;
        if (existingCount > 0)
        {
            logger.LogInformation("Seed data already exists ({Count} providers). Skipping.", existingCount);
            return;
        }

        logger.LogInformation("Starting seed data generation...");

        var random = new Random(42); // Deterministic seed for reproducibility

        // 1. Providers
        var providerIds = await SeedProvidersAsync(connection);

        // 2. Contracts (2-3 per provider, some historical/expired)
        var contractIds = await SeedContractsAsync(connection, providerIds, random);

        // 3. Contract Rates (km-based tariff per route corridor)
        var contractRateIds = await SeedContractRatesAsync(connection, contractIds, random);

        // 4. Orders (2000-5000 across 12 months with seasonal patterns)
        var orderIds = await SeedOrdersAsync(connection, providerIds, contractIds, random);

        // 5. Shipments (linked to orders)
        await SeedShipmentsAsync(connection, orderIds, providerIds, contractRateIds, random);

        // 6. Carrier Performance (monthly aggregates with provider variation)
        await SeedCarrierPerformanceAsync(connection, providerIds, random);

        logger.LogInformation("Seed data generation completed.");
    }

    private async Task<Dictionary<string, Guid>> SeedProvidersAsync(NpgsqlConnection connection)
    {
        var ids = new Dictionary<string, Guid>();

        foreach (var p in Providers)
        {
            var id = Guid.NewGuid();
            ids[p.Code] = id;

            await using var cmd = new NpgsqlCommand(@"
                INSERT INTO logistics.providers (id, tenant_id, name, code, type, is_active, is_global,
                    supported_vehicle_types, service_regions, tax_number, city, phone, email, contact_person,
                    integration_mode, created_by, created_at)
                VALUES (@id, @tid, @name, @code, @type, TRUE, @global, @vehicles, @regions,
                    @tax, @city, @phone, @email, @contact, @mode, 'seed', NOW())
                ON CONFLICT DO NOTHING", connection);

            cmd.Parameters.AddWithValue("id", id);
            cmd.Parameters.AddWithValue("tid", TenantId);
            cmd.Parameters.AddWithValue("name", p.Name);
            cmd.Parameters.AddWithValue("code", p.Code);
            cmd.Parameters.AddWithValue("type", p.Type);
            cmd.Parameters.AddWithValue("global", p.Type == 0); // Platforms are global
            cmd.Parameters.AddWithValue("vehicles", p.VehicleTypes);
            cmd.Parameters.AddWithValue("regions", p.Regions);
            cmd.Parameters.AddWithValue("tax", p.TaxNumber);
            cmd.Parameters.AddWithValue("city", p.City);
            cmd.Parameters.AddWithValue("phone", p.Phone);
            cmd.Parameters.AddWithValue("email", p.Email);
            cmd.Parameters.AddWithValue("contact", p.Contact);
            cmd.Parameters.AddWithValue("mode", p.Type == 0 ? "ApiIntegrated" : "Managed");

            await cmd.ExecuteNonQueryAsync();
        }

        logger.LogInformation("Seeded {Count} providers", ids.Count);
        return ids;
    }

    private async Task<List<(Guid ContractId, Guid ProviderId, string ProviderCode)>> SeedContractsAsync(
        NpgsqlConnection connection, Dictionary<string, Guid> providerIds, Random random)
    {
        var contracts = new List<(Guid, Guid, string)>();
        var now = DateTime.UtcNow;
        var contractNum = 1;

        foreach (var (code, providerId) in providerIds)
        {
            // Each provider gets 2-3 contracts: 1 expired, 1 active, sometimes 1 future
            var contractCount = random.Next(2, 4);

            for (var i = 0; i < contractCount; i++)
            {
                var id = Guid.NewGuid();
                DateTime start, end;
                int status;

                if (i == 0) // Expired contract
                {
                    start = now.AddMonths(-18);
                    end = now.AddMonths(-6);
                    status = 2; // Expired
                }
                else if (i == 1) // Active contract
                {
                    start = now.AddMonths(-6);
                    end = now.AddMonths(6);
                    status = 1; // Active
                    contracts.Add((id, providerId, code));
                }
                else // Future/Draft contract
                {
                    start = now.AddMonths(3);
                    end = now.AddMonths(15);
                    status = 0; // Draft
                }

                await using var cmd = new NpgsqlCommand(@"
                    INSERT INTO logistics.contracts (id, tenant_id, provider_id, contract_number, name,
                        start_date, end_date, status, currency, notes, created_by, created_at)
                    VALUES (@id, @tid, @pid, @num, @name, @start, @end, @status, 'TRY', @notes, 'seed', NOW())
                    ON CONFLICT DO NOTHING", connection);

                var suffix = i switch { 0 => "Onceki", 1 => "Guncel", _ => "Yeni" };
                cmd.Parameters.AddWithValue("id", id);
                cmd.Parameters.AddWithValue("tid", TenantId);
                cmd.Parameters.AddWithValue("pid", providerId);
                cmd.Parameters.AddWithValue("num", $"CNT-2025-{contractNum++:D4}");
                cmd.Parameters.AddWithValue("name", $"{Providers.First(p => p.Code == code).Name} {suffix} Sozlesme");
                cmd.Parameters.AddWithValue("start", start);
                cmd.Parameters.AddWithValue("end", end);
                cmd.Parameters.AddWithValue("status", status);
                cmd.Parameters.AddWithValue("notes", (object?)null ?? DBNull.Value);

                await cmd.ExecuteNonQueryAsync();
            }
        }

        logger.LogInformation("Seeded {Count} contracts ({Active} active)", contractNum - 1, contracts.Count);
        return contracts;
    }

    private async Task<List<(Guid RateId, Guid ContractId, string Origin, string Destination)>> SeedContractRatesAsync(
        NpgsqlConnection connection,
        List<(Guid ContractId, Guid ProviderId, string ProviderCode)> contracts,
        Random random)
    {
        var rates = new List<(Guid, Guid, string, string)>();

        // Major route corridors in Turkey
        (string Origin, string Destination, int BaseDistanceKm)[] corridors =
        [
            ("Istanbul", "Ankara", 450),
            ("Istanbul", "Izmir", 480),
            ("Istanbul", "Bursa", 155),
            ("Istanbul", "Antalya", 725),
            ("Istanbul", "Adana", 940),
            ("Istanbul", "Gaziantep", 1130),
            ("Istanbul", "Trabzon", 1070),
            ("Istanbul", "Konya", 660),
            ("Istanbul", "Mersin", 950),
            ("Istanbul", "Diyarbakir", 1370),
            ("Ankara", "Izmir", 580),
            ("Ankara", "Konya", 260),
            ("Ankara", "Antalya", 480),
            ("Ankara", "Adana", 490),
            ("Ankara", "Kayseri", 320),
            ("Ankara", "Samsun", 415),
            ("Ankara", "Trabzon", 780),
            ("Ankara", "Gaziantep", 700),
            ("Ankara", "Eskisehir", 235),
            ("Ankara", "Erzurum", 900),
            ("Izmir", "Antalya", 460),
            ("Izmir", "Bursa", 330),
            ("Izmir", "Denizli", 240),
            ("Izmir", "Manisa", 40),
            ("Izmir", "Mugla", 260),
            ("Izmir", "Aydin", 125),
            ("Adana", "Mersin", 70),
            ("Adana", "Gaziantep", 220),
            ("Adana", "Hatay", 190),
            ("Adana", "Konya", 350),
            ("Antalya", "Konya", 300),
            ("Antalya", "Isparta", 130),
            ("Antalya", "Denizli", 240),
            ("Trabzon", "Erzurum", 325),
            ("Trabzon", "Samsun", 355),
            ("Trabzon", "Rize", 80),
            ("Gaziantep", "Sanliurfa", 145),
            ("Gaziantep", "Diyarbakir", 330),
            ("Gaziantep", "Malatya", 260),
            ("Gaziantep", "Kahramanmaras", 80),
            ("Bursa", "Eskisehir", 155),
            ("Bursa", "Balikesir", 170),
            ("Bursa", "Kocaeli", 115),
            ("Konya", "Aksaray", 150),
            ("Konya", "Nevsehir", 230),
            ("Konya", "Karaman", 105),
            ("Kayseri", "Sivas", 200),
            ("Kayseri", "Nevsehir", 80),
            ("Samsun", "Ordu", 165),
            ("Samsun", "Tokat", 120),
            ("Edirne", "Istanbul", 235),
            ("Tekirdag", "Istanbul", 135),
        ];

        // Vehicle categories with base pricing per km (TRY)
        (int Category, string Name, decimal BasePricePerKm, decimal MinWeight, decimal MaxWeight)[] vehiclePricing =
        [
            (0, "Tir", 18.50m, 10000, 25000),        // Tir
            (1, "Kamyon", 14.00m, 3000, 12000),       // Kamyon
            (2, "Kamyonet", 9.50m, 500, 3500),        // Kamyonet
            (3, "Parsiyel", 6.00m, 0, 1000),          // Parsiyel
            (4, "Frigorifik", 22.00m, 1000, 15000),   // Frigorifik
            (5, "Tanker", 20.00m, 5000, 30000),       // Tanker
            (6, "LowBed", 25.00m, 15000, 50000),      // LowBed
            (7, "Konteyner", 28.00m, 10000, 30000),   // Konteyner
        ];

        foreach (var (contractId, _, providerCode) in contracts)
        {
            // Each active contract covers 15-30 random corridors
            var corridorCount = random.Next(15, Math.Min(31, corridors.Length + 1));
            var selectedCorridors = corridors.OrderBy(_ => random.Next()).Take(corridorCount).ToArray();

            foreach (var (origin, dest, baseDist) in selectedCorridors)
            {
                // 2-4 vehicle categories per corridor
                var vehicleCount = random.Next(2, 5);
                var selectedVehicles = vehiclePricing.OrderBy(_ => random.Next()).Take(vehicleCount);

                foreach (var (cat, _, basePrice, minW, maxW) in selectedVehicles)
                {
                    var rateId = Guid.NewGuid();
                    // Provider-specific price variation: +/- 20%
                    var priceVariation = 0.80m + (decimal)random.NextDouble() * 0.40m;
                    var pricePerUnit = Math.Round(basePrice * priceVariation, 4);

                    await using var cmd = new NpgsqlCommand(@"
                        INSERT INTO logistics.contract_rates (id, tenant_id, contract_id,
                            origin_region, destination_region, vehicle_category,
                            min_weight_kg, max_weight_kg, min_distance_km, max_distance_km,
                            price_per_unit, pricing_unit, currency,
                            urgent_surcharge_percent, adr_surcharge_percent, frigo_surcharge_percent,
                            weekend_surcharge_percent, is_active, created_by, created_at)
                        VALUES (@id, @tid, @cid, @origin, @dest, @cat,
                            @minw, @maxw, @mindist, @maxdist,
                            @price, @unit, 'TRY',
                            @urgent, @adr, @frigo, @weekend, TRUE, 'seed', NOW())
                        ON CONFLICT DO NOTHING", connection);

                    cmd.Parameters.AddWithValue("id", rateId);
                    cmd.Parameters.AddWithValue("tid", TenantId);
                    cmd.Parameters.AddWithValue("cid", contractId);
                    cmd.Parameters.AddWithValue("origin", origin);
                    cmd.Parameters.AddWithValue("dest", dest);
                    cmd.Parameters.AddWithValue("cat", cat);
                    cmd.Parameters.AddWithValue("minw", minW);
                    cmd.Parameters.AddWithValue("maxw", maxW);
                    cmd.Parameters.AddWithValue("mindist", (decimal)(baseDist * 0.8));
                    cmd.Parameters.AddWithValue("maxdist", (decimal)(baseDist * 1.2));
                    cmd.Parameters.AddWithValue("price", pricePerUnit);
                    cmd.Parameters.AddWithValue("unit", 4); // PerKm
                    cmd.Parameters.AddWithValue("urgent", Math.Round(15m + (decimal)random.NextDouble() * 15m, 2));
                    cmd.Parameters.AddWithValue("adr", Math.Round(20m + (decimal)random.NextDouble() * 15m, 2));
                    cmd.Parameters.AddWithValue("frigo", Math.Round(25m + (decimal)random.NextDouble() * 15m, 2));
                    cmd.Parameters.AddWithValue("weekend", Math.Round(5m + (decimal)random.NextDouble() * 10m, 2));

                    await cmd.ExecuteNonQueryAsync();
                    rates.Add((rateId, contractId, origin, dest));
                }
            }
        }

        logger.LogInformation("Seeded {Count} contract rates", rates.Count);
        return rates;
    }

    private async Task<List<(Guid OrderId, string OriginCity, string DestCity, decimal WeightKg, bool IsHazardous, bool IsColdChain, int Priority)>> SeedOrdersAsync(
        NpgsqlConnection connection,
        Dictionary<string, Guid> providerIds,
        List<(Guid ContractId, Guid ProviderId, string ProviderCode)> contracts,
        Random random)
    {
        var orders = new List<(Guid, string, string, decimal, bool, bool, int)>();
        var now = DateTime.UtcNow;
        var orderNum = 1;

        // Seasonal multipliers: index 0 = Jan ... 11 = Dec
        // Higher volume in spring/fall (logistics peak), lower in summer/winter holidays
        double[] seasonalMultiplier = [0.7, 0.8, 0.9, 1.1, 1.2, 1.0, 0.8, 0.7, 1.1, 1.3, 1.2, 0.9];

        var totalOrders = random.Next(2500, 4000);
        var baseMonthly = totalOrders / 12.0;

        for (var monthOffset = -11; monthOffset <= 0; monthOffset++)
        {
            var month = now.AddMonths(monthOffset);
            var monthIndex = month.Month - 1;
            var monthlyCount = (int)(baseMonthly * seasonalMultiplier[monthIndex]);

            for (var i = 0; i < monthlyCount; i++)
            {
                var id = Guid.NewGuid();

                // Pick random origin/destination cities
                var originIdx = random.Next(TurkishCities.Length);
                int destIdx;
                do { destIdx = random.Next(TurkishCities.Length); } while (destIdx == originIdx);

                var origin = TurkishCities[originIdx];
                var dest = TurkishCities[destIdx];

                var weightKg = Math.Round((decimal)(random.NextDouble() * 24500 + 500), 2);
                var volumeM3 = Math.Round(weightKg / (decimal)(200 + random.NextDouble() * 300), 4);
                var palletCount = Math.Max(1, (int)(weightKg / 800));
                var isHazardous = random.NextDouble() < 0.05;
                var isColdChain = random.NextDouble() < 0.08;

                // Priority: 70% normal, 20% priority, 10% urgent
                var priorityRoll = random.NextDouble();
                var priority = priorityRoll < 0.70 ? 0 : priorityRoll < 0.90 ? 1 : 2;

                // Status distribution based on age
                int status;
                if (monthOffset < -2)
                    status = random.NextDouble() < 0.90 ? 4 : 5; // 90% Completed, 10% Cancelled
                else if (monthOffset < -1)
                    status = random.NextDouble() < 0.70 ? 4 : random.NextDouble() < 0.5 ? 3 : 2;
                else
                    status = random.Next(0, 4); // Mix of Draft, Pending, ReadyForShipment, InShipment

                var productCategory = ProductCategories[random.Next(ProductCategories.Length)];
                var customerName = CustomerNames[random.Next(CustomerNames.Length)];

                // Pick a random active contract
                var contract = contracts[random.Next(contracts.Count)];

                var createdAt = month.AddDays(random.Next(0, 28)).AddHours(random.Next(6, 20)).AddMinutes(random.Next(0, 60));
                var deliveryDays = 1 + random.Next(1, 7);

                await using var cmd = new NpgsqlCommand(@"
                    INSERT INTO logistics.orders (id, tenant_id, order_number, customer_name,
                        origin_address, origin_city, origin_lat, origin_lng,
                        destination_address, destination_city, destination_lat, destination_lng,
                        total_weight_kg, total_volume_m3, pallet_count, product_category,
                        is_hazardous, requires_cold_chain, status, priority,
                        requested_delivery_date, currency, contract_id, provider_id,
                        created_by, created_at)
                    VALUES (@id, @tid, @num, @customer,
                        @oaddr, @ocity, @olat, @olng,
                        @daddr, @dcity, @dlat, @dlng,
                        @weight, @volume, @pallet, @product,
                        @hazard, @cold, @status, @priority,
                        @delivery, 'TRY', @cid, @pid,
                        'seed', @created)
                    ON CONFLICT DO NOTHING", connection);

                cmd.Parameters.AddWithValue("id", id);
                cmd.Parameters.AddWithValue("tid", TenantId);
                cmd.Parameters.AddWithValue("num", $"ORD-{createdAt:yyyyMM}-{orderNum++:D5}");
                cmd.Parameters.AddWithValue("customer", customerName);
                cmd.Parameters.AddWithValue("oaddr", $"{origin.City} Organize Sanayi Bolgesi");
                cmd.Parameters.AddWithValue("ocity", origin.City);
                cmd.Parameters.AddWithValue("olat", origin.Lat);
                cmd.Parameters.AddWithValue("olng", origin.Lng);
                cmd.Parameters.AddWithValue("daddr", $"{dest.City} Merkez Depo");
                cmd.Parameters.AddWithValue("dcity", dest.City);
                cmd.Parameters.AddWithValue("dlat", dest.Lat);
                cmd.Parameters.AddWithValue("dlng", dest.Lng);
                cmd.Parameters.AddWithValue("weight", weightKg);
                cmd.Parameters.AddWithValue("volume", volumeM3);
                cmd.Parameters.AddWithValue("pallet", palletCount);
                cmd.Parameters.AddWithValue("product", productCategory);
                cmd.Parameters.AddWithValue("hazard", isHazardous);
                cmd.Parameters.AddWithValue("cold", isColdChain);
                cmd.Parameters.AddWithValue("status", status);
                cmd.Parameters.AddWithValue("priority", priority);
                cmd.Parameters.AddWithValue("delivery", createdAt.AddDays(deliveryDays));
                cmd.Parameters.AddWithValue("cid", contract.ContractId);
                cmd.Parameters.AddWithValue("pid", contract.ProviderId);
                cmd.Parameters.AddWithValue("created", createdAt);

                await cmd.ExecuteNonQueryAsync();
                orders.Add((id, origin.City, dest.City, weightKg, isHazardous, isColdChain, priority));
            }
        }

        logger.LogInformation("Seeded {Count} orders", orders.Count);
        return orders;
    }

    private async Task SeedShipmentsAsync(
        NpgsqlConnection connection,
        List<(Guid OrderId, string OriginCity, string DestCity, decimal WeightKg, bool IsHazardous, bool IsColdChain, int Priority)> orders,
        Dictionary<string, Guid> providerIds,
        List<(Guid RateId, Guid ContractId, string Origin, string Destination)> contractRates,
        Random random)
    {
        var shipmentNum = 1;
        var providerList = providerIds.Values.ToList();
        var now = DateTime.UtcNow;
        var count = 0;

        foreach (var (orderId, originCity, destCity, weightKg, isHazardous, isColdChain, priority) in orders)
        {
            // ~80% of orders get a shipment
            if (random.NextDouble() > 0.80) continue;

            var id = Guid.NewGuid();
            var providerId = providerList[random.Next(providerList.Count)];

            // Try to find a matching rate
            var matchingRate = contractRates
                .FirstOrDefault(r => r.Origin == originCity && r.Destination == destCity);
            var rateId = matchingRate != default ? matchingRate.RateId : (Guid?)null;

            var volumeM3 = Math.Round(weightKg / (decimal)(200 + random.NextDouble() * 300), 4);
            var desiWeight = Math.Round(volumeM3 * 3000, 2); // desi = volume(m3) * 3000
            var chargeableWeight = Math.Max(weightKg, desiWeight);

            // Vehicle recommendation based on weight
            int vehicleCat;
            if (weightKg > 15000) vehicleCat = 0; // Tir
            else if (weightKg > 5000) vehicleCat = 1; // Kamyon
            else if (weightKg > 1500) vehicleCat = 2; // Kamyonet
            else vehicleCat = 3; // Parsiyel
            if (isColdChain) vehicleCat = 4; // Frigorifik override

            // Calculated price based on distance estimate and weight
            var distanceEstimate = EstimateDistance(originCity, destCity);
            var basePrice = distanceEstimate * (vehicleCat switch
            {
                0 => 18.50m,
                1 => 14.00m,
                2 => 9.50m,
                3 => 6.00m,
                4 => 22.00m,
                _ => 15.00m
            });
            var priceVariation = 0.85m + (decimal)random.NextDouble() * 0.30m;
            var calculatedPrice = Math.Round(basePrice * priceVariation, 2);

            // Shipment status distribution
            var statusRoll = random.NextDouble();
            int status;
            if (statusRoll < 0.50) status = 9;       // Completed
            else if (statusRoll < 0.65) status = 8;   // Delivered
            else if (statusRoll < 0.75) status = 7;   // InTransit
            else if (statusRoll < 0.82) status = 6;   // Loading
            else if (statusRoll < 0.88) status = 5;   // VehicleAssigned
            else if (statusRoll < 0.92) status = 4;   // SentToProvider
            else if (statusRoll < 0.95) status = 3;   // Approved
            else if (statusRoll < 0.97) status = 10;  // Cancelled
            else status = random.Next(0, 3);           // Draft/Calculated/PendingApproval

            var createdAt = now.AddDays(-random.Next(1, 330)).AddHours(random.Next(6, 20));
            DateTime? pickupDate = status >= 6 ? createdAt.AddDays(random.Next(1, 3)) : null;
            DateTime? deliveryDate = status >= 8 ? pickupDate?.AddDays(random.Next(1, 5)) : null;

            // Plate numbers for assigned/in-transit
            string? plate = status >= 5 ? $"{random.Next(1, 82):D2} {(char)('A' + random.Next(26))}{(char)('A' + random.Next(26))} {random.Next(100, 999):D3}" : null;
            string? driverName = status >= 5 ? $"{DriverFirstNames[random.Next(DriverFirstNames.Length)]} {DriverLastNames[random.Next(DriverLastNames.Length)]}" : null;
            string? driverPhone = status >= 5 ? $"+905{random.Next(30, 60):D2}{random.Next(1000000, 9999999)}" : null;

            await using var cmd = new NpgsqlCommand(@"
                INSERT INTO logistics.shipments (id, tenant_id, shipment_number, order_id,
                    origin_address, origin_city, destination_address, destination_city,
                    status, priority, requested_pickup_date, requested_delivery_date,
                    actual_pickup_date, actual_delivery_date,
                    total_weight_kg, total_volume_m3, total_desi_weight, chargeable_weight,
                    pallet_count, is_hazardous, requires_cold_chain, is_stackable,
                    selected_provider_id, selected_contract_rate_id, recommended_vehicle,
                    calculated_price, currency, vehicle_plate, driver_name, driver_phone,
                    created_by, created_at)
                VALUES (@id, @tid, @num, @oid,
                    @oaddr, @ocity, @daddr, @dcity,
                    @status, @priority, @rpick, @rdel,
                    @apick, @adel,
                    @weight, @volume, @desi, @chargeable,
                    @pallet, @hazard, @cold, @stackable,
                    @pid, @rid, @vehicle,
                    @price, 'TRY', @plate, @driver, @phone,
                    'seed', @created)
                ON CONFLICT DO NOTHING", connection);

            cmd.Parameters.AddWithValue("id", id);
            cmd.Parameters.AddWithValue("tid", TenantId);
            cmd.Parameters.AddWithValue("num", $"SHP-{createdAt:yyyyMM}-{shipmentNum++:D5}");
            cmd.Parameters.AddWithValue("oid", orderId);
            cmd.Parameters.AddWithValue("oaddr", $"{originCity} Organize Sanayi Bolgesi");
            cmd.Parameters.AddWithValue("ocity", originCity);
            cmd.Parameters.AddWithValue("daddr", $"{destCity} Merkez Depo");
            cmd.Parameters.AddWithValue("dcity", destCity);
            cmd.Parameters.AddWithValue("status", status);
            cmd.Parameters.AddWithValue("priority", priority);
            cmd.Parameters.AddWithValue("rpick", (object?)createdAt.AddDays(1) ?? DBNull.Value);
            cmd.Parameters.AddWithValue("rdel", (object?)createdAt.AddDays(random.Next(2, 7)) ?? DBNull.Value);
            cmd.Parameters.AddWithValue("apick", (object?)pickupDate ?? DBNull.Value);
            cmd.Parameters.AddWithValue("adel", (object?)deliveryDate ?? DBNull.Value);
            cmd.Parameters.AddWithValue("weight", weightKg);
            cmd.Parameters.AddWithValue("volume", volumeM3);
            cmd.Parameters.AddWithValue("desi", desiWeight);
            cmd.Parameters.AddWithValue("chargeable", chargeableWeight);
            cmd.Parameters.AddWithValue("pallet", Math.Max(1, (int)(weightKg / 800)));
            cmd.Parameters.AddWithValue("hazard", isHazardous);
            cmd.Parameters.AddWithValue("cold", isColdChain);
            cmd.Parameters.AddWithValue("stackable", !isHazardous);
            cmd.Parameters.AddWithValue("pid", providerId);
            cmd.Parameters.AddWithValue("rid", (object?)rateId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("vehicle", vehicleCat);
            cmd.Parameters.AddWithValue("price", calculatedPrice);
            cmd.Parameters.AddWithValue("plate", (object?)plate ?? DBNull.Value);
            cmd.Parameters.AddWithValue("driver", (object?)driverName ?? DBNull.Value);
            cmd.Parameters.AddWithValue("phone", (object?)driverPhone ?? DBNull.Value);
            cmd.Parameters.AddWithValue("created", createdAt);

            await cmd.ExecuteNonQueryAsync();
            count++;
        }

        logger.LogInformation("Seeded {Count} shipments", count);
    }

    private async Task SeedCarrierPerformanceAsync(
        NpgsqlConnection connection,
        Dictionary<string, Guid> providerIds,
        Random random)
    {
        var now = DateTime.UtcNow;
        var count = 0;

        // Provider quality tiers (some providers are consistently better)
        var providerQuality = new Dictionary<string, double>
        {
            ["YOLDA"] = 0.92,
            ["MRMEK"] = 0.90,
            ["MURAT"] = 0.87,
            ["EGEKRG"] = 0.85,
            ["AKDNZ"] = 0.83,
            ["ANDNK"] = 0.80,
            ["KRDNZ"] = 0.78,
            ["GAPLJ"] = 0.82,
            ["DGUEX"] = 0.75,
            ["TRKYA"] = 0.88,
        };

        foreach (var (code, providerId) in providerIds)
        {
            var baseQuality = providerQuality.GetValueOrDefault(code, 0.80);
            var providerName = Providers.First(p => p.Code == code).Name;

            for (var monthOffset = -11; monthOffset <= 0; monthOffset++)
            {
                var month = now.AddMonths(monthOffset);
                var monthIndex = month.Month - 1;

                // Seasonal variation in shipment volume
                double[] seasonalVolume = [0.7, 0.8, 0.9, 1.1, 1.2, 1.0, 0.8, 0.7, 1.1, 1.3, 1.2, 0.9];
                var baseShipments = 30 + random.Next(0, 50);
                var totalShipments = (int)(baseShipments * seasonalVolume[monthIndex]);

                // On-time rate varies slightly month to month
                var monthQuality = baseQuality + (random.NextDouble() - 0.5) * 0.08;
                monthQuality = Math.Clamp(monthQuality, 0.60, 0.99);

                var onTime = (int)(totalShipments * monthQuality);
                var late = totalShipments - onTime;
                var damaged = (int)(totalShipments * (random.NextDouble() * 0.03));
                var cancelled = (int)(totalShipments * (random.NextDouble() * 0.05));

                var avgDeliveryHours = 24 + random.NextDouble() * 48;
                var totalCost = totalShipments * (5000m + (decimal)(random.NextDouble() * 15000));
                var avgCostPerKg = totalCost / Math.Max(1, totalShipments * 5000m);
                var co2 = totalShipments * (150m + (decimal)(random.NextDouble() * 200));
                var overallScore = (decimal)(monthQuality * 85 + (1 - damaged / (double)Math.Max(1, totalShipments)) * 15);

                await using var cmd = new NpgsqlCommand(@"
                    INSERT INTO logistics.carrier_performance (id, tenant_id, provider_id, provider_name,
                        period, year, month, total_shipments, on_time_deliveries, late_deliveries,
                        damaged_shipments, cancelled_shipments, on_time_percentage, average_delivery_hours,
                        total_cost, average_cost_per_kg, co2_total_kg, overall_score,
                        calculated_at, created_by, created_at)
                    VALUES (@id, @tid, @pid, @pname,
                        @period, @year, @month, @total, @ontime, @late,
                        @damaged, @cancelled, @ontimepct, @avghours,
                        @cost, @avgcost, @co2, @score,
                        @calcAt, 'seed', NOW())
                    ON CONFLICT (tenant_id, provider_id, year, month) DO NOTHING", connection);

                cmd.Parameters.AddWithValue("id", Guid.NewGuid());
                cmd.Parameters.AddWithValue("tid", TenantId);
                cmd.Parameters.AddWithValue("pid", providerId);
                cmd.Parameters.AddWithValue("pname", providerName);
                cmd.Parameters.AddWithValue("period", month.Year * 100 + month.Month);
                cmd.Parameters.AddWithValue("year", month.Year);
                cmd.Parameters.AddWithValue("month", month.Month);
                cmd.Parameters.AddWithValue("total", totalShipments);
                cmd.Parameters.AddWithValue("ontime", onTime);
                cmd.Parameters.AddWithValue("late", late);
                cmd.Parameters.AddWithValue("damaged", damaged);
                cmd.Parameters.AddWithValue("cancelled", cancelled);
                cmd.Parameters.AddWithValue("ontimepct", Math.Round((decimal)(monthQuality * 100), 2));
                cmd.Parameters.AddWithValue("avghours", Math.Round((decimal)avgDeliveryHours, 2));
                cmd.Parameters.AddWithValue("cost", Math.Round(totalCost, 2));
                cmd.Parameters.AddWithValue("avgcost", Math.Round(avgCostPerKg, 4));
                cmd.Parameters.AddWithValue("co2", Math.Round(co2, 2));
                cmd.Parameters.AddWithValue("score", Math.Round(overallScore, 2));
                cmd.Parameters.AddWithValue("calcAt", month.AddMonths(1).AddDays(-1));

                await cmd.ExecuteNonQueryAsync();
                count++;
            }
        }

        logger.LogInformation("Seeded {Count} carrier performance records", count);
    }

    private static decimal EstimateDistance(string origin, string destination)
    {
        var originCity = TurkishCities.FirstOrDefault(c => c.City == origin);
        var destCity = TurkishCities.FirstOrDefault(c => c.City == destination);

        if (originCity == default || destCity == default) return 500m;

        // Haversine approximation in km
        var dLat = (destCity.Lat - originCity.Lat) * Math.PI / 180;
        var dLon = (destCity.Lng - originCity.Lng) * Math.PI / 180;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(originCity.Lat * Math.PI / 180) * Math.Cos(destCity.Lat * Math.PI / 180) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        var straightLine = 6371 * c;

        // Road distance is ~1.3x straight line in Turkey
        return (decimal)(straightLine * 1.3);
    }

    private static readonly string[] DriverFirstNames =
        ["Ahmet", "Mehmet", "Mustafa", "Ali", "Huseyin", "Hasan", "Ibrahim", "Ismail", "Yusuf", "Osman",
         "Murat", "Omer", "Suleyman", "Halil", "Recep", "Ramazan", "Cengiz", "Kemal", "Erdal", "Serkan"];

    private static readonly string[] DriverLastNames =
        ["Yilmaz", "Kaya", "Demir", "Celik", "Sahin", "Ozturk", "Arslan", "Dogan", "Kilic", "Aslan",
         "Yildiz", "Ozkan", "Aydin", "Polat", "Korkmaz", "Erdogan", "Ozdemir", "Aksoy", "Koc", "Kurt"];
}
