-- ============================================================================
-- 006_SeedData.sql
-- Realistic Turkish logistics seed data
-- Providers, Contracts, Rates, Orders, Shipments, Performance, Vehicles, Drivers
-- Idempotent: ON CONFLICT DO NOTHING throughout
-- ============================================================================

DO $$
DECLARE
    tid UUID := '00000000-0000-0000-0000-000000000001';
    -- Provider IDs
    p_yolda    UUID := 'a0000000-0000-0000-0000-000000000001';
    p_tirport  UUID := 'a0000000-0000-0000-0000-000000000002';
    p_ekol     UUID := 'a0000000-0000-0000-0000-000000000003';
    p_horoz    UUID := 'a0000000-0000-0000-0000-000000000004';
    p_surat    UUID := 'a0000000-0000-0000-0000-000000000005';
    p_aras     UUID := 'a0000000-0000-0000-0000-000000000006';
    -- Contract IDs
    c_yolda1   UUID := 'b0000000-0000-0000-0000-000000000001';
    c_yolda2   UUID := 'b0000000-0000-0000-0000-000000000002';
    c_tirport1 UUID := 'b0000000-0000-0000-0000-000000000003';
    c_tirport2 UUID := 'b0000000-0000-0000-0000-000000000004';
    c_ekol1    UUID := 'b0000000-0000-0000-0000-000000000005';
    c_ekol2    UUID := 'b0000000-0000-0000-0000-000000000006';
    c_horoz1   UUID := 'b0000000-0000-0000-0000-000000000007';
    c_surat1   UUID := 'b0000000-0000-0000-0000-000000000008';
    c_surat2   UUID := 'b0000000-0000-0000-0000-000000000009';
    c_aras1    UUID := 'b0000000-0000-0000-0000-000000000010';
    -- Counters
    i INT;
    j INT;
    order_id UUID;
    shipment_id UUID;
    rate_id UUID;
    driver_id UUID;
    vehicle_id UUID;
    -- Temp vars
    v_origin_city VARCHAR(100);
    v_dest_city VARCHAR(100);
    v_origin_lat DOUBLE PRECISION;
    v_origin_lng DOUBLE PRECISION;
    v_dest_lat DOUBLE PRECISION;
    v_dest_lng DOUBLE PRECISION;
    v_weight NUMERIC(18,2);
    v_volume NUMERIC(18,4);
    v_pallets INT;
    v_status INT;
    v_priority INT;
    v_provider UUID;
    v_contract UUID;
    v_created TIMESTAMPTZ;
    v_vehicle_cat INT;
    v_price NUMERIC(18,2);
    v_pickup TIMESTAMPTZ;
    v_delivery TIMESTAMPTZ;
    v_plate VARCHAR(20);
    v_driver VARCHAR(200);
    v_phone VARCHAR(30);
    v_product VARCHAR(100);
    v_customer VARCHAR(300);
    v_hazardous BOOLEAN;
    v_cold BOOLEAN;
    v_ontime_pct NUMERIC(5,2);
    v_total_ship INT;
    v_ontime INT;
    v_late INT;
    v_damaged INT;
    v_cancelled INT;
    v_avg_hours NUMERIC(10,2);
    v_total_cost NUMERIC(18,2);
    v_co2 NUMERIC(18,2);
    v_score NUMERIC(5,2);
BEGIN

-- Skip if seed data already exists
IF EXISTS (SELECT 1 FROM logistics.providers WHERE id = p_yolda) THEN
    RAISE NOTICE 'Seed data already exists, skipping.';
    RETURN;
END IF;

-- ============================================================
-- 1. PROVIDERS
-- ============================================================
INSERT INTO logistics.providers (id, tenant_id, name, code, type, is_active, is_global,
    supported_vehicle_types, service_regions, tax_number, city, phone, email, contact_person,
    integration_mode, created_by, created_at)
VALUES
    (p_yolda, tid, 'Yolda Lojistik', 'YOLDA', 0, TRUE, TRUE,
     'Tir,Kamyon,Kamyonet,Parsiyel,Frigorifik', 'Marmara,Ege,Akdeniz,Ic Anadolu,Karadeniz',
     '1234567890', 'Istanbul', '+902121234567', 'info@yolda.com', 'Ahmet Yilmaz', 'ApiIntegrated', 'seed', NOW()),
    (p_tirport, tid, 'Tirport', 'TIRPRT', 0, TRUE, TRUE,
     'Tir,Kamyon,Konteyner,LowBed', 'Marmara,Ic Anadolu,Ege,Akdeniz,Karadeniz,Dogu Anadolu,Guneydogu Anadolu',
     '2345678901', 'Istanbul', '+902122345678', 'info@tirport.com', 'Burak Celik', 'ApiIntegrated', 'seed', NOW()),
    (p_ekol, tid, 'Ekol Lojistik', 'EKOL', 1, TRUE, FALSE,
     'Tir,Kamyon,Frigorifik,Konteyner', 'Marmara,Ege,Akdeniz,Ic Anadolu',
     '3456789012', 'Istanbul', '+902123456789', 'info@ekol.com', 'Elif Demir', 'Managed', 'seed', NOW()),
    (p_horoz, tid, 'Horoz Lojistik', 'HOROZ', 1, TRUE, FALSE,
     'Kamyon,Kamyonet,Parsiyel,Frigorifik', 'Marmara,Ege,Ic Anadolu,Karadeniz',
     '4567890123', 'Istanbul', '+902124567890', 'info@horozlojistik.com', 'Mehmet Kaya', 'Managed', 'seed', NOW()),
    (p_surat, tid, 'Surat Kargo', 'SURAT', 1, TRUE, FALSE,
     'Kamyonet,Parsiyel', 'Marmara,Ege,Akdeniz,Ic Anadolu,Karadeniz,Dogu Anadolu,Guneydogu Anadolu',
     '5678901234', 'Istanbul', '+902125678901', 'info@suratkargo.com', 'Fatma Sahin', 'Managed', 'seed', NOW()),
    (p_aras, tid, 'Aras Kargo', 'ARAS', 1, TRUE, FALSE,
     'Kamyonet,Parsiyel', 'Marmara,Ege,Akdeniz,Ic Anadolu,Karadeniz,Dogu Anadolu,Guneydogu Anadolu',
     '6789012345', 'Istanbul', '+902126789012', 'info@araskargo.com', 'Ali Yildiz', 'Managed', 'seed', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. CONTRACTS (1-2 per provider)
-- ============================================================
INSERT INTO logistics.contracts (id, tenant_id, provider_id, contract_number, name, start_date, end_date, status, currency, created_by, created_at)
VALUES
    -- Yolda: 1 expired, 1 active
    (c_yolda1, tid, p_yolda, 'CNT-2024-0001', 'Yolda 2024 Sozlesmesi', '2024-01-01', '2024-12-31', 2, 'TRY', 'seed', NOW()),
    (c_yolda2, tid, p_yolda, 'CNT-2025-0001', 'Yolda 2025-2026 Sozlesmesi', '2025-01-01', '2026-12-31', 1, 'TRY', 'seed', NOW()),
    -- Tirport: 2 active
    (c_tirport1, tid, p_tirport, 'CNT-2025-0002', 'Tirport FTL Sozlesmesi', '2025-01-01', '2026-06-30', 1, 'TRY', 'seed', NOW()),
    (c_tirport2, tid, p_tirport, 'CNT-2025-0003', 'Tirport LTL Sozlesmesi', '2025-03-01', '2026-03-01', 1, 'TRY', 'seed', NOW()),
    -- Ekol: 1 expired, 1 active
    (c_ekol1, tid, p_ekol, 'CNT-2024-0004', 'Ekol 2024 Sozlesmesi', '2024-06-01', '2025-05-31', 2, 'TRY', 'seed', NOW()),
    (c_ekol2, tid, p_ekol, 'CNT-2025-0005', 'Ekol 2025-2026 Sozlesmesi', '2025-06-01', '2026-12-31', 1, 'TRY', 'seed', NOW()),
    -- Horoz: 1 active
    (c_horoz1, tid, p_horoz, 'CNT-2025-0006', 'Horoz Yillik Sozlesme', '2025-01-01', '2025-12-31', 1, 'TRY', 'seed', NOW()),
    -- Surat: 2 active
    (c_surat1, tid, p_surat, 'CNT-2025-0007', 'Surat Parsiyel Sozlesme', '2025-01-01', '2025-12-31', 1, 'TRY', 'seed', NOW()),
    (c_surat2, tid, p_surat, 'CNT-2025-0008', 'Surat Ekspres Sozlesme', '2025-04-01', '2026-04-01', 1, 'TRY', 'seed', NOW()),
    -- Aras: 1 active
    (c_aras1, tid, p_aras, 'CNT-2025-0009', 'Aras Kargo Sozlesme', '2025-02-01', '2026-02-01', 1, 'TRY', 'seed', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. CONTRACT RATES (region-based, vehicle category, weight tiers)
-- ============================================================

-- Yolda active contract rates (Marmara -> various)
INSERT INTO logistics.contract_rates (id, tenant_id, contract_id, origin_region, destination_region,
    vehicle_category, min_weight_kg, max_weight_kg, min_distance_km, max_distance_km,
    price_per_unit, pricing_unit, currency,
    urgent_surcharge_percent, adr_surcharge_percent, frigo_surcharge_percent, weekend_surcharge_percent,
    is_active, created_by, created_at)
VALUES
    -- Marmara -> Ic Anadolu
    (gen_random_uuid(), tid, c_yolda2, 'Marmara', 'Ic Anadolu', 0, 10000, 25000, 400, 600, 17.50, 4, 'TRY', 20, 25, 30, 10, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_yolda2, 'Marmara', 'Ic Anadolu', 1, 3000, 12000, 400, 600, 13.00, 4, 'TRY', 18, 22, 28, 8, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_yolda2, 'Marmara', 'Ic Anadolu', 2, 500, 3500, 400, 600, 8.50, 4, 'TRY', 15, 20, 25, 7, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_yolda2, 'Marmara', 'Ic Anadolu', 3, 0, 1000, 400, 600, 5.50, 4, 'TRY', 25, 0, 0, 5, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_yolda2, 'Marmara', 'Ic Anadolu', 4, 1000, 15000, 400, 600, 22.00, 4, 'TRY', 20, 0, 0, 12, TRUE, 'seed', NOW()),
    -- Marmara -> Ege
    (gen_random_uuid(), tid, c_yolda2, 'Marmara', 'Ege', 0, 10000, 25000, 350, 550, 16.00, 4, 'TRY', 18, 25, 30, 10, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_yolda2, 'Marmara', 'Ege', 1, 3000, 12000, 350, 550, 12.50, 4, 'TRY', 15, 22, 28, 8, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_yolda2, 'Marmara', 'Ege', 2, 500, 3500, 350, 550, 8.00, 4, 'TRY', 15, 20, 25, 7, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_yolda2, 'Marmara', 'Ege', 3, 0, 1000, 350, 550, 5.00, 4, 'TRY', 22, 0, 0, 5, TRUE, 'seed', NOW()),
    -- Marmara -> Akdeniz
    (gen_random_uuid(), tid, c_yolda2, 'Marmara', 'Akdeniz', 0, 10000, 25000, 600, 900, 19.00, 4, 'TRY', 22, 28, 32, 12, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_yolda2, 'Marmara', 'Akdeniz', 1, 3000, 12000, 600, 900, 15.00, 4, 'TRY', 20, 25, 30, 10, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_yolda2, 'Marmara', 'Akdeniz', 4, 1000, 15000, 600, 900, 24.00, 4, 'TRY', 22, 0, 0, 14, TRUE, 'seed', NOW()),
    -- Marmara -> Karadeniz
    (gen_random_uuid(), tid, c_yolda2, 'Marmara', 'Karadeniz', 0, 10000, 25000, 600, 1100, 20.00, 4, 'TRY', 22, 28, 35, 12, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_yolda2, 'Marmara', 'Karadeniz', 1, 3000, 12000, 600, 1100, 16.00, 4, 'TRY', 20, 25, 30, 10, TRUE, 'seed', NOW()),

    -- Tirport FTL rates (wide coverage)
    (gen_random_uuid(), tid, c_tirport1, 'Marmara', 'Ic Anadolu', 0, 10000, 25000, 400, 600, 16.50, 4, 'TRY', 18, 22, 28, 9, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_tirport1, 'Marmara', 'Ege', 0, 10000, 25000, 350, 550, 15.50, 4, 'TRY', 18, 22, 28, 9, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_tirport1, 'Marmara', 'Akdeniz', 0, 10000, 25000, 600, 900, 18.00, 4, 'TRY', 20, 25, 30, 11, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_tirport1, 'Marmara', 'Guneydogu Anadolu', 0, 10000, 25000, 1000, 1400, 22.00, 4, 'TRY', 25, 30, 35, 15, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_tirport1, 'Marmara', 'Dogu Anadolu', 0, 10000, 25000, 1200, 1800, 25.00, 4, 'TRY', 28, 32, 38, 18, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_tirport1, 'Ic Anadolu', 'Akdeniz', 0, 10000, 25000, 250, 500, 14.00, 4, 'TRY', 18, 22, 28, 8, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_tirport1, 'Ic Anadolu', 'Ege', 0, 10000, 25000, 400, 650, 16.00, 4, 'TRY', 18, 22, 28, 9, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_tirport1, 'Ege', 'Akdeniz', 0, 10000, 25000, 300, 550, 15.00, 4, 'TRY', 18, 22, 28, 9, TRUE, 'seed', NOW()),
    -- Tirport LTL rates
    (gen_random_uuid(), tid, c_tirport2, 'Marmara', 'Ic Anadolu', 3, 0, 3000, 400, 600, 6.00, 4, 'TRY', 25, 0, 0, 8, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_tirport2, 'Marmara', 'Ege', 3, 0, 3000, 350, 550, 5.50, 4, 'TRY', 22, 0, 0, 7, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_tirport2, 'Marmara', 'Akdeniz', 3, 0, 3000, 600, 900, 7.00, 4, 'TRY', 25, 0, 0, 10, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_tirport2, 'Ic Anadolu', 'Akdeniz', 3, 0, 3000, 250, 500, 5.00, 4, 'TRY', 22, 0, 0, 7, TRUE, 'seed', NOW()),

    -- Ekol rates (active contract)
    (gen_random_uuid(), tid, c_ekol2, 'Marmara', 'Ic Anadolu', 0, 10000, 25000, 400, 600, 17.00, 4, 'TRY', 20, 25, 30, 10, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_ekol2, 'Marmara', 'Ege', 0, 10000, 25000, 350, 550, 15.80, 4, 'TRY', 18, 22, 28, 9, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_ekol2, 'Marmara', 'Akdeniz', 0, 10000, 25000, 600, 900, 18.50, 4, 'TRY', 22, 28, 32, 12, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_ekol2, 'Marmara', 'Ic Anadolu', 4, 1000, 15000, 400, 600, 23.00, 4, 'TRY', 22, 0, 0, 14, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_ekol2, 'Ege', 'Akdeniz', 0, 10000, 25000, 300, 550, 14.50, 4, 'TRY', 18, 22, 28, 9, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_ekol2, 'Ege', 'Ic Anadolu', 1, 3000, 12000, 400, 650, 14.00, 4, 'TRY', 18, 22, 28, 9, TRUE, 'seed', NOW()),

    -- Horoz rates
    (gen_random_uuid(), tid, c_horoz1, 'Marmara', 'Ic Anadolu', 1, 3000, 12000, 400, 600, 12.50, 4, 'TRY', 18, 22, 28, 8, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_horoz1, 'Marmara', 'Ege', 1, 3000, 12000, 350, 550, 11.50, 4, 'TRY', 15, 20, 25, 7, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_horoz1, 'Marmara', 'Ic Anadolu', 2, 500, 3500, 400, 600, 8.00, 4, 'TRY', 15, 20, 25, 7, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_horoz1, 'Marmara', 'Ege', 2, 500, 3500, 350, 550, 7.50, 4, 'TRY', 15, 20, 25, 7, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_horoz1, 'Marmara', 'Karadeniz', 1, 3000, 12000, 600, 1100, 15.00, 4, 'TRY', 20, 25, 30, 10, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_horoz1, 'Ic Anadolu', 'Ege', 3, 0, 1000, 400, 650, 5.80, 4, 'TRY', 22, 0, 0, 6, TRUE, 'seed', NOW()),

    -- Surat Parsiyel rates
    (gen_random_uuid(), tid, c_surat1, 'Marmara', 'Ic Anadolu', 3, 0, 500, 400, 600, 4.50, 4, 'TRY', 30, 0, 0, 5, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_surat1, 'Marmara', 'Ege', 3, 0, 500, 350, 550, 4.00, 4, 'TRY', 28, 0, 0, 5, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_surat1, 'Marmara', 'Akdeniz', 3, 0, 500, 600, 900, 5.50, 4, 'TRY', 30, 0, 0, 7, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_surat1, 'Ic Anadolu', 'Ege', 3, 0, 500, 400, 650, 4.20, 4, 'TRY', 28, 0, 0, 5, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_surat1, 'Ic Anadolu', 'Akdeniz', 3, 0, 500, 250, 500, 3.80, 4, 'TRY', 28, 0, 0, 5, TRUE, 'seed', NOW()),
    -- Surat Ekspres rates (higher price, faster)
    (gen_random_uuid(), tid, c_surat2, 'Marmara', 'Ic Anadolu', 2, 100, 1500, 400, 600, 9.50, 4, 'TRY', 15, 0, 0, 8, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_surat2, 'Marmara', 'Ege', 2, 100, 1500, 350, 550, 8.80, 4, 'TRY', 15, 0, 0, 7, TRUE, 'seed', NOW()),

    -- Aras rates
    (gen_random_uuid(), tid, c_aras1, 'Marmara', 'Ic Anadolu', 3, 0, 500, 400, 600, 4.80, 4, 'TRY', 28, 0, 0, 5, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_aras1, 'Marmara', 'Ege', 3, 0, 500, 350, 550, 4.30, 4, 'TRY', 25, 0, 0, 5, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_aras1, 'Marmara', 'Akdeniz', 3, 0, 500, 600, 900, 5.80, 4, 'TRY', 30, 0, 0, 7, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_aras1, 'Marmara', 'Karadeniz', 3, 0, 500, 600, 1100, 6.20, 4, 'TRY', 30, 0, 0, 8, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_aras1, 'Marmara', 'Dogu Anadolu', 3, 0, 500, 1200, 1800, 7.50, 4, 'TRY', 35, 0, 0, 10, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_aras1, 'Ic Anadolu', 'Akdeniz', 3, 0, 500, 250, 500, 4.00, 4, 'TRY', 25, 0, 0, 5, TRUE, 'seed', NOW()),
    (gen_random_uuid(), tid, c_aras1, 'Ege', 'Akdeniz', 3, 0, 500, 300, 550, 4.20, 4, 'TRY', 25, 0, 0, 5, TRUE, 'seed', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. VEHICLES & DRIVERS (3-5 per provider)
-- ============================================================

-- Helper: Turkish city plate codes for realistic plates
-- Yolda vehicles & drivers
INSERT INTO logistics.vehicles (id, tenant_id, provider_id, plate_number, vehicle_type, body_type, tonnage, is_active, insurance_expiry, created_at)
VALUES
    (gen_random_uuid(), tid, p_yolda, '34 YLD 001', 'Tir', 'Tenteli', 25, TRUE, '2026-06-15', NOW()),
    (gen_random_uuid(), tid, p_yolda, '34 YLD 002', 'Kamyon', 'Kapali Kasa', 12, TRUE, '2026-08-20', NOW()),
    (gen_random_uuid(), tid, p_yolda, '34 YLD 003', 'Frigorifik', 'Soguk Zincir', 15, TRUE, '2026-03-10', NOW()),
    (gen_random_uuid(), tid, p_yolda, '34 YLD 004', 'Kamyonet', 'Kapali', 3.5, TRUE, '2026-11-01', NOW()),
    (gen_random_uuid(), tid, p_yolda, '41 YLD 005', 'Tir', 'Acik', 24, TRUE, '2026-09-30', NOW())
ON CONFLICT DO NOTHING;

INSERT INTO logistics.drivers (id, tenant_id, provider_id, full_name, phone, license_number, license_expiry, is_active, created_at)
VALUES
    (gen_random_uuid(), tid, p_yolda, 'Ahmet Yilmaz', '+905301234567', 'B-34-12345', '2028-05-15', TRUE, NOW()),
    (gen_random_uuid(), tid, p_yolda, 'Mehmet Ozturk', '+905302345678', 'B-34-23456', '2027-11-20', TRUE, NOW()),
    (gen_random_uuid(), tid, p_yolda, 'Mustafa Kaya', '+905303456789', 'B-41-34567', '2028-02-10', TRUE, NOW()),
    (gen_random_uuid(), tid, p_yolda, 'Hasan Demir', '+905304567890', 'B-34-45678', '2027-08-30', TRUE, NOW()),
    (gen_random_uuid(), tid, p_yolda, 'Ibrahim Celik', '+905305678901', 'B-34-56789', '2028-01-15', TRUE, NOW())
ON CONFLICT DO NOTHING;

-- Tirport vehicles & drivers
INSERT INTO logistics.vehicles (id, tenant_id, provider_id, plate_number, vehicle_type, body_type, tonnage, is_active, insurance_expiry, created_at)
VALUES
    (gen_random_uuid(), tid, p_tirport, '34 TRP 101', 'Tir', 'Tenteli', 25, TRUE, '2026-07-20', NOW()),
    (gen_random_uuid(), tid, p_tirport, '06 TRP 102', 'Tir', 'Konteyner', 28, TRUE, '2026-05-15', NOW()),
    (gen_random_uuid(), tid, p_tirport, '34 TRP 103', 'Kamyon', 'Kapali Kasa', 12, TRUE, '2026-10-30', NOW()),
    (gen_random_uuid(), tid, p_tirport, '35 TRP 104', 'Tir', 'LowBed', 40, TRUE, '2026-04-25', NOW())
ON CONFLICT DO NOTHING;

INSERT INTO logistics.drivers (id, tenant_id, provider_id, full_name, phone, license_number, license_expiry, is_active, created_at)
VALUES
    (gen_random_uuid(), tid, p_tirport, 'Ali Sahin', '+905311234567', 'B-34-11111', '2028-03-20', TRUE, NOW()),
    (gen_random_uuid(), tid, p_tirport, 'Osman Arslan', '+905312345678', 'B-06-22222', '2027-12-15', TRUE, NOW()),
    (gen_random_uuid(), tid, p_tirport, 'Kemal Dogan', '+905313456789', 'B-35-33333', '2028-06-10', TRUE, NOW()),
    (gen_random_uuid(), tid, p_tirport, 'Serkan Polat', '+905314567890', 'B-34-44444', '2027-09-25', TRUE, NOW())
ON CONFLICT DO NOTHING;

-- Ekol vehicles & drivers
INSERT INTO logistics.vehicles (id, tenant_id, provider_id, plate_number, vehicle_type, body_type, tonnage, is_active, insurance_expiry, created_at)
VALUES
    (gen_random_uuid(), tid, p_ekol, '34 EKL 201', 'Tir', 'Tenteli', 25, TRUE, '2026-08-10', NOW()),
    (gen_random_uuid(), tid, p_ekol, '34 EKL 202', 'Frigorifik', 'Soguk Zincir', 18, TRUE, '2026-06-20', NOW()),
    (gen_random_uuid(), tid, p_ekol, '34 EKL 203', 'Konteyner', '40ft', 30, TRUE, '2026-12-01', NOW())
ON CONFLICT DO NOTHING;

INSERT INTO logistics.drivers (id, tenant_id, provider_id, full_name, phone, license_number, license_expiry, is_active, created_at)
VALUES
    (gen_random_uuid(), tid, p_ekol, 'Cengiz Korkmaz', '+905321234567', 'B-34-55555', '2028-04-15', TRUE, NOW()),
    (gen_random_uuid(), tid, p_ekol, 'Erdal Aksoy', '+905322345678', 'B-34-66666', '2027-10-20', TRUE, NOW()),
    (gen_random_uuid(), tid, p_ekol, 'Ramazan Kurt', '+905323456789', 'B-34-77777', '2028-07-30', TRUE, NOW())
ON CONFLICT DO NOTHING;

-- Horoz vehicles & drivers
INSERT INTO logistics.vehicles (id, tenant_id, provider_id, plate_number, vehicle_type, body_type, tonnage, is_active, insurance_expiry, created_at)
VALUES
    (gen_random_uuid(), tid, p_horoz, '34 HRZ 301', 'Kamyon', 'Kapali Kasa', 10, TRUE, '2026-09-15', NOW()),
    (gen_random_uuid(), tid, p_horoz, '34 HRZ 302', 'Kamyonet', 'Kapali', 3.5, TRUE, '2026-07-25', NOW()),
    (gen_random_uuid(), tid, p_horoz, '16 HRZ 303', 'Kamyon', 'Tenteli', 8, TRUE, '2026-11-10', NOW()),
    (gen_random_uuid(), tid, p_horoz, '34 HRZ 304', 'Frigorifik', 'Soguk Zincir', 12, TRUE, '2026-05-30', NOW())
ON CONFLICT DO NOTHING;

INSERT INTO logistics.drivers (id, tenant_id, provider_id, full_name, phone, license_number, license_expiry, is_active, created_at)
VALUES
    (gen_random_uuid(), tid, p_horoz, 'Halil Ozdemir', '+905331234567', 'B-34-88888', '2028-01-20', TRUE, NOW()),
    (gen_random_uuid(), tid, p_horoz, 'Recep Erdogan', '+905332345678', 'B-16-99999', '2027-07-15', TRUE, NOW()),
    (gen_random_uuid(), tid, p_horoz, 'Yusuf Koc', '+905333456789', 'B-34-10101', '2028-09-10', TRUE, NOW()),
    (gen_random_uuid(), tid, p_horoz, 'Suleyman Aydin', '+905334567890', 'B-34-20202', '2027-04-25', TRUE, NOW())
ON CONFLICT DO NOTHING;

-- Surat vehicles & drivers
INSERT INTO logistics.vehicles (id, tenant_id, provider_id, plate_number, vehicle_type, body_type, tonnage, is_active, insurance_expiry, created_at)
VALUES
    (gen_random_uuid(), tid, p_surat, '34 SRT 401', 'Kamyonet', 'Kapali', 3, TRUE, '2026-06-10', NOW()),
    (gen_random_uuid(), tid, p_surat, '06 SRT 402', 'Kamyonet', 'Kapali', 3.5, TRUE, '2026-08-20', NOW()),
    (gen_random_uuid(), tid, p_surat, '35 SRT 403', 'Kamyonet', 'Kapali', 2.5, TRUE, '2026-10-15', NOW())
ON CONFLICT DO NOTHING;

INSERT INTO logistics.drivers (id, tenant_id, provider_id, full_name, phone, license_number, license_expiry, is_active, created_at)
VALUES
    (gen_random_uuid(), tid, p_surat, 'Omer Kilic', '+905341234567', 'B-34-30303', '2028-02-28', TRUE, NOW()),
    (gen_random_uuid(), tid, p_surat, 'Ismail Aslan', '+905342345678', 'B-06-40404', '2027-11-10', TRUE, NOW()),
    (gen_random_uuid(), tid, p_surat, 'Murat Yildiz', '+905343456789', 'B-35-50505', '2028-05-20', TRUE, NOW())
ON CONFLICT DO NOTHING;

-- Aras vehicles & drivers
INSERT INTO logistics.vehicles (id, tenant_id, provider_id, plate_number, vehicle_type, body_type, tonnage, is_active, insurance_expiry, created_at)
VALUES
    (gen_random_uuid(), tid, p_aras, '34 ARS 501', 'Kamyonet', 'Kapali', 3, TRUE, '2026-07-15', NOW()),
    (gen_random_uuid(), tid, p_aras, '34 ARS 502', 'Kamyonet', 'Kapali', 3.5, TRUE, '2026-09-25', NOW()),
    (gen_random_uuid(), tid, p_aras, '06 ARS 503', 'Kamyonet', 'Kapali', 2.5, TRUE, '2026-11-30', NOW()),
    (gen_random_uuid(), tid, p_aras, '16 ARS 504', 'Kamyonet', 'Kapali', 3, TRUE, '2026-04-10', NOW())
ON CONFLICT DO NOTHING;

INSERT INTO logistics.drivers (id, tenant_id, provider_id, full_name, phone, license_number, license_expiry, is_active, created_at)
VALUES
    (gen_random_uuid(), tid, p_aras, 'Huseyin Ozkan', '+905351234567', 'B-34-60606', '2028-08-15', TRUE, NOW()),
    (gen_random_uuid(), tid, p_aras, 'Osman Polat', '+905352345678', 'B-06-70707', '2027-06-20', TRUE, NOW()),
    (gen_random_uuid(), tid, p_aras, 'Fatih Korkmaz', '+905353456789', 'B-16-80808', '2028-03-10', TRUE, NOW()),
    (gen_random_uuid(), tid, p_aras, 'Emre Aksoy', '+905354567890', 'B-34-90909', '2027-12-25', TRUE, NOW())
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. ORDERS (600+ with real Turkish city coordinates)
-- ============================================================
-- City data: (city, lat, lng) for 35 cities
-- We use a loop with pseudo-random distribution

FOR i IN 1..650 LOOP
    -- Pseudo-random provider selection (deterministic via mod)
    v_provider := CASE (i % 6)
        WHEN 0 THEN p_yolda
        WHEN 1 THEN p_tirport
        WHEN 2 THEN p_ekol
        WHEN 3 THEN p_horoz
        WHEN 4 THEN p_surat
        ELSE p_aras
    END;

    v_contract := CASE (i % 6)
        WHEN 0 THEN c_yolda2
        WHEN 1 THEN c_tirport1
        WHEN 2 THEN c_ekol2
        WHEN 3 THEN c_horoz1
        WHEN 4 THEN c_surat1
        ELSE c_aras1
    END;

    -- Origin/destination city pairs (35 cities, cycling through)
    SELECT city, lat, lng INTO v_origin_city, v_origin_lat, v_origin_lng FROM (VALUES
        ('Istanbul', 41.0082, 28.9784), ('Ankara', 39.9334, 32.8597), ('Izmir', 38.4192, 27.1287),
        ('Bursa', 40.1885, 29.0610), ('Antalya', 36.8969, 30.7133), ('Adana', 37.0000, 35.3213),
        ('Konya', 37.8746, 32.4932), ('Gaziantep', 37.0662, 37.3833), ('Mersin', 36.8121, 34.6415),
        ('Kayseri', 38.7312, 35.4787), ('Eskisehir', 39.7767, 30.5206), ('Diyarbakir', 37.9144, 40.2306),
        ('Samsun', 41.2928, 36.3313), ('Denizli', 37.7765, 29.0864), ('Trabzon', 41.0015, 39.7178),
        ('Malatya', 38.3554, 38.3335), ('Erzurum', 39.9055, 41.2658), ('Sanliurfa', 37.1591, 38.7969),
        ('Manisa', 38.6191, 27.4289), ('Sakarya', 40.6940, 30.4358), ('Balikesir', 39.6484, 27.8826),
        ('Kahramanmaras', 37.5847, 36.9371), ('Van', 38.5012, 43.3730), ('Aydin', 37.8560, 27.8416),
        ('Tekirdag', 41.2824, 27.5119), ('Kocaeli', 40.8533, 29.8815), ('Hatay', 36.4018, 36.3498),
        ('Mugla', 37.2153, 28.3636), ('Afyon', 38.7507, 30.5567), ('Edirne', 41.6818, 26.5623),
        ('Sivas', 39.7477, 37.0179), ('Isparta', 37.7648, 30.5566), ('Bolu', 40.7360, 31.6061),
        ('Rize', 41.0201, 40.5234), ('Nevsehir', 38.6244, 34.7239)
    ) AS cities(city, lat, lng)
    OFFSET (i % 35) LIMIT 1;

    SELECT city, lat, lng INTO v_dest_city, v_dest_lat, v_dest_lng FROM (VALUES
        ('Istanbul', 41.0082, 28.9784), ('Ankara', 39.9334, 32.8597), ('Izmir', 38.4192, 27.1287),
        ('Bursa', 40.1885, 29.0610), ('Antalya', 36.8969, 30.7133), ('Adana', 37.0000, 35.3213),
        ('Konya', 37.8746, 32.4932), ('Gaziantep', 37.0662, 37.3833), ('Mersin', 36.8121, 34.6415),
        ('Kayseri', 38.7312, 35.4787), ('Eskisehir', 39.7767, 30.5206), ('Diyarbakir', 37.9144, 40.2306),
        ('Samsun', 41.2928, 36.3313), ('Denizli', 37.7765, 29.0864), ('Trabzon', 41.0015, 39.7178),
        ('Malatya', 38.3554, 38.3335), ('Erzurum', 39.9055, 41.2658), ('Sanliurfa', 37.1591, 38.7969),
        ('Manisa', 38.6191, 27.4289), ('Sakarya', 40.6940, 30.4358), ('Balikesir', 39.6484, 27.8826),
        ('Kahramanmaras', 37.5847, 36.9371), ('Van', 38.5012, 43.3730), ('Aydin', 37.8560, 27.8416),
        ('Tekirdag', 41.2824, 27.5119), ('Kocaeli', 40.8533, 29.8815), ('Hatay', 36.4018, 36.3498),
        ('Mugla', 37.2153, 28.3636), ('Afyon', 38.7507, 30.5567), ('Edirne', 41.6818, 26.5623),
        ('Sivas', 39.7477, 37.0179), ('Isparta', 37.7648, 30.5566), ('Bolu', 40.7360, 31.6061),
        ('Rize', 41.0201, 40.5234), ('Nevsehir', 38.6244, 34.7239)
    ) AS cities(city, lat, lng)
    OFFSET ((i * 7 + 13) % 35) LIMIT 1;

    -- Weight: 200-25000 kg
    v_weight := 200 + ((i * 37 + 123) % 24800);
    v_volume := ROUND(v_weight / (250 + (i % 200))::NUMERIC, 4);
    v_pallets := GREATEST(1, (v_weight / 800)::INT);

    -- Priority: mostly Normal
    v_priority := CASE WHEN (i % 10) < 7 THEN 0 WHEN (i % 10) < 9 THEN 1 ELSE 2 END;

    -- Status: older orders = completed, newer = mixed
    v_status := CASE
        WHEN i <= 400 THEN CASE WHEN (i % 10) < 9 THEN 4 ELSE 5 END  -- 90% Completed, 10% Cancelled
        WHEN i <= 550 THEN CASE (i % 4) WHEN 0 THEN 3 WHEN 1 THEN 4 WHEN 2 THEN 2 ELSE 1 END
        ELSE (i % 3)  -- Draft, Pending, ReadyForShipment
    END;

    -- Product category
    v_product := CASE (i % 10)
        WHEN 0 THEN 'Gida'
        WHEN 1 THEN 'Elektronik'
        WHEN 2 THEN 'Tekstil'
        WHEN 3 THEN 'Otomotiv Parcasi'
        WHEN 4 THEN 'Insaat Malzemesi'
        WHEN 5 THEN 'Kimyasal'
        WHEN 6 THEN 'Mobilya'
        WHEN 7 THEN 'Tarim Urunu'
        WHEN 8 THEN 'Makine'
        ELSE 'Ilac'
    END;

    v_customer := CASE (i % 15)
        WHEN 0 THEN 'ABC Gida A.S.'
        WHEN 1 THEN 'Teknosa Dagitim'
        WHEN 2 THEN 'LC Waikiki Depo'
        WHEN 3 THEN 'TOFAS Otomotiv'
        WHEN 4 THEN 'Cimsa Cimento'
        WHEN 5 THEN 'Vestel Elektronik'
        WHEN 6 THEN 'Bellona Mobilya'
        WHEN 7 THEN 'Migros Dagitim'
        WHEN 8 THEN 'Eti Gida'
        WHEN 9 THEN 'Arcelik Beyaz Esya'
        WHEN 10 THEN 'Ford Otosan'
        WHEN 11 THEN 'Ulker Biskuvi'
        WHEN 12 THEN 'Defacto Tekstil'
        WHEN 13 THEN 'Banvit Tavuk'
        ELSE 'Turk Traktor'
    END;

    v_hazardous := (v_product = 'Kimyasal' AND (i % 3) = 0);
    v_cold := (v_product IN ('Gida', 'Ilac') AND (i % 4) = 0);

    -- Created date: spread over last 6 months
    v_created := NOW() - ((i % 180) || ' days')::INTERVAL - ((i % 12) || ' hours')::INTERVAL;

    order_id := gen_random_uuid();

    INSERT INTO logistics.orders (id, tenant_id, order_number, customer_name,
        origin_address, origin_city, origin_lat, origin_lng,
        destination_address, destination_city, destination_lat, destination_lng,
        total_weight_kg, total_volume_m3, pallet_count, product_category,
        is_hazardous, requires_cold_chain, status, priority,
        requested_delivery_date, currency, contract_id, provider_id,
        created_by, created_at)
    VALUES (order_id, tid, 'ORD-' || TO_CHAR(v_created, 'YYYYMM') || '-' || LPAD(i::TEXT, 5, '0'),
        v_customer,
        v_origin_city || ' Organize Sanayi Bolgesi', v_origin_city, v_origin_lat, v_origin_lng,
        v_dest_city || ' Merkez Depo', v_dest_city, v_dest_lat, v_dest_lng,
        v_weight, v_volume, v_pallets, v_product,
        v_hazardous, v_cold, v_status, v_priority,
        v_created + INTERVAL '3 days', 'TRY', v_contract, v_provider,
        'seed', v_created)
    ON CONFLICT DO NOTHING;

    -- ============================================================
    -- 6. SHIPMENTS (for completed/in-progress orders ~80%)
    -- ============================================================
    IF v_status >= 2 AND (i % 5) < 4 THEN
        shipment_id := gen_random_uuid();

        -- Vehicle category based on weight
        v_vehicle_cat := CASE
            WHEN v_cold THEN 4
            WHEN v_weight > 15000 THEN 0
            WHEN v_weight > 5000 THEN 1
            WHEN v_weight > 1500 THEN 2
            ELSE 3
        END;

        -- Price estimate
        v_price := ROUND(v_weight * (CASE v_vehicle_cat
            WHEN 0 THEN 0.85
            WHEN 1 THEN 0.95
            WHEN 2 THEN 1.20
            WHEN 3 THEN 1.50
            WHEN 4 THEN 1.10
            ELSE 1.00
        END) * (0.9 + (i % 20) * 0.01), 2);

        -- Shipment status mirrors order progress
        -- Plate/driver only for active shipments
        v_plate := CASE WHEN v_status >= 3 THEN LPAD(((i % 81) + 1)::TEXT, 2, '0') || ' XX ' || LPAD((100 + i % 900)::TEXT, 3, '0') ELSE NULL END;
        v_driver := CASE WHEN v_status >= 3 THEN 'Surucu ' || i::TEXT ELSE NULL END;
        v_phone := CASE WHEN v_status >= 3 THEN '+9053' || LPAD((i % 100)::TEXT, 2, '0') || LPAD((1000000 + i % 9000000)::TEXT, 7, '0') ELSE NULL END;

        v_pickup := CASE WHEN v_status >= 3 THEN v_created + INTERVAL '1 day' ELSE NULL END;
        v_delivery := CASE WHEN v_status >= 4 THEN v_created + (1 + (i % 4))::INT * INTERVAL '1 day' ELSE NULL END;

        INSERT INTO logistics.shipments (id, tenant_id, shipment_number, order_id,
            origin_address, origin_city, destination_address, destination_city,
            status, priority, requested_pickup_date, requested_delivery_date,
            actual_pickup_date, actual_delivery_date,
            total_weight_kg, total_volume_m3, total_desi_weight, chargeable_weight,
            pallet_count, is_hazardous, requires_cold_chain, is_stackable,
            selected_provider_id, recommended_vehicle,
            calculated_price, currency, vehicle_plate, driver_name, driver_phone,
            created_by, created_at)
        VALUES (shipment_id, tid, 'SHP-' || TO_CHAR(v_created, 'YYYYMM') || '-' || LPAD(i::TEXT, 5, '0'),
            order_id,
            v_origin_city || ' Organize Sanayi Bolgesi', v_origin_city,
            v_dest_city || ' Merkez Depo', v_dest_city,
            CASE v_status
                WHEN 2 THEN 2   -- ReadyForShipment -> Calculated
                WHEN 3 THEN 7   -- InShipment -> InTransit
                WHEN 4 THEN 9   -- Completed -> Completed
                WHEN 5 THEN 10  -- Cancelled -> Cancelled
                ELSE 1          -- Default Calculated
            END,
            v_priority,
            v_created + INTERVAL '1 day', v_created + INTERVAL '4 days',
            v_pickup, v_delivery,
            v_weight, v_volume, ROUND(v_volume * 3000, 2), GREATEST(v_weight, ROUND(v_volume * 3000, 2)),
            v_pallets, v_hazardous, v_cold, NOT v_hazardous,
            v_provider, v_vehicle_cat,
            v_price, 'TRY', v_plate, v_driver, v_phone,
            'seed', v_created)
        ON CONFLICT DO NOTHING;
    END IF;

END LOOP;

-- ============================================================
-- 7. CARRIER PERFORMANCE (12 months per provider)
-- ============================================================
FOR i IN 0..11 LOOP
    -- Yolda: high performer
    v_total_ship := 40 + (i * 3);
    v_ontime_pct := 91.0 + (i % 5) * 0.5;
    v_ontime := ROUND(v_total_ship * v_ontime_pct / 100)::INT;
    v_late := v_total_ship - v_ontime;
    v_damaged := GREATEST(0, (i % 3));
    v_cancelled := GREATEST(0, (i % 4));
    v_avg_hours := 28.0 + (i % 8);
    v_total_cost := v_total_ship * 8500;
    v_co2 := v_total_ship * 180;
    v_score := v_ontime_pct * 0.85 + (100 - v_damaged::NUMERIC / v_total_ship * 100) * 0.15;
    INSERT INTO logistics.carrier_performance (id, tenant_id, provider_id, provider_name, period, year, month,
        total_shipments, on_time_deliveries, late_deliveries, damaged_shipments, cancelled_shipments,
        on_time_percentage, average_delivery_hours, total_cost, average_cost_per_kg, co2_total_kg,
        overall_score, calculated_at, created_by, created_at)
    VALUES (gen_random_uuid(), tid, p_yolda, 'Yolda Lojistik',
        EXTRACT(YEAR FROM NOW() - (i || ' months')::INTERVAL)::INT * 100 + EXTRACT(MONTH FROM NOW() - (i || ' months')::INTERVAL)::INT,
        EXTRACT(YEAR FROM NOW() - (i || ' months')::INTERVAL)::INT,
        EXTRACT(MONTH FROM NOW() - (i || ' months')::INTERVAL)::INT,
        v_total_ship, v_ontime, v_late, v_damaged, v_cancelled,
        v_ontime_pct, v_avg_hours, v_total_cost, ROUND(v_total_cost / (v_total_ship * 5000), 4), v_co2,
        ROUND(v_score, 2), (NOW() - (i || ' months')::INTERVAL + INTERVAL '28 days'), 'seed', NOW())
    ON CONFLICT (tenant_id, provider_id, year, month) DO NOTHING;

    -- Tirport: good performer
    v_total_ship := 50 + (i * 4);
    v_ontime_pct := 88.0 + (i % 4) * 0.6;
    v_ontime := ROUND(v_total_ship * v_ontime_pct / 100)::INT;
    v_late := v_total_ship - v_ontime;
    v_damaged := (i % 4);
    v_cancelled := (i % 5);
    v_avg_hours := 32.0 + (i % 10);
    v_total_cost := v_total_ship * 7800;
    v_co2 := v_total_ship * 195;
    v_score := v_ontime_pct * 0.85 + (100 - v_damaged::NUMERIC / v_total_ship * 100) * 0.15;
    INSERT INTO logistics.carrier_performance (id, tenant_id, provider_id, provider_name, period, year, month,
        total_shipments, on_time_deliveries, late_deliveries, damaged_shipments, cancelled_shipments,
        on_time_percentage, average_delivery_hours, total_cost, average_cost_per_kg, co2_total_kg,
        overall_score, calculated_at, created_by, created_at)
    VALUES (gen_random_uuid(), tid, p_tirport, 'Tirport',
        EXTRACT(YEAR FROM NOW() - (i || ' months')::INTERVAL)::INT * 100 + EXTRACT(MONTH FROM NOW() - (i || ' months')::INTERVAL)::INT,
        EXTRACT(YEAR FROM NOW() - (i || ' months')::INTERVAL)::INT,
        EXTRACT(MONTH FROM NOW() - (i || ' months')::INTERVAL)::INT,
        v_total_ship, v_ontime, v_late, v_damaged, v_cancelled,
        v_ontime_pct, v_avg_hours, v_total_cost, ROUND(v_total_cost / (v_total_ship * 5000), 4), v_co2,
        ROUND(v_score, 2), (NOW() - (i || ' months')::INTERVAL + INTERVAL '28 days'), 'seed', NOW())
    ON CONFLICT (tenant_id, provider_id, year, month) DO NOTHING;

    -- Ekol: average performer
    v_total_ship := 30 + (i * 2);
    v_ontime_pct := 84.0 + (i % 6) * 0.7;
    v_ontime := ROUND(v_total_ship * v_ontime_pct / 100)::INT;
    v_late := v_total_ship - v_ontime;
    v_damaged := (i % 3);
    v_cancelled := (i % 3) + 1;
    v_avg_hours := 35.0 + (i % 12);
    v_total_cost := v_total_ship * 9200;
    v_co2 := v_total_ship * 210;
    v_score := v_ontime_pct * 0.85 + (100 - v_damaged::NUMERIC / v_total_ship * 100) * 0.15;
    INSERT INTO logistics.carrier_performance (id, tenant_id, provider_id, provider_name, period, year, month,
        total_shipments, on_time_deliveries, late_deliveries, damaged_shipments, cancelled_shipments,
        on_time_percentage, average_delivery_hours, total_cost, average_cost_per_kg, co2_total_kg,
        overall_score, calculated_at, created_by, created_at)
    VALUES (gen_random_uuid(), tid, p_ekol, 'Ekol Lojistik',
        EXTRACT(YEAR FROM NOW() - (i || ' months')::INTERVAL)::INT * 100 + EXTRACT(MONTH FROM NOW() - (i || ' months')::INTERVAL)::INT,
        EXTRACT(YEAR FROM NOW() - (i || ' months')::INTERVAL)::INT,
        EXTRACT(MONTH FROM NOW() - (i || ' months')::INTERVAL)::INT,
        v_total_ship, v_ontime, v_late, v_damaged, v_cancelled,
        v_ontime_pct, v_avg_hours, v_total_cost, ROUND(v_total_cost / (v_total_ship * 5000), 4), v_co2,
        ROUND(v_score, 2), (NOW() - (i || ' months')::INTERVAL + INTERVAL '28 days'), 'seed', NOW())
    ON CONFLICT (tenant_id, provider_id, year, month) DO NOTHING;

    -- Horoz: decent performer
    v_total_ship := 35 + (i * 3);
    v_ontime_pct := 86.0 + (i % 5) * 0.5;
    v_ontime := ROUND(v_total_ship * v_ontime_pct / 100)::INT;
    v_late := v_total_ship - v_ontime;
    v_damaged := (i % 5);
    v_cancelled := (i % 4);
    v_avg_hours := 30.0 + (i % 8);
    v_total_cost := v_total_ship * 7200;
    v_co2 := v_total_ship * 170;
    v_score := v_ontime_pct * 0.85 + (100 - v_damaged::NUMERIC / v_total_ship * 100) * 0.15;
    INSERT INTO logistics.carrier_performance (id, tenant_id, provider_id, provider_name, period, year, month,
        total_shipments, on_time_deliveries, late_deliveries, damaged_shipments, cancelled_shipments,
        on_time_percentage, average_delivery_hours, total_cost, average_cost_per_kg, co2_total_kg,
        overall_score, calculated_at, created_by, created_at)
    VALUES (gen_random_uuid(), tid, p_horoz, 'Horoz Lojistik',
        EXTRACT(YEAR FROM NOW() - (i || ' months')::INTERVAL)::INT * 100 + EXTRACT(MONTH FROM NOW() - (i || ' months')::INTERVAL)::INT,
        EXTRACT(YEAR FROM NOW() - (i || ' months')::INTERVAL)::INT,
        EXTRACT(MONTH FROM NOW() - (i || ' months')::INTERVAL)::INT,
        v_total_ship, v_ontime, v_late, v_damaged, v_cancelled,
        v_ontime_pct, v_avg_hours, v_total_cost, ROUND(v_total_cost / (v_total_ship * 5000), 4), v_co2,
        ROUND(v_score, 2), (NOW() - (i || ' months')::INTERVAL + INTERVAL '28 days'), 'seed', NOW())
    ON CONFLICT (tenant_id, provider_id, year, month) DO NOTHING;

    -- Surat: lower tier (parcels)
    v_total_ship := 60 + (i * 5);
    v_ontime_pct := 80.0 + (i % 7) * 0.8;
    v_ontime := ROUND(v_total_ship * v_ontime_pct / 100)::INT;
    v_late := v_total_ship - v_ontime;
    v_damaged := (i % 6) + 1;
    v_cancelled := (i % 5) + 1;
    v_avg_hours := 40.0 + (i % 15);
    v_total_cost := v_total_ship * 3500;
    v_co2 := v_total_ship * 90;
    v_score := v_ontime_pct * 0.85 + (100 - v_damaged::NUMERIC / v_total_ship * 100) * 0.15;
    INSERT INTO logistics.carrier_performance (id, tenant_id, provider_id, provider_name, period, year, month,
        total_shipments, on_time_deliveries, late_deliveries, damaged_shipments, cancelled_shipments,
        on_time_percentage, average_delivery_hours, total_cost, average_cost_per_kg, co2_total_kg,
        overall_score, calculated_at, created_by, created_at)
    VALUES (gen_random_uuid(), tid, p_surat, 'Surat Kargo',
        EXTRACT(YEAR FROM NOW() - (i || ' months')::INTERVAL)::INT * 100 + EXTRACT(MONTH FROM NOW() - (i || ' months')::INTERVAL)::INT,
        EXTRACT(YEAR FROM NOW() - (i || ' months')::INTERVAL)::INT,
        EXTRACT(MONTH FROM NOW() - (i || ' months')::INTERVAL)::INT,
        v_total_ship, v_ontime, v_late, v_damaged, v_cancelled,
        v_ontime_pct, v_avg_hours, v_total_cost, ROUND(v_total_cost / (v_total_ship * 1500), 4), v_co2,
        ROUND(v_score, 2), (NOW() - (i || ' months')::INTERVAL + INTERVAL '28 days'), 'seed', NOW())
    ON CONFLICT (tenant_id, provider_id, year, month) DO NOTHING;

    -- Aras: similar to Surat
    v_total_ship := 55 + (i * 4);
    v_ontime_pct := 82.0 + (i % 6) * 0.7;
    v_ontime := ROUND(v_total_ship * v_ontime_pct / 100)::INT;
    v_late := v_total_ship - v_ontime;
    v_damaged := (i % 5) + 1;
    v_cancelled := (i % 4);
    v_avg_hours := 38.0 + (i % 12);
    v_total_cost := v_total_ship * 3800;
    v_co2 := v_total_ship * 95;
    v_score := v_ontime_pct * 0.85 + (100 - v_damaged::NUMERIC / v_total_ship * 100) * 0.15;
    INSERT INTO logistics.carrier_performance (id, tenant_id, provider_id, provider_name, period, year, month,
        total_shipments, on_time_deliveries, late_deliveries, damaged_shipments, cancelled_shipments,
        on_time_percentage, average_delivery_hours, total_cost, average_cost_per_kg, co2_total_kg,
        overall_score, calculated_at, created_by, created_at)
    VALUES (gen_random_uuid(), tid, p_aras, 'Aras Kargo',
        EXTRACT(YEAR FROM NOW() - (i || ' months')::INTERVAL)::INT * 100 + EXTRACT(MONTH FROM NOW() - (i || ' months')::INTERVAL)::INT,
        EXTRACT(YEAR FROM NOW() - (i || ' months')::INTERVAL)::INT,
        EXTRACT(MONTH FROM NOW() - (i || ' months')::INTERVAL)::INT,
        v_total_ship, v_ontime, v_late, v_damaged, v_cancelled,
        v_ontime_pct, v_avg_hours, v_total_cost, ROUND(v_total_cost / (v_total_ship * 1500), 4), v_co2,
        ROUND(v_score, 2), (NOW() - (i || ' months')::INTERVAL + INTERVAL '28 days'), 'seed', NOW())
    ON CONFLICT (tenant_id, provider_id, year, month) DO NOTHING;
END LOOP;

RAISE NOTICE 'Seed data generation completed: 6 providers, 10 contracts, 50+ rates, 650 orders, 400+ shipments, 72 performance records, 22 vehicles, 24 drivers';

END $$;
