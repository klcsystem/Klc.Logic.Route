-- ============================================================================
-- 030_ComprehensiveSeedData.sql
-- Kapsamlı örnek veri: Tüm boş tabloları Türkçe gerçekçi verilerle doldur
-- Idempotent: ON CONFLICT DO NOTHING / WHERE NOT EXISTS throughout
-- ============================================================================

DO $$
DECLARE
    tid UUID := '00000000-0000-0000-0000-000000000001';

    -- Provider IDs (dynamic lookup)
    p_yolda    UUID;
    p_tirport  UUID;
    p_ekol     UUID;
    p_horoz    UUID;
    p_surat    UUID;
    p_aras     UUID;

    -- Contract IDs (dynamic lookup)
    c_yolda2   UUID;
    c_tirport1 UUID;
    c_ekol2    UUID;
    c_horoz1   UUID;
    c_surat1   UUID;
    c_aras1    UUID;

    -- Driver IDs from 019 seed (fixed UUIDs)
    d01 UUID := 'c2000000-0000-0000-0000-000000000001';
    d02 UUID := 'c2000000-0000-0000-0000-000000000002';
    d03 UUID := 'c2000000-0000-0000-0000-000000000003';
    d04 UUID := 'c2000000-0000-0000-0000-000000000004';
    d05 UUID := 'c2000000-0000-0000-0000-000000000005';
    d06 UUID := 'c2000000-0000-0000-0000-000000000006';
    d07 UUID := 'c2000000-0000-0000-0000-000000000007';
    d08 UUID := 'c2000000-0000-0000-0000-000000000008';
    d09 UUID := 'c2000000-0000-0000-0000-000000000009';
    d10 UUID := 'c2000000-0000-0000-0000-000000000010';
    d11 UUID := 'c2000000-0000-0000-0000-000000000011';
    d12 UUID := 'c2000000-0000-0000-0000-000000000012';
    d13 UUID := 'c2000000-0000-0000-0000-000000000013';
    d14 UUID := 'c2000000-0000-0000-0000-000000000014';
    d15 UUID := 'c2000000-0000-0000-0000-000000000015';
    d16 UUID := 'c2000000-0000-0000-0000-000000000016';
    d17 UUID := 'c2000000-0000-0000-0000-000000000017';
    d18 UUID := 'c2000000-0000-0000-0000-000000000018';
    d19 UUID := 'c2000000-0000-0000-0000-000000000019';
    d20 UUID := 'c2000000-0000-0000-0000-000000000020';

    -- Vehicle IDs from 019 seed (fixed UUIDs)
    v01 UUID := 'c1000000-0000-0000-0000-000000000001';
    v02 UUID := 'c1000000-0000-0000-0000-000000000002';
    v03 UUID := 'c1000000-0000-0000-0000-000000000003';
    v08 UUID := 'c1000000-0000-0000-0000-000000000008';

    -- Insurance partner IDs
    ins_axa     UUID := 'd1000000-0000-0000-0000-000000000001';
    ins_allianz UUID := 'd1000000-0000-0000-0000-000000000002';
    ins_hdi     UUID := 'd1000000-0000-0000-0000-000000000003';
    ins_mapfre  UUID := 'd1000000-0000-0000-0000-000000000004';
    ins_zurich  UUID := 'd1000000-0000-0000-0000-000000000005';

    -- Insurance quote IDs
    iq01 UUID := 'd2000000-0000-0000-0000-000000000001';
    iq02 UUID := 'd2000000-0000-0000-0000-000000000002';
    iq03 UUID := 'd2000000-0000-0000-0000-000000000003';
    iq04 UUID := 'd2000000-0000-0000-0000-000000000004';
    iq05 UUID := 'd2000000-0000-0000-0000-000000000005';
    iq06 UUID := 'd2000000-0000-0000-0000-000000000006';
    iq07 UUID := 'd2000000-0000-0000-0000-000000000007';
    iq08 UUID := 'd2000000-0000-0000-0000-000000000008';

    -- Simulation scenario IDs
    sim01 UUID := 'd3000000-0000-0000-0000-000000000001';
    sim02 UUID := 'd3000000-0000-0000-0000-000000000002';
    sim03 UUID := 'd3000000-0000-0000-0000-000000000003';
    sim04 UUID := 'd3000000-0000-0000-0000-000000000004';
    sim05 UUID := 'd3000000-0000-0000-0000-000000000005';

    -- Invoice IDs
    inv01 UUID := 'd4000000-0000-0000-0000-000000000001';
    inv02 UUID := 'd4000000-0000-0000-0000-000000000002';
    inv03 UUID := 'd4000000-0000-0000-0000-000000000003';
    inv04 UUID := 'd4000000-0000-0000-0000-000000000004';
    inv05 UUID := 'd4000000-0000-0000-0000-000000000005';
    inv06 UUID := 'd4000000-0000-0000-0000-000000000006';

    -- ML model IDs
    ml01 UUID := 'd5000000-0000-0000-0000-000000000001';
    ml02 UUID := 'd5000000-0000-0000-0000-000000000002';
    ml03 UUID := 'd5000000-0000-0000-0000-000000000003';

    -- Temp vars
    i INT;
    v_shipment_id UUID;
    v_shipment_ids UUID[];

BEGIN

-- ============================================================
-- Dynamic provider/contract lookup
-- ============================================================
SELECT id INTO p_yolda FROM logistics.providers WHERE tenant_id = tid AND is_deleted = FALSE ORDER BY created_at LIMIT 1;
SELECT id INTO p_tirport FROM logistics.providers WHERE tenant_id = tid AND is_deleted = FALSE ORDER BY created_at OFFSET 1 LIMIT 1;
SELECT id INTO p_ekol FROM logistics.providers WHERE tenant_id = tid AND is_deleted = FALSE ORDER BY created_at OFFSET 2 LIMIT 1;
SELECT id INTO p_horoz FROM logistics.providers WHERE tenant_id = tid AND is_deleted = FALSE ORDER BY created_at OFFSET 3 LIMIT 1;
SELECT id INTO p_surat FROM logistics.providers WHERE tenant_id = tid AND is_deleted = FALSE ORDER BY created_at OFFSET 4 LIMIT 1;
SELECT id INTO p_aras FROM logistics.providers WHERE tenant_id = tid AND is_deleted = FALSE ORDER BY created_at OFFSET 5 LIMIT 1;

p_yolda   := COALESCE(p_yolda, p_tirport, p_ekol);
p_tirport := COALESCE(p_tirport, p_yolda);
p_ekol    := COALESCE(p_ekol, p_yolda);
p_horoz   := COALESCE(p_horoz, p_yolda);
p_surat   := COALESCE(p_surat, p_yolda);
p_aras    := COALESCE(p_aras, p_yolda);

SELECT id INTO c_yolda2 FROM logistics.contracts WHERE tenant_id = tid AND provider_id = p_yolda AND is_deleted = FALSE LIMIT 1;
SELECT id INTO c_tirport1 FROM logistics.contracts WHERE tenant_id = tid AND provider_id = p_tirport AND is_deleted = FALSE LIMIT 1;
SELECT id INTO c_ekol2 FROM logistics.contracts WHERE tenant_id = tid AND provider_id = p_ekol AND is_deleted = FALSE LIMIT 1;
SELECT id INTO c_horoz1 FROM logistics.contracts WHERE tenant_id = tid AND provider_id = p_horoz AND is_deleted = FALSE LIMIT 1;
SELECT id INTO c_surat1 FROM logistics.contracts WHERE tenant_id = tid AND provider_id = p_surat AND is_deleted = FALSE LIMIT 1;
SELECT id INTO c_aras1 FROM logistics.contracts WHERE tenant_id = tid AND provider_id = p_aras AND is_deleted = FALSE LIMIT 1;

-- ============================================================
-- 1. UPDATE SHIPMENTS — origin/destination cities + provider assignment
-- ============================================================
-- Update shipments that have NULL or empty origin_city/destination_city
UPDATE logistics.shipments SET
    origin_city = CASE (SUBSTR(id::TEXT, 1, 1))
        WHEN '0' THEN 'İstanbul'
        WHEN '1' THEN 'Ankara'
        WHEN '2' THEN 'İzmir'
        WHEN '3' THEN 'Bursa'
        WHEN '4' THEN 'Antalya'
        WHEN '5' THEN 'Adana'
        WHEN '6' THEN 'Konya'
        WHEN '7' THEN 'Gaziantep'
        WHEN '8' THEN 'Mersin'
        WHEN '9' THEN 'Kayseri'
        WHEN 'a' THEN 'Eskişehir'
        WHEN 'b' THEN 'Samsun'
        WHEN 'c' THEN 'Trabzon'
        WHEN 'd' THEN 'Diyarbakır'
        WHEN 'e' THEN 'Denizli'
        ELSE 'İstanbul'
    END,
    origin_address = CASE (SUBSTR(id::TEXT, 1, 1))
        WHEN '0' THEN 'Hadımköy Lojistik Merkezi, Arnavutköy, İstanbul'
        WHEN '1' THEN 'Sincan Organize Sanayi Bölgesi, Ankara'
        WHEN '2' THEN 'Atatürk OSB, Çiğli, İzmir'
        WHEN '3' THEN 'Nilüfer OSB, Bursa'
        WHEN '4' THEN 'Antalya Serbest Bölge, Antalya'
        WHEN '5' THEN 'Hacı Sabancı OSB, Adana'
        WHEN '6' THEN 'Konya 1. OSB, Konya'
        WHEN '7' THEN 'Gaziantep OSB, Gaziantep'
        WHEN '8' THEN 'Mersin Serbest Bölge, Mersin'
        WHEN '9' THEN 'Kayseri OSB, Kayseri'
        WHEN 'a' THEN 'Eskişehir Organize Sanayi, Eskişehir'
        WHEN 'b' THEN 'Samsun Liman Lojistik, Samsun'
        WHEN 'c' THEN 'Trabzon Liman Bölgesi, Trabzon'
        WHEN 'd' THEN 'Diyarbakır OSB, Diyarbakır'
        WHEN 'e' THEN 'Denizli Sanayi Sitesi, Denizli'
        ELSE 'Hadımköy Lojistik Merkezi, Arnavutköy, İstanbul'
    END,
    destination_city = CASE (SUBSTR(id::TEXT, 2, 1))
        WHEN '0' THEN 'Ankara'
        WHEN '1' THEN 'İzmir'
        WHEN '2' THEN 'Bursa'
        WHEN '3' THEN 'Antalya'
        WHEN '4' THEN 'İstanbul'
        WHEN '5' THEN 'Konya'
        WHEN '6' THEN 'Adana'
        WHEN '7' THEN 'Trabzon'
        WHEN '8' THEN 'Samsun'
        WHEN '9' THEN 'Gaziantep'
        WHEN 'a' THEN 'Kayseri'
        WHEN 'b' THEN 'Mersin'
        WHEN 'c' THEN 'Eskişehir'
        WHEN 'd' THEN 'Diyarbakır'
        WHEN 'e' THEN 'Denizli'
        ELSE 'Ankara'
    END,
    destination_address = CASE (SUBSTR(id::TEXT, 2, 1))
        WHEN '0' THEN 'OSTİM OSB, Yenimahalle, Ankara'
        WHEN '1' THEN 'Alsancak Liman Bölgesi, İzmir'
        WHEN '2' THEN 'Demirtaş OSB, Bursa'
        WHEN '3' THEN 'Antalya Merkez Depo, Antalya'
        WHEN '4' THEN 'Tuzla Deri OSB, İstanbul'
        WHEN '5' THEN 'Konya Büyükşehir OSB, Konya'
        WHEN '6' THEN 'Ceyhan OSB, Adana'
        WHEN '7' THEN 'Trabzon Liman Bölgesi, Trabzon'
        WHEN '8' THEN 'Samsun Sanayi Sitesi, Samsun'
        WHEN '9' THEN 'Gaziantep Organize Sanayi, Gaziantep'
        WHEN 'a' THEN 'Kayseri OSB, Kayseri'
        WHEN 'b' THEN 'Mersin Serbest Bölge, Mersin'
        WHEN 'c' THEN 'Eskişehir Merkez Depo, Eskişehir'
        WHEN 'd' THEN 'Diyarbakır Merkez Depo, Diyarbakır'
        WHEN 'e' THEN 'Denizli Sanayi Sitesi, Denizli'
        ELSE 'OSTİM OSB, Yenimahalle, Ankara'
    END,
    selected_provider_id = CASE (SUBSTR(id::TEXT, 3, 1))
        WHEN '0' THEN p_yolda
        WHEN '1' THEN p_tirport
        WHEN '2' THEN p_ekol
        WHEN '3' THEN p_horoz
        WHEN '4' THEN p_surat
        WHEN '5' THEN p_aras
        WHEN '6' THEN p_yolda
        WHEN '7' THEN p_tirport
        WHEN '8' THEN p_ekol
        WHEN '9' THEN p_horoz
        WHEN 'a' THEN p_surat
        WHEN 'b' THEN p_aras
        WHEN 'c' THEN p_yolda
        WHEN 'd' THEN p_tirport
        WHEN 'e' THEN p_ekol
        ELSE p_yolda
    END,
    driver_name = CASE (SUBSTR(id::TEXT, 4, 1))
        WHEN '0' THEN 'Burak Yıldırım'
        WHEN '1' THEN 'Emrah Şahin'
        WHEN '2' THEN 'Cem Özdemir'
        WHEN '3' THEN 'Tolga Aksoy'
        WHEN '4' THEN 'Uğur Korkmaz'
        WHEN '5' THEN 'Volkan Doğan'
        WHEN '6' THEN 'Yasin Arslan'
        WHEN '7' THEN 'Zafer Polat'
        WHEN '8' THEN 'Alper Çetin'
        WHEN '9' THEN 'Barış Kurt'
        WHEN 'a' THEN 'Cenk Aydın'
        WHEN 'b' THEN 'Deniz Koç'
        WHEN 'c' THEN 'Erdem Özkan'
        WHEN 'd' THEN 'Ferhat Aslan'
        WHEN 'e' THEN 'Gökhan Yıldız'
        ELSE 'Hakan Kılıç'
    END,
    vehicle_plate = CASE (SUBSTR(id::TEXT, 5, 1))
        WHEN '0' THEN '34 ABC 123'
        WHEN '1' THEN '34 DEF 456'
        WHEN '2' THEN '41 GHİ 789'
        WHEN '3' THEN '06 KLM 234'
        WHEN '4' THEN '34 NOP 567'
        WHEN '5' THEN '16 RST 890'
        WHEN '6' THEN '35 UVW 012'
        WHEN '7' THEN '34 XYZ 345'
        WHEN '8' THEN '34 AKL 678'
        WHEN '9' THEN '34 BMS 901'
        WHEN 'a' THEN '41 CNR 234'
        WHEN 'b' THEN '34 DPT 567'
        WHEN 'c' THEN '06 ERS 890'
        WHEN 'd' THEN '35 FYZ 123'
        WHEN 'e' THEN '34 GKL 456'
        ELSE '16 HMN 789'
    END,
    updated_at = NOW(),
    updated_by = 'seed-030'
WHERE tenant_id = tid
  AND (origin_city IS NULL OR origin_city = '' OR origin_city = '--'
       OR destination_city IS NULL OR destination_city = '' OR destination_city = '--'
       OR selected_provider_id IS NULL);

-- Also update shipments that have non-Turkish city names (missing İ, ş, etc.)
UPDATE logistics.shipments SET
    origin_city = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(origin_city,
        'Istanbul', 'İstanbul'), 'Izmir', 'İzmir'), 'Eskisehir', 'Eskişehir'),
        'Diyarbakir', 'Diyarbakır'), 'Sanliurfa', 'Şanlıurfa'),
        'Kahramanmaras', 'Kahramanmaraş'), 'Nevsehir', 'Nevşehir'),
    destination_city = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(destination_city,
        'Istanbul', 'İstanbul'), 'Izmir', 'İzmir'), 'Eskisehir', 'Eskişehir'),
        'Diyarbakir', 'Diyarbakır'), 'Sanliurfa', 'Şanlıurfa'),
        'Kahramanmaras', 'Kahramanmaraş'), 'Nevsehir', 'Nevşehir'),
    updated_at = NOW(),
    updated_by = 'seed-030'
WHERE tenant_id = tid
  AND (origin_city LIKE '%Istanbul%' OR origin_city LIKE '%Izmir%' OR origin_city LIKE '%Eskisehir%'
       OR origin_city LIKE '%Diyarbakir%' OR origin_city LIKE '%Sanliurfa%'
       OR destination_city LIKE '%Istanbul%' OR destination_city LIKE '%Izmir%'
       OR destination_city LIKE '%Eskisehir%' OR destination_city LIKE '%Diyarbakir%');

-- Also update orders with Turkish city names
UPDATE logistics.orders SET
    origin_city = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(origin_city,
        'Istanbul', 'İstanbul'), 'Izmir', 'İzmir'), 'Eskisehir', 'Eskişehir'),
        'Diyarbakir', 'Diyarbakır'), 'Sanliurfa', 'Şanlıurfa'),
        'Kahramanmaras', 'Kahramanmaraş'), 'Nevsehir', 'Nevşehir'),
    destination_city = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(destination_city,
        'Istanbul', 'İstanbul'), 'Izmir', 'İzmir'), 'Eskisehir', 'Eskişehir'),
        'Diyarbakir', 'Diyarbakır'), 'Sanliurfa', 'Şanlıurfa'),
        'Kahramanmaras', 'Kahramanmaraş'), 'Nevsehir', 'Nevşehir'),
    updated_at = NOW()
WHERE tenant_id = tid
  AND (origin_city LIKE '%Istanbul%' OR origin_city LIKE '%Izmir%' OR origin_city LIKE '%Eskisehir%'
       OR origin_city LIKE '%Diyarbakir%' OR origin_city LIKE '%Sanliurfa%'
       OR destination_city LIKE '%Istanbul%' OR destination_city LIKE '%Izmir%'
       OR destination_city LIKE '%Eskisehir%' OR destination_city LIKE '%Diyarbakir%');


-- ============================================================
-- 2. ML MODELS (3 model types for prediction)
-- ============================================================
INSERT INTO logistics.ml_models (id, tenant_id, model_type, model_version, file_path, metrics, training_records, is_active, trained_at, is_deleted, created_at, created_by)
VALUES
    (ml01, tid, 'DeliveryTime', 'v2.1.0', '/models/delivery_time_v2.1.pkl',
     '{"rmse": 1.85, "mae": 1.42, "r2": 0.91, "accuracy_1h": 0.78, "accuracy_2h": 0.94}'::JSONB,
     15200, TRUE, '2026-06-15 03:00:00+03', FALSE, NOW(), 'seed'),
    (ml02, tid, 'DelayRisk', 'v1.4.0', '/models/delay_risk_v1.4.pkl',
     '{"auc_roc": 0.89, "precision": 0.82, "recall": 0.85, "f1": 0.835, "accuracy": 0.87}'::JSONB,
     12800, TRUE, '2026-06-15 04:00:00+03', FALSE, NOW(), 'seed'),
    (ml03, tid, 'CostAnomaly', 'v1.2.0', '/models/cost_anomaly_v1.2.pkl',
     '{"auc_roc": 0.92, "precision": 0.88, "recall": 0.79, "f1": 0.832, "false_positive_rate": 0.05}'::JSONB,
     9500, TRUE, '2026-06-15 05:00:00+03', FALSE, NOW(), 'seed')
ON CONFLICT DO NOTHING;


-- ============================================================
-- 3. PREDICTION LOG (30 days of demand forecast data)
-- ============================================================
INSERT INTO logistics.prediction_log (id, tenant_id, model_id, model_type, input_features, predicted_value, actual_value, prediction_at, is_deleted, created_at, created_by)
SELECT
    gen_random_uuid(), tid,
    CASE (row_num % 3)
        WHEN 0 THEN ml01
        WHEN 1 THEN ml02
        ELSE ml03
    END,
    CASE (row_num % 3)
        WHEN 0 THEN 'DeliveryTime'
        WHEN 1 THEN 'DelayRisk'
        ELSE 'CostAnomaly'
    END,
    CASE (row_num % 3)
        WHEN 0 THEN jsonb_build_object(
            'origin_city', cities.origin,
            'destination_city', cities.dest,
            'weight_kg', 5000 + (row_num * 137 % 20000),
            'vehicle_type', CASE row_num % 4 WHEN 0 THEN 'Tır' WHEN 1 THEN 'Kamyon' WHEN 2 THEN 'Kamyonet' ELSE 'Frigorifik' END,
            'day_of_week', row_num % 7,
            'hour', 6 + (row_num % 14),
            'is_hazardous', (row_num % 8 = 0)
        )
        WHEN 1 THEN jsonb_build_object(
            'origin_city', cities.origin,
            'destination_city', cities.dest,
            'provider', CASE row_num % 6 WHEN 0 THEN 'Yolda Lojistik' WHEN 1 THEN 'Tirport' WHEN 2 THEN 'Ekol Lojistik' WHEN 3 THEN 'Horoz Lojistik' WHEN 4 THEN 'Sürat Kargo' ELSE 'Aras Kargo' END,
            'distance_km', 200 + (row_num * 53 % 1200),
            'weather', CASE row_num % 5 WHEN 0 THEN 'Güneşli' WHEN 1 THEN 'Yağmurlu' WHEN 2 THEN 'Bulutlu' WHEN 3 THEN 'Karlı' ELSE 'Sisli' END
        )
        ELSE jsonb_build_object(
            'shipment_cost', 2000 + (row_num * 89 % 15000),
            'expected_cost', 1800 + (row_num * 67 % 14000),
            'provider', CASE row_num % 6 WHEN 0 THEN 'Yolda Lojistik' WHEN 1 THEN 'Tirport' WHEN 2 THEN 'Ekol Lojistik' WHEN 3 THEN 'Horoz Lojistik' WHEN 4 THEN 'Sürat Kargo' ELSE 'Aras Kargo' END,
            'route', cities.origin || ' → ' || cities.dest
        )
    END,
    CASE (row_num % 3)
        WHEN 0 THEN 8.5 + (row_num % 30) * 0.5   -- delivery hours prediction
        WHEN 1 THEN 0.05 + (row_num % 20) * 0.04  -- delay risk probability
        ELSE (row_num % 2)::FLOAT                  -- anomaly flag (0 or 1)
    END,
    CASE (row_num % 3)
        WHEN 0 THEN 7.8 + (row_num % 35) * 0.6    -- actual delivery hours
        WHEN 1 THEN CASE WHEN row_num % 5 = 0 THEN 1.0 ELSE 0.0 END -- actual delay
        ELSE CASE WHEN row_num % 10 = 0 THEN 1.0 ELSE 0.0 END       -- actual anomaly
    END,
    NOW() - ((row_num % 30) || ' days')::INTERVAL - ((row_num % 8) || ' hours')::INTERVAL,
    FALSE, NOW(), 'seed'
FROM (
    SELECT
        gs AS row_num,
        CASE gs % 10
            WHEN 0 THEN 'İstanbul'  WHEN 1 THEN 'Ankara'    WHEN 2 THEN 'İzmir'
            WHEN 3 THEN 'Bursa'     WHEN 4 THEN 'Antalya'   WHEN 5 THEN 'Konya'
            WHEN 6 THEN 'Adana'     WHEN 7 THEN 'Gaziantep' WHEN 8 THEN 'Mersin'
            ELSE 'Trabzon'
        END AS origin,
        CASE (gs * 3 + 7) % 10
            WHEN 0 THEN 'Ankara'    WHEN 1 THEN 'İstanbul'  WHEN 2 THEN 'Bursa'
            WHEN 3 THEN 'İzmir'     WHEN 4 THEN 'Konya'     WHEN 5 THEN 'Antalya'
            WHEN 6 THEN 'Gaziantep' WHEN 7 THEN 'Samsun'    WHEN 8 THEN 'Kayseri'
            ELSE 'Eskişehir'
        END AS dest
    FROM generate_series(1, 90) gs
) cities
WHERE NOT EXISTS (SELECT 1 FROM logistics.prediction_log WHERE tenant_id = tid LIMIT 1)
ON CONFLICT DO NOTHING;


-- ============================================================
-- 4. DRIVER LOCATIONS (for safety/wellness calculations)
-- Simulates today's GPS data for 10 active drivers
-- ============================================================
INSERT INTO logistics.driver_locations (id, tenant_id, driver_id, lat, lng, speed, heading, accuracy, recorded_at, is_deleted, created_at, created_by)
SELECT
    gen_random_uuid(), tid,
    driver_ids.did,
    base_lat + (gs * 0.003),
    base_lng + (gs * 0.004),
    40.0 + (gs % 30) * 2.0,   -- speed 40-100 km/h
    (gs * 37 % 360)::FLOAT,   -- heading 0-360
    5.0 + (gs % 10) * 0.5,    -- accuracy 5-10m
    NOW() - ((20 - gs) || ' hours')::INTERVAL + ((gs * 15) || ' minutes')::INTERVAL,
    FALSE, NOW(), 'seed'
FROM generate_series(1, 8) gs
CROSS JOIN (VALUES
    (d01, 41.0082, 28.9784),  -- İstanbul
    (d02, 41.0500, 29.0100),  -- İstanbul
    (d05, 39.9334, 32.8597),  -- Ankara
    (d06, 39.9500, 32.8800),  -- Ankara
    (d09, 38.4192, 27.1287),  -- İzmir
    (d12, 40.1885, 29.0610),  -- Bursa
    (d15, 41.0082, 28.9784),  -- İstanbul
    (d18, 39.9334, 32.8597),  -- Ankara
    (d07, 36.8969, 30.7133),  -- Antalya
    (d10, 37.8746, 32.4932)   -- Konya
) AS driver_ids(did, base_lat, base_lng)
WHERE NOT EXISTS (SELECT 1 FROM logistics.driver_locations WHERE tenant_id = tid AND driver_id = d01 LIMIT 1)
ON CONFLICT DO NOTHING;


-- ============================================================
-- 5. INSURANCE PARTNERS (5 Turkish insurance companies)
-- ============================================================
INSERT INTO logistics.insurance_partners (id, tenant_id, name, api_endpoint, api_key, has_api, contact_email, commission_percent, is_active, is_deleted, created_at, created_by)
VALUES
    (ins_axa,     tid, 'Axa Sigorta',          'https://api.axasigorta.com.tr/v1',    NULL, FALSE, 'lojistik@axasigorta.com.tr',    3.50, TRUE, FALSE, NOW(), 'seed'),
    (ins_allianz, tid, 'Allianz Türkiye',      'https://api.allianz.com.tr/cargo/v2', NULL, TRUE,  'kargo@allianz.com.tr',          4.00, TRUE, FALSE, NOW(), 'seed'),
    (ins_hdi,     tid, 'HDI Sigorta',          'https://api.hdisigorta.com.tr/v1',    NULL, FALSE, 'nakliyat@hdisigorta.com.tr',     3.00, TRUE, FALSE, NOW(), 'seed'),
    (ins_mapfre,  tid, 'Mapfre Sigorta',       'https://api.mapfre.com.tr/cargo',     NULL, TRUE,  'kargo@mapfre.com.tr',           3.75, TRUE, FALSE, NOW(), 'seed'),
    (ins_zurich,  tid, 'Zürich Sigorta',       'https://api.zurich.com.tr/v1',        NULL, FALSE, 'nakliyat@zurich.com.tr',        4.25, TRUE, FALSE, NOW(), 'seed')
ON CONFLICT DO NOTHING;


-- ============================================================
-- 6. INSURANCE QUOTES + POLICIES
-- ============================================================
-- Get 8 completed shipment IDs for insurance
SELECT ARRAY_AGG(s.id ORDER BY s.created_at DESC) INTO v_shipment_ids
FROM (SELECT id, created_at FROM logistics.shipments WHERE tenant_id = tid AND status = 9 AND is_deleted = FALSE LIMIT 8) s;

IF v_shipment_ids IS NOT NULL AND array_length(v_shipment_ids, 1) >= 8 THEN

INSERT INTO logistics.insurance_quotes (id, tenant_id, shipment_id, partner_id, cargo_value, risk_score, premium_amount, currency, valid_until, status, is_deleted, created_at, created_by)
VALUES
    (iq01, tid, v_shipment_ids[1], ins_axa,     125000.00, 3.2, 1875.00, 'TRY', NOW() + INTERVAL '30 days', 2, FALSE, NOW() - INTERVAL '15 days', 'seed'),
    (iq02, tid, v_shipment_ids[2], ins_allianz,  85000.00, 2.1, 1020.00, 'TRY', NOW() + INTERVAL '25 days', 2, FALSE, NOW() - INTERVAL '12 days', 'seed'),
    (iq03, tid, v_shipment_ids[3], ins_hdi,     200000.00, 4.5, 3400.00, 'TRY', NOW() + INTERVAL '20 days', 2, FALSE, NOW() - INTERVAL '10 days', 'seed'),
    (iq04, tid, v_shipment_ids[4], ins_mapfre,   45000.00, 1.8,  540.00, 'TRY', NOW() + INTERVAL '15 days', 2, FALSE, NOW() - INTERVAL '8 days',  'seed'),
    (iq05, tid, v_shipment_ids[5], ins_zurich,  310000.00, 5.0, 5580.00, 'TRY', NOW() + INTERVAL '10 days', 1, FALSE, NOW() - INTERVAL '5 days',  'seed'),
    (iq06, tid, v_shipment_ids[6], ins_axa,      72000.00, 2.5,  936.00, 'TRY', NOW() + INTERVAL '28 days', 1, FALSE, NOW() - INTERVAL '3 days',  'seed'),
    (iq07, tid, v_shipment_ids[7], ins_allianz, 150000.00, 3.8, 2250.00, 'TRY', NOW() - INTERVAL '5 days',  3, FALSE, NOW() - INTERVAL '35 days', 'seed'),
    (iq08, tid, v_shipment_ids[8], ins_hdi,      98000.00, 2.9, 1372.00, 'TRY', NOW() + INTERVAL '22 days', 0, FALSE, NOW() - INTERVAL '1 day',   'seed')
ON CONFLICT DO NOTHING;

-- Policies for accepted quotes (status=2)
INSERT INTO logistics.insurance_policies (id, tenant_id, quote_id, shipment_id, partner_id, policy_number, premium_paid, coverage_amount, start_date, end_date, status, is_deleted, created_at, created_by)
VALUES
    (gen_random_uuid(), tid, iq01, v_shipment_ids[1], ins_axa,     'POL-AXA-2026-00142',     1875.00, 125000.00, NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', 0, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, iq02, v_shipment_ids[2], ins_allianz, 'POL-ALZ-2026-00089',     1020.00,  85000.00, NOW() - INTERVAL '12 days', NOW() + INTERVAL '18 days', 0, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, iq03, v_shipment_ids[3], ins_hdi,     'POL-HDI-2026-00215',     3400.00, 200000.00, NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', 0, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, iq04, v_shipment_ids[4], ins_mapfre,  'POL-MPF-2026-00067',      540.00,  45000.00, NOW() - INTERVAL '8 days',  NOW() + INTERVAL '22 days', 2, FALSE, NOW(), 'seed')
ON CONFLICT DO NOTHING;

END IF;


-- ============================================================
-- 7. CAPACITY MARKETPLACE LISTINGS (15 listings)
-- ============================================================
INSERT INTO logistics.capacity_listings (id, tenant_id, origin_city, destination_city, available_date, available_weight_kg, available_volume_m3, vehicle_type, price_per_kg, status, contact_phone, notes, is_deleted, created_at, created_by)
VALUES
    -- Available
    (gen_random_uuid(), tid, 'İstanbul',   'Ankara',     '2026-07-05', 8000.00,  32.00, 'Tır',        1.20, 0, '+905361112233', 'Hadımköy deposundan çıkış, tam yük tercih edilir',           FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'İstanbul',   'İzmir',      '2026-07-06', 5000.00,  20.00, 'Kamyon',     1.50, 0, '+905362223344', 'Parsiyel yük kabul edilir, minimum 2 ton',                   FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'Ankara',     'Antalya',    '2026-07-07', 12000.00, 48.00, 'Tır',        1.10, 0, '+905371112233', 'Soğuk zincir uygun, frigorifik araç mevcut',                 FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'İzmir',      'Bursa',      '2026-07-08', 3000.00,  12.00, 'Kamyonet',   1.80, 0, '+905381112233', 'Hızlı teslimat, aynı gün dönüş',                            FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'Bursa',      'İstanbul',   '2026-07-09', 6000.00,  24.00, 'Kamyon',     1.35, 0, '+905391112233', 'Nilüfer OSB''den yükleme, Hadımköy''e teslimat',             FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'Konya',      'Gaziantep',  '2026-07-10', 15000.00, 60.00, 'Tır',        0.95, 0, '+905382223344', 'Tenteli tır, ADR belgeli şoför mevcut',                      FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'Adana',      'Mersin',     '2026-07-04', 2000.00,   8.00, 'Kamyonet',   2.00, 0, '+905392223344', 'Şehir içi dağıtım, küçük paketler',                         FALSE, NOW(), 'seed'),
    -- Matched
    (gen_random_uuid(), tid, 'İstanbul',   'Trabzon',    '2026-07-02', 10000.00, 40.00, 'Tır',        1.40, 1, '+905363334455', 'Karadeniz hattı, Samsun aktarmalı',                          FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'Ankara',     'İstanbul',   '2026-07-03', 7500.00,  30.00, 'Kamyon',     1.25, 1, '+905372223344', 'OSTİM''den yükleme, dönüş yükü aranıyor',                   FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'İzmir',      'Antalya',    '2026-07-01', 4500.00,  18.00, 'Kamyon',     1.60, 1, '+905383334455', 'Ege-Akdeniz hattı, düzenli sefer',                           FALSE, NOW(), 'seed'),
    -- Expired
    (gen_random_uuid(), tid, 'Gaziantep',  'Diyarbakır', '2026-06-25', 8000.00,  32.00, 'Tır',        1.30, 2, '+905393334455', 'Güneydoğu hattı, süre doldu',                                FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'Samsun',     'Ankara',     '2026-06-26', 6000.00,  24.00, 'Kamyon',     1.45, 2, '+905401112233', 'Karadeniz-İç Anadolu, talep gelmedi',                        FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'Kayseri',    'İstanbul',   '2026-06-27', 9000.00,  36.00, 'Tır',        1.15, 2, '+905402223344', 'İç Anadolu dönüş yükü, süre doldu',                          FALSE, NOW(), 'seed'),
    -- Cancelled
    (gen_random_uuid(), tid, 'Trabzon',    'İstanbul',   '2026-06-28', 5000.00,  20.00, 'Kamyon',     1.55, 3, '+905403334455', 'Araç arızası nedeniyle iptal',                                FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'Eskişehir',  'İzmir',      '2026-06-29', 3500.00,  14.00, 'Kamyonet',   1.70, 3, '+905411112233', 'Müşteri vazgeçti',                                            FALSE, NOW(), 'seed')
ON CONFLICT DO NOTHING;


-- ============================================================
-- 8. SIMULATION SCENARIOS + RESULTS
-- ============================================================
INSERT INTO logistics.simulation_scenarios (id, tenant_id, name, description, base_snapshot, modifications, status, is_deleted, created_at, created_by)
VALUES
    (sim01, tid, 'Yakıt Fiyat Artışı Senaryosu',
     'Mazot fiyatının %25 artması durumunda toplam lojistik maliyetlere etkisi',
     '{"fuel_price_try": 45.00, "total_vehicles": 16, "avg_daily_km": 350}'::JSONB,
     '{"fuel_price_try": 56.25, "price_increase_pct": 25}'::JSONB,
     'Completed', FALSE, NOW() - INTERVAL '10 days', 'seed'),

    (sim02, tid, 'Araç Filosu Genişletme',
     '4 yeni frigorifik araç eklenmesi durumunda kapasite ve maliyet analizi',
     '{"total_vehicles": 16, "frigo_vehicles": 3, "daily_capacity_kg": 120000}'::JSONB,
     '{"total_vehicles": 20, "frigo_vehicles": 7, "added_vehicles": 4}'::JSONB,
     'Completed', FALSE, NOW() - INTERVAL '7 days', 'seed'),

    (sim03, tid, 'Güneydoğu Bölge Açılımı',
     'Diyarbakır ve Şanlıurfa bölgesine yeni hat açılmasının simülasyonu',
     '{"service_regions": ["Marmara","Ege","İç Anadolu","Akdeniz","Karadeniz"], "total_routes": 10}'::JSONB,
     '{"service_regions": ["Marmara","Ege","İç Anadolu","Akdeniz","Karadeniz","Güneydoğu Anadolu"], "added_routes": 3}'::JSONB,
     'Completed', FALSE, NOW() - INTERVAL '5 days', 'seed'),

    (sim04, tid, 'Gece Dağıtım Optimizasyonu',
     '22:00-06:00 arası dağıtım yapılması durumunda trafik ve maliyet avantajı',
     '{"delivery_window": "08:00-18:00", "avg_speed_kmh": 45, "fuel_consumption_factor": 1.0}'::JSONB,
     '{"delivery_window": "22:00-06:00", "avg_speed_kmh": 65, "fuel_consumption_factor": 0.85}'::JSONB,
     'Completed', FALSE, NOW() - INTERVAL '3 days', 'seed'),

    (sim05, tid, 'Bayram Dönemi Yoğunluk',
     'Kurban Bayramı öncesi %40 talep artışı senaryosu',
     '{"daily_orders": 45, "avg_weight_per_order_kg": 3500, "vehicle_utilization_pct": 72}'::JSONB,
     '{"daily_orders": 63, "demand_increase_pct": 40, "vehicle_utilization_pct": 95}'::JSONB,
     'Draft', FALSE, NOW() - INTERVAL '1 day', 'seed')
ON CONFLICT DO NOTHING;

-- Simulation results (for completed scenarios)
INSERT INTO logistics.simulation_results (id, tenant_id, scenario_id, total_cost, total_distance_km, total_duration_hours, vehicle_utilization_pct, on_time_prediction_pct, co2_total_kg, unserved_shipments, cost_delta_pct, details, is_deleted, created_at, created_by)
VALUES
    (gen_random_uuid(), tid, sim01, 485000.00, 12500.0, 280.0, 78.5, 89.2, 7500.0, 2, 18.5,
     '{"analysis": "Yakıt maliyeti %25 artınca toplam maliyet %18.5 arttı. Kısa mesafe rotalar daha az etkilendi. Uzun mesafe hatlarında alternatif güzergâh planlaması önerilir.", "recommendations": ["Rota konsolidasyonu yapılmalı", "Demiryolu intermodal seçeneği değerlendirilmeli"]}'::JSONB,
     FALSE, NOW(), 'seed'),

    (gen_random_uuid(), tid, sim02, 520000.00, 15200.0, 340.0, 85.2, 93.5, 9120.0, 0, 12.8,
     '{"analysis": "4 frigorifik araç eklenmesiyle soğuk zincir kapasitesi %133 arttı. Araç kullanım oranı %85.2 ile optimum seviyede. Yatırım 8 ayda kendini amorti eder.", "roi_months": 8, "capacity_increase_pct": 133}'::JSONB,
     FALSE, NOW(), 'seed'),

    (gen_random_uuid(), tid, sim03, 445000.00, 18500.0, 420.0, 71.3, 86.8, 11100.0, 5, -3.2,
     '{"analysis": "Güneydoğu bölge açılımıyla 3 yeni hat eklendi. İlk yılda %3.2 maliyet düşüşü bekleniyor (ölçek ekonomisi). Diyarbakır deposu kurulumu gerekli.", "new_customers_estimate": 45, "new_routes": 3}'::JSONB,
     FALSE, NOW(), 'seed'),

    (gen_random_uuid(), tid, sim04, 380000.00, 11800.0, 195.0, 82.0, 95.1, 6490.0, 1, -8.7,
     '{"analysis": "Gece dağıtımı trafik yoğunluğunu ortadan kaldırarak ortalama hızı %44 artırdı. Yakıt tüketimi %15 azaldı. CO₂ emisyonu %13.5 düştü. Şoför gece mesai ücreti ek maliyet.", "speed_increase_pct": 44, "fuel_savings_pct": 15, "co2_reduction_pct": 13.5}'::JSONB,
     FALSE, NOW(), 'seed')
ON CONFLICT DO NOTHING;


-- ============================================================
-- 9. COLD CHAIN TEMPERATURE READINGS (60 readings for frigo shipments)
-- ============================================================
INSERT INTO logistics.temperature_readings (id, tenant_id, shipment_id, vehicle_id, sensor_id, temperature, humidity, lat, lng, reading_at, is_alarm, is_deleted, created_at, created_by)
SELECT
    gen_random_uuid(), tid,
    s.id,
    v03,  -- frigorifik araç
    'SENS-FRIGO-' || LPAD((row_number() OVER (ORDER BY s.created_at) % 5 + 1)::TEXT, 3, '0'),
    -- Temperature: mostly normal (-2 to 4°C), occasional alarms
    CASE
        WHEN (row_number() OVER (ORDER BY s.created_at)) % 15 = 0 THEN 8.5   -- alarm: too warm
        WHEN (row_number() OVER (ORDER BY s.created_at)) % 20 = 0 THEN -5.2  -- alarm: too cold
        ELSE -1.0 + (row_number() OVER (ORDER BY s.created_at) % 50) * 0.1   -- normal range
    END,
    -- Humidity: 60-85%
    60.0 + (row_number() OVER (ORDER BY s.created_at) % 25),
    -- Lat/lng along İstanbul-Ankara route
    41.0082 - (row_number() OVER (ORDER BY s.created_at) % 12) * 0.09,
    28.9784 + (row_number() OVER (ORDER BY s.created_at) % 12) * 0.32,
    s.created_at + ((row_number() OVER (ORDER BY s.created_at)) * 30 || ' minutes')::INTERVAL,
    -- is_alarm when temp out of range
    CASE WHEN (row_number() OVER (ORDER BY s.created_at)) % 15 = 0 OR (row_number() OVER (ORDER BY s.created_at)) % 20 = 0 THEN TRUE ELSE FALSE END,
    FALSE, NOW(), 'seed'
FROM logistics.shipments s
WHERE s.tenant_id = tid AND s.requires_cold_chain = TRUE AND s.is_deleted = FALSE
ORDER BY s.created_at DESC
LIMIT 60
ON CONFLICT DO NOTHING;


-- ============================================================
-- 10. INVOICES + INVOICE LINES (from completed shipments)
-- ============================================================
INSERT INTO logistics.invoices (id, tenant_id, invoice_number, customer_name, period_month, period_year, total_amount, currency, status, sent_at, paid_at, notes, is_deleted, created_at, created_by)
VALUES
    (inv01, tid, 'FTR-2026-06-001', 'ABC Gıda A.Ş.',       6, 2026, 45250.00, 'TRY', 'Paid',  '2026-06-28 10:00+03', '2026-06-30 14:00+03', 'Haziran ayı gıda sevkiyat faturaları',          FALSE, NOW(), 'seed'),
    (inv02, tid, 'FTR-2026-06-002', 'Vestel Elektronik',    6, 2026, 78400.00, 'TRY', 'Paid',  '2026-06-28 11:00+03', '2026-06-30 16:00+03', 'Haziran ayı elektronik ürün taşımacılığı',     FALSE, NOW(), 'seed'),
    (inv03, tid, 'FTR-2026-06-003', 'LC Waikiki Depo',      6, 2026, 32150.00, 'TRY', 'Sent',  '2026-06-29 09:00+03', NULL,                   'Haziran ayı tekstil dağıtım faturaları',       FALSE, NOW(), 'seed'),
    (inv04, tid, 'FTR-2026-06-004', 'TOFAŞ Otomotiv',       6, 2026, 95800.00, 'TRY', 'Sent',  '2026-06-29 10:30+03', NULL,                   'Haziran ayı otomotiv parça taşımacılığı',      FALSE, NOW(), 'seed'),
    (inv05, tid, 'FTR-2026-07-001', 'Migros Dağıtım',       7, 2026, 58700.00, 'TRY', 'Draft', NULL,                  NULL,                   'Temmuz ayı gıda soğuk zincir dağıtımı',        FALSE, NOW(), 'seed'),
    (inv06, tid, 'FTR-2026-07-002', 'Arçelik Beyaz Eşya',   7, 2026, 112500.00,'TRY', 'Draft', NULL,                  NULL,                   'Temmuz ayı beyaz eşya lojistik hizmetleri',    FALSE, NOW(), 'seed')
ON CONFLICT DO NOTHING;

-- Invoice lines (3-5 lines per invoice)
INSERT INTO logistics.invoice_lines (id, tenant_id, invoice_id, description, quantity, unit_price, amount, is_deleted, created_at, created_by)
VALUES
    -- inv01: ABC Gıda
    (gen_random_uuid(), tid, inv01, 'İstanbul → Ankara gıda sevkiyatı (Tır)',                3, 8500.00,  25500.00, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, inv01, 'İstanbul → İzmir gıda sevkiyatı (Kamyon)',              2, 6200.00,  12400.00, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, inv01, 'Soğuk zincir ek hizmet bedeli',                          1, 7350.00,   7350.00, FALSE, NOW(), 'seed'),
    -- inv02: Vestel
    (gen_random_uuid(), tid, inv02, 'İstanbul → Ankara elektronik sevkiyatı',                 4, 9800.00,  39200.00, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, inv02, 'İstanbul → Bursa elektronik dağıtım',                    3, 7200.00,  21600.00, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, inv02, 'Sigorta bedeli (kırılacak eşya)',                        1, 8800.00,   8800.00, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, inv02, 'Depolama hizmet bedeli (3 gün)',                         3, 2933.33,   8800.00, FALSE, NOW(), 'seed'),
    -- inv03: LC Waikiki
    (gen_random_uuid(), tid, inv03, 'İstanbul → İzmir tekstil dağıtımı',                     5, 3800.00,  19000.00, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, inv03, 'İstanbul → Antalya tekstil sevkiyatı',                  2, 4575.00,   9150.00, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, inv03, 'Paketleme hizmet bedeli',                                1, 4000.00,   4000.00, FALSE, NOW(), 'seed'),
    -- inv04: TOFAŞ
    (gen_random_uuid(), tid, inv04, 'Bursa → İstanbul otomotiv parça (ADR)',                  4, 12500.00, 50000.00, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, inv04, 'Bursa → Ankara otomotiv parça',                          3, 11200.00, 33600.00, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, inv04, 'ADR tehlikeli madde ek ücreti',                          1, 12200.00, 12200.00, FALSE, NOW(), 'seed'),
    -- inv05: Migros
    (gen_random_uuid(), tid, inv05, 'İstanbul bölge içi soğuk zincir dağıtım',               8, 4200.00,  33600.00, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, inv05, 'Ankara soğuk zincir dağıtım',                            4, 4850.00,  19400.00, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, inv05, 'Frigorifik araç ek hizmet bedeli',                       1, 5700.00,   5700.00, FALSE, NOW(), 'seed'),
    -- inv06: Arçelik
    (gen_random_uuid(), tid, inv06, 'İstanbul → tüm Türkiye beyaz eşya dağıtım',            10, 8500.00,  85000.00, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, inv06, 'Montaj noktasına teslimat ek hizmeti',                   5, 3500.00,  17500.00, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, inv06, 'Hasar sigortası',                                         1, 10000.00, 10000.00, FALSE, NOW(), 'seed')
ON CONFLICT DO NOTHING;


-- ============================================================
-- 11. CROSS-DOCK OPERATIONS
-- Schema: hub_name, hub_lat, hub_lng, inbound_vehicle_id, outbound_vehicle_id, transfer_date, status (INT), items (JSONB)
-- ============================================================
INSERT INTO logistics.cross_dock_operations (id, tenant_id, hub_name, hub_lat, hub_lng, inbound_vehicle_id, outbound_vehicle_id, transfer_date, status, items, notes, is_deleted, created_at, created_by)
VALUES
    (gen_random_uuid(), tid, 'İstanbul Hadımköy Aktarma Merkezi',  41.1150, 28.7320, v01, v02, '2026-06-28 06:00+03', 2, '["Vestel Elektronik sevkiyatı","TOFAŞ parça"]'::JSONB, 'Marmara bölge aktarması tamamlandı',  FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'Ankara Sincan OSB Aktarma',          39.9680, 32.5730, v02, v03, '2026-06-29 07:00+03', 2, '["İç Anadolu gıda dağıtımı","Konya sevkiyatı"]'::JSONB, 'Ankara hub aktarması tamamlandı',     FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'İzmir Çiğli Aktarma Noktası',       38.5010, 27.0560, v03, v01, '2026-07-01 06:30+03', 1, '["Ege bölge dağıtım","Denizli tekstil"]'::JSONB,        'Aktarma devam ediyor',                FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'Bursa Nilüfer Konsolidasyon',        40.1885, 29.0610, v01, v08, '2026-07-02 07:00+03', 0, '["Otomotiv parça konsolidasyonu"]'::JSONB,               'Planlanan aktarma — otomotiv sektörü', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'Antalya Serbest Bölge Aktarma',      36.8969, 30.7133, v08, v02, '2026-06-27 06:00+03', 2, '["Akdeniz gıda dağıtımı","Soğuk zincir transfer"]'::JSONB,'Akdeniz aktarma tamamlandı',         FALSE, NOW(), 'seed')
ON CONFLICT DO NOTHING;


-- ============================================================
-- 12. CARRIER NETWORKS (hybrid fleet)
-- Schema: carrier_name, api_endpoint, api_key, supported_regions (JSONB), vehicle_types (JSONB), pricing_model (INT)
-- ============================================================
INSERT INTO logistics.carrier_networks (id, tenant_id, carrier_name, api_endpoint, supported_regions, vehicle_types, pricing_model, is_active, is_deleted, created_at, created_by)
VALUES
    (gen_random_uuid(), tid, 'Marmara Lojistik Ağı',        'https://api.marmaralog.com.tr/v1',  '["İstanbul","Bursa","Kocaeli","Tekirdağ","Sakarya"]'::JSONB,              '["Tır","Kamyon","Kamyonet"]'::JSONB,            1, TRUE,  FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'Ege-Akdeniz Taşımacılık Ağı', 'https://api.egeakdeniz.com.tr/v1',  '["İzmir","Denizli","Antalya","Muğla","Aydın"]'::JSONB,                    '["Kamyon","Kamyonet","Frigorifik"]'::JSONB,     0, TRUE,  FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'İç Anadolu Soğuk Zincir Ağı', 'https://api.icasogukloj.com.tr/v1', '["Ankara","Konya","Kayseri","Eskişehir"]'::JSONB,                         '["Frigorifik","Kamyon"]'::JSONB,                0, TRUE,  FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'Karadeniz Dağıtım Birliği',   NULL,                                 '["Samsun","Trabzon","Rize","Giresun","Ordu"]'::JSONB,                     '["Kamyon","Kamyonet"]'::JSONB,                  1, TRUE,  FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'Türkiye Geneli FTL Ağı',      'https://api.trftl.com.tr/v2',       '["İstanbul","Ankara","İzmir","Bursa","Antalya","Adana","Gaziantep"]'::JSONB,'["Tır","Konteyner","LowBed"]'::JSONB,          2, TRUE,  FALSE, NOW(), 'seed')
ON CONFLICT DO NOTHING;


-- ============================================================
-- 13. LOCATIONS (depo/müşteri/aktarma noktaları)
-- Schema: name, code, location_type (INT: 0=Warehouse,1=Customer,2=TransferPoint), address, city, district, latitude, longitude, capacity, working_hours, contact_name, contact_phone
-- ============================================================
INSERT INTO logistics.locations (id, tenant_id, name, code, location_type, address, city, district, latitude, longitude, is_active, capacity, working_hours, contact_name, contact_phone, is_deleted, created_by, created_at)
VALUES
    -- Depolar (type=0)
    (gen_random_uuid(), tid, 'İstanbul Ana Depo',              'IST-DEPO-01', 0, 'Hadımköy Lojistik Merkezi, Arnavutköy',   'İstanbul',  'Arnavutköy',   41.1150, 28.7320, TRUE, 500, '06:00-22:00',  'Ahmet Yılmaz',    '+905301234567', FALSE, 'seed', NOW()),
    (gen_random_uuid(), tid, 'Ankara Bölge Deposu',            'ANK-DEPO-01', 0, 'Sincan OSB, Ankara',                      'Ankara',    'Sincan',       39.9680, 32.5730, TRUE, 300, '07:00-20:00',  'Burak Çelik',     '+905312345678', FALSE, 'seed', NOW()),
    (gen_random_uuid(), tid, 'İzmir Bölge Deposu',             'IZM-DEPO-01', 0, 'Atatürk OSB, Çiğli',                      'İzmir',     'Çiğli',        38.5010, 27.0560, TRUE, 250, '07:00-19:00',  'Elif Demir',      '+905323456789', FALSE, 'seed', NOW()),
    (gen_random_uuid(), tid, 'Antalya Depo',                   'ANT-DEPO-01', 0, 'Antalya Serbest Bölge',                   'Antalya',   'Merkez',       36.8969, 30.7133, TRUE, 150, '08:00-18:00',  'Fatma Şahin',     '+905334567890', FALSE, 'seed', NOW()),
    (gen_random_uuid(), tid, 'Gaziantep Bölge Deposu',         'GAZ-DEPO-01', 0, 'Gaziantep OSB',                           'Gaziantep', 'Şehitkâmil',   37.0662, 37.3833, TRUE, 200, '07:00-19:00',  'Ali Yıldız',      '+905345678901', FALSE, 'seed', NOW()),
    (gen_random_uuid(), tid, 'Samsun Liman Deposu',            'SAM-DEPO-01', 0, 'Samsun Liman Lojistik',                   'Samsun',    'İlkadım',      41.2928, 36.3313, TRUE, 180, '06:00-20:00',  'Hüseyin Özkan',   '+905356789012', FALSE, 'seed', NOW()),
    -- Müşteri Noktaları (type=1)
    (gen_random_uuid(), tid, 'Vestel Elektronik Fabrika',      'MUS-VEST-01', 1, 'Manisa Organize Sanayi Bölgesi',          'Manisa',    'Organize',     38.6191, 27.4289, TRUE, NULL, '08:00-17:00', 'Cengiz Korkmaz',  '+905367890123', FALSE, 'seed', NOW()),
    (gen_random_uuid(), tid, 'TOFAŞ Otomotiv Fabrika',         'MUS-TOFA-01', 1, 'Bursa Otomotiv Sanayi Bölgesi',           'Bursa',     'Osmangazi',    40.1830, 29.0540, TRUE, NULL, '07:00-18:00', 'Erdal Aksoy',     '+905378901234', FALSE, 'seed', NOW()),
    (gen_random_uuid(), tid, 'Arçelik Beyaz Eşya Fabrika',     'MUS-ARCE-01', 1, 'Bolu-Düzce Karayolu Üzeri',               'Bolu',      'Merkez',       40.7360, 31.6061, TRUE, NULL, '08:00-17:00', 'Ramazan Kurt',    '+905389012345', FALSE, 'seed', NOW()),
    (gen_random_uuid(), tid, 'Migros Dağıtım Merkezi',         'MUS-MIGR-01', 1, 'Gebze OSB, Kocaeli',                      'Kocaeli',   'Gebze',        40.8020, 29.4310, TRUE, NULL, '06:00-22:00', 'Ömer Kılıç',      '+905390123456', FALSE, 'seed', NOW()),
    (gen_random_uuid(), tid, 'Ford Otosan Gölcük',             'MUS-FORD-01', 1, 'Gölcük, Kocaeli',                         'Kocaeli',   'Gölcük',       40.7170, 29.8260, TRUE, NULL, '07:00-17:00', 'İsmail Aslan',    '+905401234567', FALSE, 'seed', NOW()),
    -- Aktarma Noktaları (type=2)
    (gen_random_uuid(), tid, 'Bursa Transfer Noktası',         'AKT-BRS-01',  2, 'Nilüfer OSB',                             'Bursa',     'Nilüfer',      40.1885, 29.0610, TRUE, 100, '06:00-20:00',  'Murat Yıldız',    '+905412345678', FALSE, 'seed', NOW()),
    (gen_random_uuid(), tid, 'Gebze Aktarma Merkezi',          'AKT-GBZ-01',  2, 'Gebze OSB yanı',                          'Kocaeli',   'Gebze',        40.8020, 29.4310, TRUE, 120, '06:00-22:00',  'Halil Özdemir',   '+905423456789', FALSE, 'seed', NOW()),
    (gen_random_uuid(), tid, 'Konya Aktarma Noktası',          'AKT-KNY-01',  2, 'Konya 1. OSB',                            'Konya',     'Selçuklu',     37.8746, 32.4932, TRUE,  80, '07:00-19:00',  'Yusuf Koç',       '+905434567890', FALSE, 'seed', NOW()),
    (gen_random_uuid(), tid, 'Adana Aktarma Merkezi',          'AKT-ADN-01',  2, 'Hacı Sabancı OSB',                        'Adana',     'Seyhan',       37.0000, 35.3213, TRUE,  90, '07:00-19:00',  'Süleyman Aydın',  '+905445678901', FALSE, 'seed', NOW())
ON CONFLICT DO NOTHING;


RAISE NOTICE '030_ComprehensiveSeedData completed: shipments updated, ML models+predictions, driver locations, insurance partners+quotes+policies, marketplace listings, simulations+results, cold chain readings, invoices+lines, cross-dock ops, carrier networks, locations';

END $$;
