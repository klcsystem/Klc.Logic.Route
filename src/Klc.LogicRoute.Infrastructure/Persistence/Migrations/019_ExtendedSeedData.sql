-- ============================================================================
-- 019_ExtendedSeedData.sql
-- Extended seed data for empty tables: vehicles, drivers, notification_templates,
-- route_optimization_results, optimized_routes, route_stops, delivery_slots,
-- delivery_feedback, return_requests, package_scans, invoice_audits,
-- recurring_routes, recurring_route_stops
-- Idempotent: ON CONFLICT DO NOTHING throughout
-- ============================================================================

DO $$
DECLARE
    tid UUID := '00000000-0000-0000-0000-000000000001';

    -- Provider IDs (dynamic lookup from DB)
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

    -- Fixed vehicle IDs for FK references
    v01 UUID := 'c1000000-0000-0000-0000-000000000001';
    v02 UUID := 'c1000000-0000-0000-0000-000000000002';
    v03 UUID := 'c1000000-0000-0000-0000-000000000003';
    v04 UUID := 'c1000000-0000-0000-0000-000000000004';
    v05 UUID := 'c1000000-0000-0000-0000-000000000005';
    v06 UUID := 'c1000000-0000-0000-0000-000000000006';
    v07 UUID := 'c1000000-0000-0000-0000-000000000007';
    v08 UUID := 'c1000000-0000-0000-0000-000000000008';
    v09 UUID := 'c1000000-0000-0000-0000-000000000009';
    v10 UUID := 'c1000000-0000-0000-0000-000000000010';
    v11 UUID := 'c1000000-0000-0000-0000-000000000011';
    v12 UUID := 'c1000000-0000-0000-0000-000000000012';
    v13 UUID := 'c1000000-0000-0000-0000-000000000013';
    v14 UUID := 'c1000000-0000-0000-0000-000000000014';
    v15 UUID := 'c1000000-0000-0000-0000-000000000015';
    v16 UUID := 'c1000000-0000-0000-0000-000000000016';

    -- Fixed driver IDs for FK references
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

    -- Optimization result IDs
    opt01 UUID := 'c3000000-0000-0000-0000-000000000001';
    opt02 UUID := 'c3000000-0000-0000-0000-000000000002';
    opt03 UUID := 'c3000000-0000-0000-0000-000000000003';
    opt04 UUID := 'c3000000-0000-0000-0000-000000000004';
    opt05 UUID := 'c3000000-0000-0000-0000-000000000005';
    opt06 UUID := 'c3000000-0000-0000-0000-000000000006';
    opt07 UUID := 'c3000000-0000-0000-0000-000000000007';
    opt08 UUID := 'c3000000-0000-0000-0000-000000000008';
    opt09 UUID := 'c3000000-0000-0000-0000-000000000009';
    opt10 UUID := 'c3000000-0000-0000-0000-000000000010';

    -- Optimized route IDs
    rt01 UUID := 'c4000000-0000-0000-0000-000000000001';
    rt02 UUID := 'c4000000-0000-0000-0000-000000000002';
    rt03 UUID := 'c4000000-0000-0000-0000-000000000003';
    rt04 UUID := 'c4000000-0000-0000-0000-000000000004';
    rt05 UUID := 'c4000000-0000-0000-0000-000000000005';
    rt06 UUID := 'c4000000-0000-0000-0000-000000000006';
    rt07 UUID := 'c4000000-0000-0000-0000-000000000007';
    rt08 UUID := 'c4000000-0000-0000-0000-000000000008';
    rt09 UUID := 'c4000000-0000-0000-0000-000000000009';
    rt10 UUID := 'c4000000-0000-0000-0000-000000000010';
    rt11 UUID := 'c4000000-0000-0000-0000-000000000011';
    rt12 UUID := 'c4000000-0000-0000-0000-000000000012';
    rt13 UUID := 'c4000000-0000-0000-0000-000000000013';
    rt14 UUID := 'c4000000-0000-0000-0000-000000000014';
    rt15 UUID := 'c4000000-0000-0000-0000-000000000015';
    rt16 UUID := 'c4000000-0000-0000-0000-000000000016';
    rt17 UUID := 'c4000000-0000-0000-0000-000000000017';
    rt18 UUID := 'c4000000-0000-0000-0000-000000000018';
    rt19 UUID := 'c4000000-0000-0000-0000-000000000019';
    rt20 UUID := 'c4000000-0000-0000-0000-000000000020';
    rt21 UUID := 'c4000000-0000-0000-0000-000000000021';
    rt22 UUID := 'c4000000-0000-0000-0000-000000000022';
    rt23 UUID := 'c4000000-0000-0000-0000-000000000023';
    rt24 UUID := 'c4000000-0000-0000-0000-000000000024';
    rt25 UUID := 'c4000000-0000-0000-0000-000000000025';

    -- Recurring route IDs
    rr01 UUID := 'c5000000-0000-0000-0000-000000000001';
    rr02 UUID := 'c5000000-0000-0000-0000-000000000002';
    rr03 UUID := 'c5000000-0000-0000-0000-000000000003';

BEGIN

-- Dynamic provider lookup (handles both seed-generated and real IDs)
SELECT id INTO p_yolda FROM logistics.providers WHERE tenant_id = tid AND is_deleted = FALSE ORDER BY created_at LIMIT 1;
SELECT id INTO p_tirport FROM logistics.providers WHERE tenant_id = tid AND is_deleted = FALSE ORDER BY created_at OFFSET 1 LIMIT 1;
SELECT id INTO p_ekol FROM logistics.providers WHERE tenant_id = tid AND is_deleted = FALSE ORDER BY created_at OFFSET 2 LIMIT 1;
SELECT id INTO p_horoz FROM logistics.providers WHERE tenant_id = tid AND is_deleted = FALSE ORDER BY created_at OFFSET 3 LIMIT 1;
SELECT id INTO p_surat FROM logistics.providers WHERE tenant_id = tid AND is_deleted = FALSE ORDER BY created_at OFFSET 4 LIMIT 1;
SELECT id INTO p_aras FROM logistics.providers WHERE tenant_id = tid AND is_deleted = FALSE ORDER BY created_at OFFSET 5 LIMIT 1;

-- Fallback: if any provider is null, use first one
p_yolda   := COALESCE(p_yolda, p_tirport, p_ekol);
p_tirport := COALESCE(p_tirport, p_yolda);
p_ekol    := COALESCE(p_ekol, p_yolda);
p_horoz   := COALESCE(p_horoz, p_yolda);
p_surat   := COALESCE(p_surat, p_yolda);
p_aras    := COALESCE(p_aras, p_yolda);

-- Dynamic contract lookup
SELECT id INTO c_yolda2 FROM logistics.contracts WHERE tenant_id = tid AND provider_id = p_yolda AND is_deleted = FALSE LIMIT 1;
SELECT id INTO c_tirport1 FROM logistics.contracts WHERE tenant_id = tid AND provider_id = p_tirport AND is_deleted = FALSE LIMIT 1;
SELECT id INTO c_ekol2 FROM logistics.contracts WHERE tenant_id = tid AND provider_id = p_ekol AND is_deleted = FALSE LIMIT 1;
SELECT id INTO c_horoz1 FROM logistics.contracts WHERE tenant_id = tid AND provider_id = p_horoz AND is_deleted = FALSE LIMIT 1;
SELECT id INTO c_surat1 FROM logistics.contracts WHERE tenant_id = tid AND provider_id = p_surat AND is_deleted = FALSE LIMIT 1;
SELECT id INTO c_aras1 FROM logistics.contracts WHERE tenant_id = tid AND provider_id = p_aras AND is_deleted = FALSE LIMIT 1;

-- ============================================================
-- 1. VEHICLES (16 additional)
-- ============================================================
INSERT INTO logistics.vehicles (id, tenant_id, provider_id, plate_number, vehicle_type, body_type, tonnage, is_active, insurance_expiry, created_at, is_deleted)
VALUES
    -- Yolda (3)
    (v01, tid, p_yolda,   '34 ABC 123', 'Kamyon',     'Kapali Kasa',  12,   TRUE, '2027-03-15', NOW(), FALSE),
    (v02, tid, p_yolda,   '34 DEF 456', 'TIR',        'Tenteli',      25,   TRUE, '2027-06-20', NOW(), FALSE),
    (v03, tid, p_yolda,   '41 GHI 789', 'Frigorifik', 'Soguk Zincir', 18,   TRUE, '2027-01-10', NOW(), FALSE),
    -- Tirport (3)
    (v04, tid, p_tirport, '06 KLM 234', 'TIR',        'Konteyner',    28,   TRUE, '2027-08-25', NOW(), FALSE),
    (v05, tid, p_tirport, '34 NOP 567', 'Kamyon',     'Acik',         15,   TRUE, '2027-04-30', NOW(), FALSE),
    (v06, tid, p_tirport, '16 RST 890', 'Kamyonet',   'Kapali',        3.5, TRUE, '2027-11-15', NOW(), FALSE),
    -- Ekol (3)
    (v07, tid, p_ekol,    '35 UVW 012', 'TIR',        'Tenteli',      24,   TRUE, '2027-05-20', NOW(), FALSE),
    (v08, tid, p_ekol,    '34 XYZ 345', 'Frigorifik', 'Soguk Zincir', 20,   TRUE, '2027-09-10', NOW(), FALSE),
    (v09, tid, p_ekol,    '34 AKL 678', 'Kamyon',     'Kapali Kasa',  10,   TRUE, '2027-02-28', NOW(), FALSE),
    -- Horoz (2)
    (v10, tid, p_horoz,   '34 BMS 901', 'Kamyonet',   'Kapali',        3,   TRUE, '2027-07-15', NOW(), FALSE),
    (v11, tid, p_horoz,   '41 CNR 234', 'Kamyon',     'Tenteli',       8,   TRUE, '2027-10-20', NOW(), FALSE),
    -- Surat (3)
    (v12, tid, p_surat,   '34 DPT 567', 'Kamyonet',   'Kapali',        3,   TRUE, '2027-03-25', NOW(), FALSE),
    (v13, tid, p_surat,   '06 ERS 890', 'Kamyonet',   'Kapali',        2.5, TRUE, '2027-12-10', NOW(), FALSE),
    (v14, tid, p_surat,   '35 FYZ 123', 'Kamyonet',   'Kapali',        3.5, TRUE, '2027-06-05', NOW(), FALSE),
    -- Aras (2)
    (v15, tid, p_aras,    '34 GKL 456', 'Kamyonet',   'Kapali',        3,   TRUE, '2027-08-30', NOW(), FALSE),
    (v16, tid, p_aras,    '16 HMN 789', 'Kamyonet',   'Kapali',        3.5, TRUE, '2027-04-15', NOW(), FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. DRIVERS (20 with skills, certifications, preferred_zones)
-- ============================================================
INSERT INTO logistics.drivers (id, tenant_id, provider_id, full_name, phone, license_number, license_expiry, is_active, skills, certifications, max_working_hours, preferred_zones, created_at, is_deleted)
VALUES
    -- Yolda (4)
    (d01, tid, p_yolda,   'Burak Yildirim',     '+905361112233', 'E-34-10001', '2029-03-15', TRUE, 'ADR,Heavy',       'ADR,SRC2',         12, 'Marmara,Ic Anadolu',    NOW(), FALSE),
    (d02, tid, p_yolda,   'Emrah Sahin',         '+905362223344', 'E-34-10002', '2028-11-20', TRUE, 'Frigo',           'Frigo,SRC2',        10, 'Marmara,Ege',           NOW(), FALSE),
    (d03, tid, p_yolda,   'Cem Ozdemir',         '+905363334455', 'E-41-10003', '2029-06-10', TRUE, 'Heavy',           'SRC2',              11, 'Marmara,Karadeniz',     NOW(), FALSE),
    (d04, tid, p_yolda,   'Tolga Aksoy',         '+905364445566', 'E-34-10004', '2028-08-30', TRUE, 'ADR,Frigo,Heavy', 'ADR,Frigo,SRC2',    10, 'Marmara',               NOW(), FALSE),
    -- Tirport (4)
    (d05, tid, p_tirport, 'Ugur Korkmaz',        '+905371112233', 'E-06-10005', '2029-01-15', TRUE, 'Heavy',           'SRC2,SRC4',         12, 'Ic Anadolu,Ege',        NOW(), FALSE),
    (d06, tid, p_tirport, 'Volkan Dogan',        '+905372223344', 'E-34-10006', '2028-07-20', TRUE, 'ADR,Heavy',       'ADR,SRC2',          11, 'Marmara,Ic Anadolu',    NOW(), FALSE),
    (d07, tid, p_tirport, 'Yasin Arslan',        '+905373334455', 'E-35-10007', '2029-04-10', TRUE, 'Frigo,Heavy',     'Frigo,SRC2',        10, 'Ege,Akdeniz',           NOW(), FALSE),
    (d08, tid, p_tirport, 'Zafer Polat',         '+905374445566', 'E-34-10008', '2028-12-25', TRUE, 'Heavy',           'SRC2',              12, 'Marmara,Karadeniz',     NOW(), FALSE),
    -- Ekol (3)
    (d09, tid, p_ekol,    'Alper Cetin',         '+905381112233', 'E-34-10009', '2029-05-20', TRUE, 'ADR,Frigo',       'ADR,Frigo,SRC2',    10, 'Marmara,Ege',           NOW(), FALSE),
    (d10, tid, p_ekol,    'Baris Kurt',          '+905382223344', 'E-34-10010', '2028-09-15', TRUE, 'Heavy',           'SRC2',              11, 'Ic Anadolu',            NOW(), FALSE),
    (d11, tid, p_ekol,    'Cenk Aydin',          '+905383334455', 'E-34-10011', '2029-02-28', TRUE, 'Frigo',           'Frigo,SRC2',        10, 'Marmara,Akdeniz',       NOW(), FALSE),
    -- Horoz (3)
    (d12, tid, p_horoz,   'Deniz Koc',           '+905391112233', 'E-34-10012', '2029-07-10', TRUE, 'ADR',             'ADR,SRC2',          10, 'Marmara,Ege',           NOW(), FALSE),
    (d13, tid, p_horoz,   'Erdem Ozkan',         '+905392223344', 'E-16-10013', '2028-10-20', TRUE, 'Frigo,Heavy',     'Frigo,SRC2,SRC4',   12, 'Marmara,Ic Anadolu',    NOW(), FALSE),
    (d14, tid, p_horoz,   'Ferhat Aslan',        '+905393334455', 'E-34-10014', '2029-01-05', TRUE, NULL,              'SRC2',               9, 'Marmara,Karadeniz',     NOW(), FALSE),
    -- Surat (3)
    (d15, tid, p_surat,   'Gökhan Yıldız',       '+905401112233', 'E-34-10015', '2029-03-25', TRUE, NULL,              'SRC2',              10, 'Marmara',               NOW(), FALSE),
    (d16, tid, p_surat,   'Hakan Kılıç',         '+905402223344', 'E-06-10016', '2028-11-10', TRUE, NULL,              'SRC2',              10, 'Ic Anadolu',            NOW(), FALSE),
    (d17, tid, p_surat,   'İlker Şahin',         '+905403334455', 'E-35-10017', '2029-06-20', TRUE, NULL,              'SRC2',              10, 'Ege',                   NOW(), FALSE),
    -- Aras (3)
    (d18, tid, p_aras,    'Kağan Demir',         '+905411112233', 'E-34-10018', '2029-08-15', TRUE, NULL,              'SRC2',              10, 'Marmara,Ic Anadolu',    NOW(), FALSE),
    (d19, tid, p_aras,    'Levent Öztürk',       '+905412223344', 'E-06-10019', '2028-06-20', TRUE, NULL,              'SRC2',              10, 'Ic Anadolu,Karadeniz',  NOW(), FALSE),
    (d20, tid, p_aras,    'Mert Yilmaz',         '+905413334455', 'E-16-10020', '2029-04-10', TRUE, 'ADR',             'ADR,SRC2',          11, 'Marmara,Ege,Karadeniz', NOW(), FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. NOTIFICATION TEMPLATES (5 Turkish)
-- ============================================================
INSERT INTO logistics.notification_templates (id, tenant_id, name, channel, stage, subject, template_body, variables, is_active, is_deleted, created_at, created_by)
VALUES
    (gen_random_uuid(), tid, 'Sipariş Onayı SMS', 0, 0,
     'Siparişiniz onaylandı',
     'Sayın {{CustomerName}}, {{OrderNumber}} numaralı siparişiniz onaylanmıştır. Tahmini teslimat: {{ETA}}. Takip: {{TrackingUrl}}',
     'CustomerName,OrderNumber,ETA,TrackingUrl', TRUE, FALSE, NOW(), 'seed'),

    (gen_random_uuid(), tid, 'Yola Çıkış Bildirimi', 0, 1,
     'Kargonuz yola çıktı',
     'Sayın {{CustomerName}}, {{OrderNumber}} numaralı kargonuz sürücü {{DriverName}} ile yola çıkmıştır. Tahmini varış: {{ETA}}. Canlı takip: {{TrackingUrl}}',
     'CustomerName,OrderNumber,DriverName,ETA,TrackingUrl', TRUE, FALSE, NOW(), 'seed'),

    (gen_random_uuid(), tid, 'Yaklaşma Bildirimi Push', 2, 2,
     'Kargonuz yaklaştı',
     'Kargonuz yaklaşık {{ETA}} dakika içinde adresinize ulaşacaktır. Sürücü: {{DriverName}}, Plaka: {{VehiclePlate}}',
     'ETA,DriverName,VehiclePlate', TRUE, FALSE, NOW(), 'seed'),

    (gen_random_uuid(), tid, 'Teslim Edildi Email', 1, 3,
     'Kargonuz teslim edildi',
     'Sayın {{CustomerName}}, {{OrderNumber}} numaralı kargonuz başarıyla teslim edilmiştir. Teslim alan: {{ReceiverName}}. Bizi değerlendirmek için: {{FeedbackUrl}}',
     'CustomerName,OrderNumber,ReceiverName,FeedbackUrl', TRUE, FALSE, NOW(), 'seed'),

    (gen_random_uuid(), tid, 'Başarısız Teslimat SMS', 0, 4,
     'Teslimat yapılamadı',
     'Sayın {{CustomerName}}, {{OrderNumber}} numaralı kargonuz teslim edilemedi. Sebep: {{FailReason}}. Yeni teslimat randevusu için: {{RescheduleUrl}}',
     'CustomerName,OrderNumber,FailReason,RescheduleUrl', TRUE, FALSE, NOW(), 'seed')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. ROUTE OPTIMIZATION RESULTS (10 completed)
-- ============================================================
INSERT INTO logistics.route_optimization_results (id, tenant_id, name, status, total_distance_km, total_duration_minutes, total_cost, vehicle_count, stop_count, solver_type, solve_time_ms, is_deleted, created_at, created_by)
VALUES
    (opt01, tid, 'İstanbul Dağıtım - 2026-06-01',     'Completed', 245.8,  320.0,  4500.00,  3, 12, 'NearestNeighbor', 1250, FALSE, '2026-06-01 08:00:00+03', 'seed'),
    (opt02, tid, 'Ankara Bölge Dağıtım - 2026-06-03', 'Completed', 182.3,  250.0,  3200.00,  2,  8, 'NearestNeighbor',  980, FALSE, '2026-06-03 07:30:00+03', 'seed'),
    (opt03, tid, 'Ege Rotası - 2026-06-05',           'Completed', 310.5,  420.0,  5800.00,  3, 15, 'GeneticAlgorithm', 3500, FALSE, '2026-06-05 06:00:00+03', 'seed'),
    (opt04, tid, 'Marmara Hattı - 2026-06-08',        'Completed', 198.7,  275.0,  3750.00,  2, 10, 'NearestNeighbor',  870, FALSE, '2026-06-08 08:30:00+03', 'seed'),
    (opt05, tid, 'İstanbul-Ankara Express - 2026-06-10','Completed', 450.2, 540.0,  7200.00,  4, 18, 'GeneticAlgorithm', 4200, FALSE, '2026-06-10 05:00:00+03', 'seed'),
    (opt06, tid, 'Karadeniz Turu - 2026-06-12',       'Completed', 520.0,  680.0,  8500.00,  3, 14, 'NearestNeighbor', 1800, FALSE, '2026-06-12 06:30:00+03', 'seed'),
    (opt07, tid, 'Akdeniz Dağıtım - 2026-06-15',      'Completed', 275.4,  360.0,  4100.00,  2,  9, 'NearestNeighbor', 1100, FALSE, '2026-06-15 07:00:00+03', 'seed'),
    (opt08, tid, 'İstanbul Şehiriçi - 2026-06-18',    'Completed', 135.2,  210.0,  2800.00,  3, 16, 'GeneticAlgorithm', 2900, FALSE, '2026-06-18 08:00:00+03', 'seed'),
    (opt09, tid, 'İç Anadolu Rotası - 2026-06-20',    'Completed', 380.6,  490.0,  6300.00,  3, 11, 'NearestNeighbor', 1400, FALSE, '2026-06-20 06:00:00+03', 'seed'),
    (opt10, tid, 'Tüm Türkiye Haftalık - 2026-06-22', 'Completed', 890.3, 1100.0, 14500.00,  5, 25, 'GeneticAlgorithm', 8500, FALSE, '2026-06-22 05:00:00+03', 'seed')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. OPTIMIZED ROUTES (25 linked to optimizations)
-- ============================================================
INSERT INTO logistics.optimized_routes (id, tenant_id, optimization_id, vehicle_id, vehicle_plate, sequence_order, total_distance_km, total_duration_minutes, total_weight_kg, total_volume_m3, is_deleted, created_at, created_by)
VALUES
    -- opt01: 3 routes
    (rt01, tid, opt01, v01, '34 ABC 123', 1,  85.2, 110.0, 3500.00, 14.0000, FALSE, '2026-06-01 08:00:00+03', 'seed'),
    (rt02, tid, opt01, v02, '34 DEF 456', 2,  92.3, 120.0, 8200.00, 32.8000, FALSE, '2026-06-01 08:00:00+03', 'seed'),
    (rt03, tid, opt01, v03, '41 GHI 789', 3,  68.3,  90.0, 2800.00, 11.2000, FALSE, '2026-06-01 08:00:00+03', 'seed'),
    -- opt02: 2 routes
    (rt04, tid, opt02, v04, '06 KLM 234', 1, 102.1, 140.0, 12000.00, 48.0000, FALSE, '2026-06-03 07:30:00+03', 'seed'),
    (rt05, tid, opt02, v05, '34 NOP 567', 2,  80.2, 110.0,  5500.00, 22.0000, FALSE, '2026-06-03 07:30:00+03', 'seed'),
    -- opt03: 3 routes
    (rt06, tid, opt03, v07, '35 UVW 012', 1, 115.0, 150.0, 10000.00, 40.0000, FALSE, '2026-06-05 06:00:00+03', 'seed'),
    (rt07, tid, opt03, v08, '34 XYZ 345', 2,  98.5, 130.0,  7500.00, 30.0000, FALSE, '2026-06-05 06:00:00+03', 'seed'),
    (rt08, tid, opt03, v09, '34 AKL 678', 3,  97.0, 140.0,  4200.00, 16.8000, FALSE, '2026-06-05 06:00:00+03', 'seed'),
    -- opt04: 2 routes
    (rt09, tid, opt04, v10, '34 BMS 901', 1,  95.4, 130.0, 1500.00,  6.0000, FALSE, '2026-06-08 08:30:00+03', 'seed'),
    (rt10, tid, opt04, v11, '41 CNR 234', 2, 103.3, 145.0, 3800.00, 15.2000, FALSE, '2026-06-08 08:30:00+03', 'seed'),
    -- opt05: 4 routes
    (rt11, tid, opt05, v01, '34 ABC 123', 1, 120.5, 150.0,  5000.00, 20.0000, FALSE, '2026-06-10 05:00:00+03', 'seed'),
    (rt12, tid, opt05, v02, '34 DEF 456', 2, 115.0, 140.0,  9500.00, 38.0000, FALSE, '2026-06-10 05:00:00+03', 'seed'),
    (rt13, tid, opt05, v04, '06 KLM 234', 3, 110.2, 130.0, 11000.00, 44.0000, FALSE, '2026-06-10 05:00:00+03', 'seed'),
    (rt14, tid, opt05, v07, '35 UVW 012', 4, 104.5, 120.0,  8000.00, 32.0000, FALSE, '2026-06-10 05:00:00+03', 'seed'),
    -- opt06: 3 routes
    (rt15, tid, opt06, v02, '34 DEF 456', 1, 185.0, 240.0, 12000.00, 48.0000, FALSE, '2026-06-12 06:30:00+03', 'seed'),
    (rt16, tid, opt06, v05, '34 NOP 567', 2, 170.0, 220.0,  7000.00, 28.0000, FALSE, '2026-06-12 06:30:00+03', 'seed'),
    (rt17, tid, opt06, v09, '34 AKL 678', 3, 165.0, 220.0,  4500.00, 18.0000, FALSE, '2026-06-12 06:30:00+03', 'seed'),
    -- opt07: 2 routes
    (rt18, tid, opt07, v08, '34 XYZ 345', 1, 145.0, 190.0,  8500.00, 34.0000, FALSE, '2026-06-15 07:00:00+03', 'seed'),
    (rt19, tid, opt07, v11, '41 CNR 234', 2, 130.4, 170.0,  3500.00, 14.0000, FALSE, '2026-06-15 07:00:00+03', 'seed'),
    -- opt08: 3 routes
    (rt20, tid, opt08, v12, '34 DPT 567', 1,  45.0,  70.0, 1200.00,  4.8000, FALSE, '2026-06-18 08:00:00+03', 'seed'),
    (rt21, tid, opt08, v13, '06 ERS 890', 2,  48.2,  75.0, 1000.00,  4.0000, FALSE, '2026-06-18 08:00:00+03', 'seed'),
    (rt22, tid, opt08, v14, '35 FYZ 123', 3,  42.0,  65.0, 1400.00,  5.6000, FALSE, '2026-06-18 08:00:00+03', 'seed'),
    -- opt09: 3 routes
    (rt23, tid, opt09, v04, '06 KLM 234', 1, 140.0, 180.0, 13000.00, 52.0000, FALSE, '2026-06-20 06:00:00+03', 'seed'),
    (rt24, tid, opt09, v07, '35 UVW 012', 2, 125.6, 160.0,  9000.00, 36.0000, FALSE, '2026-06-20 06:00:00+03', 'seed'),
    -- opt10: 2 routes (of the 5 vehicle optimization, showing 2)
    (rt25, tid, opt10, v02, '34 DEF 456', 1, 220.0, 280.0, 15000.00, 60.0000, FALSE, '2026-06-22 05:00:00+03', 'seed')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. ROUTE STOPS (80 with realistic Turkish city coordinates)
-- ============================================================
INSERT INTO logistics.route_stops (id, tenant_id, route_id, stop_order, stop_type, address, lat, lng, arrival_time, departure_time, time_window_start, time_window_end, service_time_minutes, is_deleted, created_at, created_by)
VALUES
    -- rt01: İstanbul dağıtım (4 stops)
    (gen_random_uuid(), tid, rt01, 1, 'Depot',    'Hadımköy Lojistik Merkezi, Arnavutköy',           41.1150, 28.7320, '2026-06-01 08:00+03', '2026-06-01 08:30+03', '2026-06-01 07:00+03', '2026-06-01 09:00+03', 30, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt01, 2, 'Delivery', 'İkitelli OSB, Başakşehir',                        41.0670, 28.7960, '2026-06-01 09:00+03', '2026-06-01 09:20+03', '2026-06-01 08:00+03', '2026-06-01 12:00+03', 20, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt01, 3, 'Delivery', 'Beylikdüzü Organize Sanayi',                      41.0050, 28.6280, '2026-06-01 09:50+03', '2026-06-01 10:10+03', '2026-06-01 09:00+03', '2026-06-01 13:00+03', 20, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt01, 4, 'Delivery', 'Tuzla Deri OSB, Tuzla',                           40.8180, 29.3010, '2026-06-01 11:00+03', '2026-06-01 11:25+03', '2026-06-01 10:00+03', '2026-06-01 14:00+03', 25, FALSE, NOW(), 'seed'),
    -- rt02: İstanbul dağıtım (4 stops)
    (gen_random_uuid(), tid, rt02, 1, 'Depot',    'Hadımköy Lojistik Merkezi, Arnavutköy',           41.1150, 28.7320, '2026-06-01 08:00+03', '2026-06-01 08:30+03', '2026-06-01 07:00+03', '2026-06-01 09:00+03', 30, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt02, 2, 'Delivery', 'Gebze OSB, Kocaeli',                              40.8020, 29.4310, '2026-06-01 09:30+03', '2026-06-01 09:55+03', '2026-06-01 08:00+03', '2026-06-01 12:00+03', 25, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt02, 3, 'Delivery', 'Dilovası OSB, Kocaeli',                           40.7830, 29.5430, '2026-06-01 10:15+03', '2026-06-01 10:35+03', '2026-06-01 09:00+03', '2026-06-01 13:00+03', 20, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt02, 4, 'Delivery', 'Çayırova Sanayi Bölgesi, Kocaeli',                40.8260, 29.3790, '2026-06-01 11:00+03', '2026-06-01 11:20+03', '2026-06-01 10:00+03', '2026-06-01 14:00+03', 20, FALSE, NOW(), 'seed'),
    -- rt03: İstanbul frigorifik (4 stops)
    (gen_random_uuid(), tid, rt03, 1, 'Pickup',   'Bayramoğlu Gıda Deposu, Darıca',                  40.7690, 29.3710, '2026-06-01 08:00+03', '2026-06-01 08:40+03', '2026-06-01 07:00+03', '2026-06-01 09:00+03', 40, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt03, 2, 'Delivery', 'Kadıköy Merkez Migros',                           40.9903, 29.0296, '2026-06-01 09:30+03', '2026-06-01 09:50+03', '2026-06-01 09:00+03', '2026-06-01 12:00+03', 20, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt03, 3, 'Delivery', 'Üsküdar Çarşı Market',                            41.0247, 29.0158, '2026-06-01 10:10+03', '2026-06-01 10:30+03', '2026-06-01 09:00+03', '2026-06-01 13:00+03', 20, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt03, 4, 'Delivery', 'Maltepe A101 Dağıtım',                            40.9356, 29.1290, '2026-06-01 11:00+03', '2026-06-01 11:15+03', '2026-06-01 10:00+03', '2026-06-01 14:00+03', 15, FALSE, NOW(), 'seed'),

    -- rt04: Ankara bölge (4 stops)
    (gen_random_uuid(), tid, rt04, 1, 'Depot',    'Ankara Lojistik Üssü, Sincan',                    39.9680, 32.5730, '2026-06-03 07:30+03', '2026-06-03 08:00+03', '2026-06-03 07:00+03', '2026-06-03 09:00+03', 30, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt04, 2, 'Delivery', 'Ostim OSB, Yenimahalle',                          39.9770, 32.7320, '2026-06-03 08:30+03', '2026-06-03 08:50+03', '2026-06-03 08:00+03', '2026-06-03 12:00+03', 20, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt04, 3, 'Delivery', 'Ivedik OSB, Yenimahalle',                         39.9920, 32.7480, '2026-06-03 09:10+03', '2026-06-03 09:35+03', '2026-06-03 08:00+03', '2026-06-03 13:00+03', 25, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt04, 4, 'Delivery', 'Başkent OSB, Sincan',                             39.9430, 32.5190, '2026-06-03 10:15+03', '2026-06-03 10:35+03', '2026-06-03 09:00+03', '2026-06-03 14:00+03', 20, FALSE, NOW(), 'seed'),
    -- rt05: Ankara bölge (4 stops)
    (gen_random_uuid(), tid, rt05, 1, 'Depot',    'Ankara Lojistik Üssü, Sincan',                    39.9680, 32.5730, '2026-06-03 07:30+03', '2026-06-03 08:00+03', '2026-06-03 07:00+03', '2026-06-03 09:00+03', 30, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt05, 2, 'Delivery', 'Siteler Mobilya Çarşısı',                         39.9580, 32.8750, '2026-06-03 08:40+03', '2026-06-03 09:00+03', '2026-06-03 08:00+03', '2026-06-03 12:00+03', 20, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt05, 3, 'Delivery', 'Kazan Sanayi Bölgesi',                            40.1680, 32.6810, '2026-06-03 09:45+03', '2026-06-03 10:05+03', '2026-06-03 09:00+03', '2026-06-03 13:00+03', 20, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt05, 4, 'Delivery', 'Temelli Sanayi Bölgesi',                          39.8230, 32.3490, '2026-06-03 11:00+03', '2026-06-03 11:25+03', '2026-06-03 10:00+03', '2026-06-03 14:00+03', 25, FALSE, NOW(), 'seed'),

    -- rt06: Ege rotasi (5 stops)
    (gen_random_uuid(), tid, rt06, 1, 'Depot',    'İzmir Atatürk OSB, Çiğli',                        38.5010, 27.0560, '2026-06-05 06:00+03', '2026-06-05 06:30+03', '2026-06-05 05:30+03', '2026-06-05 07:00+03', 30, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt06, 2, 'Delivery', 'Manisa OSB, Manisa',                              38.6191, 27.4289, '2026-06-05 07:20+03', '2026-06-05 07:45+03', '2026-06-05 07:00+03', '2026-06-05 10:00+03', 25, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt06, 3, 'Delivery', 'Denizli Sanayi Sitesi',                           37.7765, 29.0864, '2026-06-05 09:30+03', '2026-06-05 09:55+03', '2026-06-05 08:00+03', '2026-06-05 12:00+03', 25, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt06, 4, 'Delivery', 'Aydın Merkez Depo',                               37.8560, 27.8416, '2026-06-05 11:15+03', '2026-06-05 11:35+03', '2026-06-05 10:00+03', '2026-06-05 14:00+03', 20, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt06, 5, 'Delivery', 'Muğla Lojistik Merkezi',                          37.2153, 28.3636, '2026-06-05 13:00+03', '2026-06-05 13:25+03', '2026-06-05 12:00+03', '2026-06-05 16:00+03', 25, FALSE, NOW(), 'seed'),
    -- rt07: Ege rotasi (5 stops)
    (gen_random_uuid(), tid, rt07, 1, 'Depot',    'İzmir Atatürk OSB, Çiğli',                        38.5010, 27.0560, '2026-06-05 06:00+03', '2026-06-05 06:30+03', '2026-06-05 05:30+03', '2026-06-05 07:00+03', 30, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt07, 2, 'Delivery', 'Balıkesir OSB',                                   39.6484, 27.8826, '2026-06-05 08:00+03', '2026-06-05 08:25+03', '2026-06-05 07:00+03', '2026-06-05 11:00+03', 25, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt07, 3, 'Delivery', 'Bursa Nilüfer OSB',                               40.1885, 29.0610, '2026-06-05 09:45+03', '2026-06-05 10:10+03', '2026-06-05 09:00+03', '2026-06-05 13:00+03', 25, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt07, 4, 'Delivery', 'Eskişehir Organize Sanayi',                       39.7767, 30.5206, '2026-06-05 11:30+03', '2026-06-05 11:55+03', '2026-06-05 10:00+03', '2026-06-05 14:00+03', 25, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt07, 5, 'Delivery', 'Afyon Sanayi Sitesi',                             38.7507, 30.5567, '2026-06-05 13:15+03', '2026-06-05 13:35+03', '2026-06-05 12:00+03', '2026-06-05 16:00+03', 20, FALSE, NOW(), 'seed'),
    -- rt08: Ege (5 stops)
    (gen_random_uuid(), tid, rt08, 1, 'Depot',    'İzmir Atatürk OSB, Çiğli',                        38.5010, 27.0560, '2026-06-05 06:00+03', '2026-06-05 06:30+03', '2026-06-05 05:30+03', '2026-06-05 07:00+03', 30, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt08, 2, 'Delivery', 'Isparta Sanayi Sitesi',                           37.7648, 30.5566, '2026-06-05 08:30+03', '2026-06-05 08:50+03', '2026-06-05 08:00+03', '2026-06-05 11:00+03', 20, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt08, 3, 'Delivery', 'Burdur Merkez Depo',                              37.7200, 30.2900, '2026-06-05 09:20+03', '2026-06-05 09:40+03', '2026-06-05 09:00+03', '2026-06-05 12:00+03', 20, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt08, 4, 'Delivery', 'Antalya Serbest Bölge',                           36.8969, 30.7133, '2026-06-05 11:30+03', '2026-06-05 11:55+03', '2026-06-05 10:00+03', '2026-06-05 14:00+03', 25, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt08, 5, 'Delivery', 'Konya Merkez OSB',                                37.8746, 32.4932, '2026-06-05 14:00+03', '2026-06-05 14:25+03', '2026-06-05 13:00+03', '2026-06-05 17:00+03', 25, FALSE, NOW(), 'seed'),

    -- rt09: Marmara (5 stops)
    (gen_random_uuid(), tid, rt09, 1, 'Depot',    'Çerkezköy Lojistik Üssü, Tekirdag',               41.2824, 27.5119, '2026-06-08 08:30+03', '2026-06-08 09:00+03', '2026-06-08 08:00+03', '2026-06-08 09:30+03', 30, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt09, 2, 'Delivery', 'Edirne Merkez Depo',                              41.6818, 26.5623, '2026-06-08 10:00+03', '2026-06-08 10:20+03', '2026-06-08 09:00+03', '2026-06-08 12:00+03', 20, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt09, 3, 'Delivery', 'Lüleburgaz Sanayi Sitesi',                        41.4040, 27.3550, '2026-06-08 11:10+03', '2026-06-08 11:30+03', '2026-06-08 10:00+03', '2026-06-08 13:00+03', 20, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt09, 4, 'Delivery', 'Çorlu OSB, Tekirdag',                             41.1580, 27.7960, '2026-06-08 12:15+03', '2026-06-08 12:35+03', '2026-06-08 11:00+03', '2026-06-08 14:00+03', 20, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt09, 5, 'Delivery', 'Sakarya OSB, Adapazarı',                          40.6940, 30.4358, '2026-06-08 14:30+03', '2026-06-08 14:55+03', '2026-06-08 13:00+03', '2026-06-08 16:00+03', 25, FALSE, NOW(), 'seed'),
    -- rt10: Marmara (5 stops)
    (gen_random_uuid(), tid, rt10, 1, 'Depot',    'Çerkezköy Lojistik Üssü, Tekirdag',               41.2824, 27.5119, '2026-06-08 08:30+03', '2026-06-08 09:00+03', '2026-06-08 08:00+03', '2026-06-08 09:30+03', 30, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt10, 2, 'Delivery', 'Bolu Sanayi Sitesi',                              40.7360, 31.6061, '2026-06-08 10:30+03', '2026-06-08 10:50+03', '2026-06-08 09:00+03', '2026-06-08 12:00+03', 20, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt10, 3, 'Delivery', 'Düzce OSB',                                       40.8370, 31.1560, '2026-06-08 11:30+03', '2026-06-08 11:50+03', '2026-06-08 10:00+03', '2026-06-08 13:00+03', 20, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt10, 4, 'Delivery', 'Yalova Tersaneler Bölgesi',                       40.6500, 29.2700, '2026-06-08 13:00+03', '2026-06-08 13:25+03', '2026-06-08 12:00+03', '2026-06-08 15:00+03', 25, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt10, 5, 'Delivery', 'Bursa Demirtaş OSB',                              40.1580, 29.1230, '2026-06-08 14:30+03', '2026-06-08 14:50+03', '2026-06-08 13:00+03', '2026-06-08 16:00+03', 20, FALSE, NOW(), 'seed'),

    -- rt15: Karadeniz turu (5 stops)
    (gen_random_uuid(), tid, rt15, 1, 'Depot',    'Samsun Liman Lojistik',                           41.2928, 36.3313, '2026-06-12 06:30+03', '2026-06-12 07:00+03', '2026-06-12 06:00+03', '2026-06-12 07:30+03', 30, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt15, 2, 'Delivery', 'Trabzon Liman Bölgesi',                           41.0015, 39.7178, '2026-06-12 10:00+03', '2026-06-12 10:30+03', '2026-06-12 08:00+03', '2026-06-12 12:00+03', 30, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt15, 3, 'Delivery', 'Rize Çaykur Deposu',                              41.0201, 40.5234, '2026-06-12 11:30+03', '2026-06-12 11:50+03', '2026-06-12 10:00+03', '2026-06-12 14:00+03', 20, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt15, 4, 'Delivery', 'Giresun Fındık Deposu',                           40.9128, 38.3895, '2026-06-12 13:30+03', '2026-06-12 13:55+03', '2026-06-12 12:00+03', '2026-06-12 16:00+03', 25, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt15, 5, 'Delivery', 'Ordu Sanayi Sitesi',                              40.9839, 37.8764, '2026-06-12 14:45+03', '2026-06-12 15:05+03', '2026-06-12 13:00+03', '2026-06-12 17:00+03', 20, FALSE, NOW(), 'seed'),

    -- rt18: Akdeniz (5 stops)
    (gen_random_uuid(), tid, rt18, 1, 'Depot',    'Mersin Serbest Bölge',                            36.8121, 34.6415, '2026-06-15 07:00+03', '2026-06-15 07:30+03', '2026-06-15 06:30+03', '2026-06-15 08:00+03', 30, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt18, 2, 'Delivery', 'Adana Hacı Sabancı OSB',                          37.0000, 35.3213, '2026-06-15 08:30+03', '2026-06-15 08:55+03', '2026-06-15 08:00+03', '2026-06-15 11:00+03', 25, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt18, 3, 'Delivery', 'Hatay İskenderun Liman',                          36.4018, 36.3498, '2026-06-15 10:30+03', '2026-06-15 10:55+03', '2026-06-15 09:00+03', '2026-06-15 13:00+03', 25, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt18, 4, 'Delivery', 'Kahramanmaraş Sanayi',                            37.5847, 36.9371, '2026-06-15 12:30+03', '2026-06-15 12:55+03', '2026-06-15 11:00+03', '2026-06-15 15:00+03', 25, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt18, 5, 'Delivery', 'Gaziantep OSB',                                   37.0662, 37.3833, '2026-06-15 14:30+03', '2026-06-15 14:55+03', '2026-06-15 13:00+03', '2026-06-15 17:00+03', 25, FALSE, NOW(), 'seed'),

    -- rt20: İstanbul sehirici (6 stops)
    (gen_random_uuid(), tid, rt20, 1, 'Depot',    'Esenyurt Kargo Merkezi',                          41.0340, 28.6720, '2026-06-18 08:00+03', '2026-06-18 08:20+03', '2026-06-18 07:30+03', '2026-06-18 08:30+03', 20, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt20, 2, 'Delivery', 'Bahçelievler AVM Teslimat',                       41.0010, 28.8540, '2026-06-18 08:45+03', '2026-06-18 09:00+03', '2026-06-18 08:00+03', '2026-06-18 10:00+03', 15, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt20, 3, 'Delivery', 'Bakırköy Marina',                                 40.9810, 28.8720, '2026-06-18 09:20+03', '2026-06-18 09:35+03', '2026-06-18 09:00+03', '2026-06-18 11:00+03', 15, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt20, 4, 'Delivery', 'Şişli Merkez',                                    41.0600, 28.9870, '2026-06-18 10:00+03', '2026-06-18 10:15+03', '2026-06-18 09:00+03', '2026-06-18 12:00+03', 15, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt20, 5, 'Delivery', 'Levent İş Merkezi',                               41.0810, 29.0130, '2026-06-18 10:35+03', '2026-06-18 10:50+03', '2026-06-18 10:00+03', '2026-06-18 13:00+03', 15, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt20, 6, 'Delivery', 'Kağıthane Sanayi',                                41.0850, 28.9710, '2026-06-18 11:10+03', '2026-06-18 11:30+03', '2026-06-18 10:00+03', '2026-06-18 14:00+03', 20, FALSE, NOW(), 'seed'),

    -- rt23: Ic Anadolu (4 stops)
    (gen_random_uuid(), tid, rt23, 1, 'Depot',    'Ankara Lojistik Üssü, Sincan',                    39.9680, 32.5730, '2026-06-20 06:00+03', '2026-06-20 06:30+03', '2026-06-20 05:30+03', '2026-06-20 07:00+03', 30, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt23, 2, 'Delivery', 'Kayseri OSB',                                     38.7312, 35.4787, '2026-06-20 09:00+03', '2026-06-20 09:30+03', '2026-06-20 08:00+03', '2026-06-20 12:00+03', 30, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt23, 3, 'Delivery', 'Sivas Sanayi Sitesi',                             39.7477, 37.0179, '2026-06-20 12:00+03', '2026-06-20 12:25+03', '2026-06-20 10:00+03', '2026-06-20 14:00+03', 25, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt23, 4, 'Delivery', 'Nevşehir Depo',                                   38.6244, 34.7239, '2026-06-20 14:30+03', '2026-06-20 14:55+03', '2026-06-20 13:00+03', '2026-06-20 17:00+03', 25, FALSE, NOW(), 'seed'),

    -- rt24: Ic Anadolu (4 stops)
    (gen_random_uuid(), tid, rt24, 1, 'Depot',    'Ankara Lojistik Üssü, Sincan',                    39.9680, 32.5730, '2026-06-20 06:00+03', '2026-06-20 06:30+03', '2026-06-20 05:30+03', '2026-06-20 07:00+03', 30, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt24, 2, 'Delivery', 'Konya 2. OSB',                                    37.8746, 32.4932, '2026-06-20 08:30+03', '2026-06-20 08:55+03', '2026-06-20 08:00+03', '2026-06-20 11:00+03', 25, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt24, 3, 'Delivery', 'Aksaray Sanayi Sitesi',                           38.3687, 34.0210, '2026-06-20 10:30+03', '2026-06-20 10:55+03', '2026-06-20 09:00+03', '2026-06-20 13:00+03', 25, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt24, 4, 'Delivery', 'Kırıkkale Silah Sanayi Bölgesi',                  39.8468, 33.5153, '2026-06-20 13:00+03', '2026-06-20 13:25+03', '2026-06-20 12:00+03', '2026-06-20 15:00+03', 25, FALSE, NOW(), 'seed'),

    -- rt25: Tüm Türkiye (5 stops)
    (gen_random_uuid(), tid, rt25, 1, 'Depot',    'İstanbul Hadımköy Lojistik',                      41.1150, 28.7320, '2026-06-22 05:00+03', '2026-06-22 05:30+03', '2026-06-22 04:30+03', '2026-06-22 06:00+03', 30, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt25, 2, 'Delivery', 'Ankara Sincan OSB',                               39.9680, 32.5730, '2026-06-22 10:00+03', '2026-06-22 10:30+03', '2026-06-22 08:00+03', '2026-06-22 12:00+03', 30, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt25, 3, 'Delivery', 'Konya Büyükşehir OSB',                            37.8746, 32.4932, '2026-06-22 13:00+03', '2026-06-22 13:30+03', '2026-06-22 11:00+03', '2026-06-22 15:00+03', 30, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt25, 4, 'Delivery', 'Adana Ceyhan OSB',                                37.0000, 35.3213, '2026-06-22 16:00+03', '2026-06-22 16:30+03', '2026-06-22 14:00+03', '2026-06-22 18:00+03', 30, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rt25, 5, 'Delivery', 'Gaziantep Organize Sanayi',                       37.0662, 37.3833, '2026-06-22 19:00+03', '2026-06-22 19:30+03', '2026-06-22 17:00+03', '2026-06-22 21:00+03', 30, FALSE, NOW(), 'seed')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. DELIVERY SLOTS (30)
-- ============================================================
INSERT INTO logistics.delivery_slots (id, tenant_id, date, start_time, end_time, customer_name, customer_phone, zip_code, status, reserved_at, confirmed_at, expires_at, is_deleted, created_at, created_by)
VALUES
    -- Available slots
    (gen_random_uuid(), tid, '2026-07-01', '09:00', '12:00', NULL, NULL, '34000', 0, NULL, NULL, NULL, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-07-01', '13:00', '17:00', NULL, NULL, '34000', 0, NULL, NULL, NULL, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-07-02', '09:00', '12:00', NULL, NULL, '06000', 0, NULL, NULL, NULL, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-07-02', '13:00', '17:00', NULL, NULL, '06000', 0, NULL, NULL, NULL, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-07-03', '08:00', '11:00', NULL, NULL, '35000', 0, NULL, NULL, NULL, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-07-03', '14:00', '18:00', NULL, NULL, '35000', 0, NULL, NULL, NULL, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-07-04', '09:00', '12:00', NULL, NULL, '34000', 0, NULL, NULL, NULL, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-07-04', '13:00', '17:00', NULL, NULL, '16000', 0, NULL, NULL, NULL, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-07-05', '10:00', '14:00', NULL, NULL, '34000', 0, NULL, NULL, NULL, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-07-05', '15:00', '19:00', NULL, NULL, '41000', 0, NULL, NULL, NULL, FALSE, NOW(), 'seed'),
    -- Reserved slots
    (gen_random_uuid(), tid, '2026-06-28', '09:00', '12:00', 'Ayşe Yılmaz',    '+905321112233', '34100', 1, '2026-06-25 10:00+03', NULL, '2026-06-27 10:00+03', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-06-28', '13:00', '17:00', 'Fatma Kaya',      '+905322223344', '34200', 1, '2026-06-25 11:30+03', NULL, '2026-06-27 11:30+03', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-06-29', '09:00', '12:00', 'Mehmet Çelik',    '+905323334455', '06100', 1, '2026-06-26 09:00+03', NULL, '2026-06-28 09:00+03', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-06-29', '14:00', '18:00', 'Ali Demir',       '+905324445566', '06200', 1, '2026-06-26 14:00+03', NULL, '2026-06-28 14:00+03', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-06-30', '10:00', '13:00', 'Hasan Öztürk',    '+905325556677', '35100', 1, '2026-06-27 08:30+03', NULL, '2026-06-29 08:30+03', FALSE, NOW(), 'seed'),
    -- Confirmed slots
    (gen_random_uuid(), tid, '2026-06-25', '09:00', '12:00', 'Zeynep Şahin',    '+905331112233', '34300', 2, '2026-06-22 10:00+03', '2026-06-23 09:00+03', '2026-06-24 10:00+03', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-06-25', '13:00', '17:00', 'Elif Aksoy',      '+905332223344', '34400', 2, '2026-06-22 11:00+03', '2026-06-23 10:00+03', '2026-06-24 11:00+03', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-06-26', '09:00', '12:00', 'Murat Korkmaz',   '+905333334455', '06300', 2, '2026-06-23 09:00+03', '2026-06-24 08:30+03', '2026-06-25 09:00+03', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-06-26', '14:00', '18:00', 'Emre Doğan',      '+905334445566', '16100', 2, '2026-06-23 14:00+03', '2026-06-24 13:00+03', '2026-06-25 14:00+03', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-06-27', '08:00', '11:00', 'Burak Arslan',    '+905335556677', '34500', 2, '2026-06-24 09:00+03', '2026-06-25 08:00+03', '2026-06-26 09:00+03', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-06-27', '13:00', '17:00', 'Cem Polat',       '+905336667788', '34600', 2, '2026-06-24 11:00+03', '2026-06-25 10:00+03', '2026-06-26 11:00+03', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-06-24', '09:00', '12:00', 'Tolga Kurt',      '+905337778899', '35200', 2, '2026-06-21 09:00+03', '2026-06-22 08:30+03', '2026-06-23 09:00+03', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-06-24', '14:00', '18:00', 'Deniz Aydın',     '+905338889900', '41100', 2, '2026-06-21 14:00+03', '2026-06-22 13:00+03', '2026-06-23 14:00+03', FALSE, NOW(), 'seed'),
    -- Expired slots
    (gen_random_uuid(), tid, '2026-06-20', '09:00', '12:00', 'Serkan Yıldız',   '+905341112233', '34700', 3, '2026-06-17 10:00+03', NULL, '2026-06-19 10:00+03', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-06-20', '13:00', '17:00', 'Volkan Koç',      '+905342223344', '34800', 3, '2026-06-17 11:00+03', NULL, '2026-06-19 11:00+03', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-06-21', '09:00', '12:00', 'Yasin Özkan',     '+905343334455', '06400', 3, '2026-06-18 09:00+03', NULL, '2026-06-20 09:00+03', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-06-21', '14:00', '18:00', 'Zafer Aslan',     '+905344445566', '06500', 3, '2026-06-18 14:00+03', NULL, '2026-06-20 14:00+03', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-06-22', '08:00', '11:00', 'Alper Kılıç',     '+905345556677', '35300', 3, '2026-06-19 08:00+03', NULL, '2026-06-21 08:00+03', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-06-22', '14:00', '18:00', 'Barış Şahin',     '+905346667788', '42100', 3, '2026-06-19 14:00+03', NULL, '2026-06-21 14:00+03', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, '2026-06-23', '10:00', '14:00', 'Cenk Demir',      '+905347778899', '34900', 3, '2026-06-20 10:00+03', NULL, '2026-06-22 10:00+03', FALSE, NOW(), 'seed')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. DELIVERY FEEDBACK (25 with Turkish comments)
-- ============================================================
INSERT INTO logistics.delivery_feedback (id, tenant_id, rating, comment, feedback_type, submitted_at, customer_name, customer_phone, driver_id, is_deleted, created_at, created_by)
VALUES
    (gen_random_uuid(), tid, 5, 'Çok hızlı ve güvenilir teslimat, teşekkürler!',                     0, '2026-06-01 14:30+03', 'Ayşe Yılmaz',     '+905321112233', d01, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 4, 'Zamanında geldi, sürücü çok kibar davrandı.',                       2, '2026-06-02 11:00+03', 'Fatma Kaya',       '+905322223344', d02, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 3, 'Teslimat biraz geç kaldı ama ürün sağlam geldi.',                   0, '2026-06-03 16:15+03', 'Mehmet Çelik',     '+905323334455', d03, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 5, 'Mükemmel hizmet, her zaman tercihim olacak.',                       0, '2026-06-04 10:45+03', 'Ali Demir',        '+905324445566', d04, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 2, 'Paket hasarlı geldi, dikkatli taşınmamış.',                         1, '2026-06-05 13:20+03', 'Hasan Öztürk',     '+905325556677', d05, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 4, 'Soğutucu zincir bozulmadan teslim edildi, iyi.',                    0, '2026-06-06 09:30+03', 'Zeynep Şahin',     '+905331112233', d07, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 1, 'Yanlış ürün teslim edildi, çok memnuniyetsizim.',                   1, '2026-06-07 15:00+03', 'Elif Aksoy',       '+905332223344', d08, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 5, 'Sürücü çok yardımcı oldu, ürünleri yerine yerleştirdi.',            2, '2026-06-08 12:10+03', 'Murat Korkmaz',    '+905333334455', d09, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 4, 'Zamanında ve eksiksiz teslimat.',                                   0, '2026-06-09 17:45+03', 'Emre Doğan',       '+905334445566', d10, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 3, 'Teslimat saatinde 1 saatlik gecikme oldu.',                         0, '2026-06-10 14:20+03', 'Burak Arslan',     '+905335556677', d11, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 5, 'Her şey harika, sürücü profesyoneldi.',                             2, '2026-06-11 11:00+03', 'Cem Polat',        '+905336667788', d12, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 4, 'Ürün kalitesi ve teslimat hızı memnun edici.',                      1, '2026-06-12 10:30+03', 'Tolga Kurt',       '+905337778899', d13, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 2, 'Kargo kutusu ezilmiş, içindeki ürün çizilmiş.',                     1, '2026-06-13 16:00+03', 'Deniz Aydın',      '+905338889900', d14, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 5, 'Beklentilerimin üzerinde bir hizmet aldım.',                        0, '2026-06-14 09:15+03', 'Serkan Yıldız',    '+905341112233', d15, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 3, 'Ortalama bir teslimat deneyimi, fena değildi.',                     0, '2026-06-15 13:40+03', 'Volkan Koç',       '+905342223344', d16, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 4, 'Soğuk zincir kurallarına uygun teslimat yapıldı.',                  0, '2026-06-16 11:25+03', 'Yasin Özkan',      '+905343334455', d17, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 1, 'Teslimat yapılmadı, sürücü adresi bulamadım dedi.',                 0, '2026-06-17 18:00+03', 'Zafer Aslan',      '+905344445566', d18, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 5, 'Harika deneyim, sürücü 10 dakika önce aradı.',                      2, '2026-06-18 14:50+03', 'Alper Kılıç',      '+905345556677', d19, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 4, 'Genel olarak iyi, sadece ambalaj biraz zayıftı.',                   1, '2026-06-19 10:00+03', 'Barış Şahin',      '+905346667788', d20, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 3, 'İdare eder, sürücü pek ilgilenmedi.',                               2, '2026-06-20 15:30+03', 'Cenk Demir',       '+905347778899', d01, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 5, 'En iyi lojistik deneyimim, elinize sağlık!',                        0, '2026-06-21 12:15+03', 'Gökhan Yıldız',    '+905401112233', d02, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 4, 'Hızlı teslimat, sürücü nazik ve yardımcıydı.',                      2, '2026-06-22 09:40+03', 'Hakan Kılıç',      '+905402223344', d03, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 2, 'Ürün kapısı kapalıydı ama sürücü bırakmış, riskli.',                0, '2026-06-23 17:10+03', 'İlker Şahin',      '+905403334455', d04, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 5, 'Tam zamanında, sorunsuz teslimat. Bravo!',                          0, '2026-06-24 11:50+03', 'Kağan Demir',      '+905411112233', d05, FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 4, 'Paketleme güzel, ürün sağlam geldi. Teşekkürler.',                  1, '2026-06-25 14:00+03', 'Levent Öztürk',    '+905412223344', d06, FALSE, NOW(), 'seed')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. RETURN REQUESTS (10)
-- ============================================================
INSERT INTO logistics.return_requests (id, tenant_id, reason, status, pickup_address, pickup_lat, pickup_lng, requested_at, pickup_date, received_at, notes, is_deleted, created_at, created_by)
VALUES
    -- Requested
    (gen_random_uuid(), tid, 'Damaged',   'Requested',       'Kadıköy Moda Caddesi No:15, İstanbul',         40.9903, 29.0296, '2026-06-20 09:00+03', NULL, NULL, 'Ürün kutusunda belirgin ezilme var.', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'WrongItem', 'Requested',       'Çankaya Kavaklıdere, Ankara',                  39.9030, 32.8590, '2026-06-21 11:30+03', NULL, NULL, 'Sipariş ettiği ürün yerine farklı ürün gelmiş.', FALSE, NOW(), 'seed'),
    -- PickupScheduled
    (gen_random_uuid(), tid, 'Refused',   'PickupScheduled', 'Alsancak Kordon, İzmir',                       38.4350, 27.1420, '2026-06-18 14:00+03', '2026-06-22 10:00+03', NULL, 'Müşteri kargo ücretini kabul etmedi.', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'Damaged',   'PickupScheduled', 'Nilüfer Merkez, Bursa',                        40.2080, 28.9770, '2026-06-19 10:00+03', '2026-06-23 09:00+03', NULL, 'Cam ürün kırılmış, fotoğraflar eklendi.', FALSE, NOW(), 'seed'),
    -- InTransit
    (gen_random_uuid(), tid, 'WrongItem', 'InTransit',       'Lara, Antalya',                                36.8580, 30.7350, '2026-06-15 08:30+03', '2026-06-18 10:00+03', NULL, 'Yanlış beden kıyafet gönderilmiş.', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'Other',     'InTransit',       'Seyhan Merkez, Adana',                         37.0000, 35.3213, '2026-06-16 15:00+03', '2026-06-19 14:00+03', NULL, 'Müşteri fikir değiştirdi, iade istiyor.', FALSE, NOW(), 'seed'),
    -- Received
    (gen_random_uuid(), tid, 'Damaged',   'Received',        'Osmangazi Sanayi, Bursa',                      40.1830, 29.0540, '2026-06-10 09:00+03', '2026-06-13 10:00+03', '2026-06-16 11:00+03', 'Ürün depoya ulaştı, hasar teyit edildi.', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'Refused',   'Received',        'Keçiören Merkez, Ankara',                      39.9990, 32.8640, '2026-06-11 10:30+03', '2026-06-14 09:00+03', '2026-06-17 14:00+03', 'Müşteri teslimattan hemen sonra iade etti.', FALSE, NOW(), 'seed'),
    -- Processed
    (gen_random_uuid(), tid, 'WrongItem', 'Processed',       'Konak Merkez, İzmir',                          38.4192, 27.1287, '2026-06-05 11:00+03', '2026-06-08 10:00+03', '2026-06-11 09:00+03', 'Doğru ürün yeniden gönderildi, iade tamamlandı.', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, 'Other',     'Processed',       'Selçuklu Merkez, Konya',                       37.8746, 32.4932, '2026-06-06 14:00+03', '2026-06-09 14:00+03', '2026-06-12 10:00+03', 'Müşteri farklı model istedi, değişim yapıldı.', FALSE, NOW(), 'seed')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. PACKAGE SCANS (40)
-- ============================================================
INSERT INTO logistics.package_scans (id, tenant_id, shipment_id, driver_id, barcode_value, scan_type, scanned_at, lat, lng, is_deleted, created_at, created_by)
SELECT
    gen_random_uuid(), tid,
    s.id,
    CASE (row_number() OVER (ORDER BY s.created_at)) % 20
        WHEN 0  THEN d01 WHEN 1  THEN d02 WHEN 2  THEN d03 WHEN 3  THEN d04
        WHEN 4  THEN d05 WHEN 5  THEN d06 WHEN 6  THEN d07 WHEN 7  THEN d08
        WHEN 8  THEN d09 WHEN 9  THEN d10 WHEN 10 THEN d11 WHEN 11 THEN d12
        WHEN 12 THEN d13 WHEN 13 THEN d14 WHEN 14 THEN d15 WHEN 15 THEN d16
        WHEN 16 THEN d17 WHEN 17 THEN d18 WHEN 18 THEN d19 ELSE d20
    END,
    'PKG-' || UPPER(SUBSTR(s.id::TEXT, 1, 8)) || '-' || LPAD((row_number() OVER (ORDER BY s.created_at))::TEXT, 4, '0'),
    CASE (row_number() OVER (ORDER BY s.created_at)) % 4
        WHEN 0 THEN 0  -- PickUp
        WHEN 1 THEN 1  -- Load
        WHEN 2 THEN 2  -- Deliver
        ELSE 3          -- Return
    END,
    s.created_at + ((row_number() OVER (ORDER BY s.created_at)) % 24 || ' hours')::INTERVAL,
    -- Rotating Turkish city coordinates
    CASE (row_number() OVER (ORDER BY s.created_at)) % 8
        WHEN 0 THEN 41.0082  -- İstanbul
        WHEN 1 THEN 39.9334  -- Ankara
        WHEN 2 THEN 38.4192  -- İzmir
        WHEN 3 THEN 40.1885  -- Bursa
        WHEN 4 THEN 36.8969  -- Antalya
        WHEN 5 THEN 37.0000  -- Adana
        WHEN 6 THEN 37.8746  -- Konya
        ELSE 41.2928         -- Samsun
    END,
    CASE (row_number() OVER (ORDER BY s.created_at)) % 8
        WHEN 0 THEN 28.9784
        WHEN 1 THEN 32.8597
        WHEN 2 THEN 27.1287
        WHEN 3 THEN 29.0610
        WHEN 4 THEN 30.7133
        WHEN 5 THEN 35.3213
        WHEN 6 THEN 32.4932
        ELSE 36.3313
    END,
    FALSE, NOW(), 'seed'
FROM logistics.shipments s
WHERE s.tenant_id = tid AND s.status IN (7, 9)
ORDER BY s.created_at DESC
LIMIT 40
ON CONFLICT DO NOTHING;

-- ============================================================
-- 11. INVOICE AUDITS (20)
-- ============================================================
INSERT INTO logistics.invoice_audits (id, tenant_id, shipment_id, provider_id, contract_id, invoice_number, invoice_amount, expected_amount, difference, difference_percent, currency, status, audit_notes, reviewed_at, reviewed_by, is_deleted, created_by, created_at)
SELECT
    gen_random_uuid(), tid, s.id, s.selected_provider_id,
    CASE
        WHEN s.selected_provider_id = p_yolda   THEN c_yolda2
        WHEN s.selected_provider_id = p_tirport  THEN c_tirport1
        WHEN s.selected_provider_id = p_ekol     THEN c_ekol2
        WHEN s.selected_provider_id = p_horoz    THEN c_horoz1
        WHEN s.selected_provider_id = p_surat    THEN c_surat1
        WHEN s.selected_provider_id = p_aras     THEN c_aras1
        ELSE c_yolda2
    END,
    'FTR-2026-' || LPAD((row_number() OVER (ORDER BY s.created_at))::TEXT, 5, '0'),
    -- invoice_amount: expected +/- some variation
    ROUND(s.calculated_price * (0.95 + (row_number() OVER (ORDER BY s.created_at) % 15) * 0.01), 2),
    s.calculated_price,
    -- difference
    ROUND(s.calculated_price * (0.95 + (row_number() OVER (ORDER BY s.created_at) % 15) * 0.01) - s.calculated_price, 2),
    -- difference_percent
    ROUND(((0.95 + (row_number() OVER (ORDER BY s.created_at) % 15) * 0.01) - 1) * 100, 2),
    'TRY',
    CASE (row_number() OVER (ORDER BY s.created_at)) % 5
        WHEN 0 THEN 3  -- Approved
        WHEN 1 THEN 3  -- Approved
        WHEN 2 THEN 2  -- Flagged
        WHEN 3 THEN 0  -- Pending
        ELSE 1          -- NeedsReview
    END,
    CASE (row_number() OVER (ORDER BY s.created_at)) % 5
        WHEN 0 THEN 'Fatura tutarı sözleşme fiyatlarıyla uyumlu.'
        WHEN 1 THEN 'Küçük fark tolerans limiti içinde, onaylandı.'
        WHEN 2 THEN 'Fatura tutarı beklenen tutardan yüksek, incelenmesi gerekiyor.'
        WHEN 3 THEN 'Henüz inceleme yapılmadı.'
        ELSE 'Fatura tutarı sözleşme dışında, reddedildi.'
    END,
    CASE WHEN (row_number() OVER (ORDER BY s.created_at)) % 5 IN (0, 1, 2, 4) THEN NOW() - INTERVAL '2 days' ELSE NULL END,
    CASE WHEN (row_number() OVER (ORDER BY s.created_at)) % 5 IN (0, 1, 2, 4) THEN 'admin@logicroute.com' ELSE NULL END,
    FALSE, 'seed', NOW()
FROM logistics.shipments s
WHERE s.tenant_id = tid AND s.status = 9 AND s.calculated_price > 0
ORDER BY s.created_at DESC
LIMIT 20
ON CONFLICT DO NOTHING;

-- ============================================================
-- 12. RECURRING ROUTES (3 templates)
-- ============================================================
INSERT INTO logistics.recurring_routes (id, tenant_id, name, schedule, days_of_week, is_active, source_optimization_id, last_activated_at, activation_count, is_deleted, created_at, created_by)
VALUES
    (rr01, tid, 'İstanbul Günlük Dağıtım',           'Daily',   'Monday,Tuesday,Wednesday,Thursday,Friday', TRUE, opt01, '2026-06-25 06:00+03', 120, FALSE, NOW(), 'seed'),
    (rr02, tid, 'Ankara-Konya Haftalık Sevkiyat',    'Weekly',  'Monday,Thursday',                          TRUE, opt02, '2026-06-23 07:00+03',  48, FALSE, NOW(), 'seed'),
    (rr03, tid, 'Tüm Türkiye Aylık Dağıtım',         'Monthly', NULL,                                       TRUE, opt10, '2026-06-01 05:00+03',  12, FALSE, NOW(), 'seed')
ON CONFLICT DO NOTHING;

-- rr01: İstanbul gunluk (6 stops)
INSERT INTO logistics.recurring_route_stops (id, tenant_id, recurring_route_id, stop_order, stop_type, address, lat, lng, time_window_start, time_window_end, service_time_minutes, customer_name, notes, is_deleted, created_at, created_by)
VALUES
    (gen_random_uuid(), tid, rr01, 1, 'Depot',    'Hadımköy Lojistik Merkezi',           41.1150, 28.7320, '07:00', '08:00', 30, NULL, 'Ana depo yükleme noktası', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rr01, 2, 'Delivery', 'İkitelli OSB, Başakşehir',            41.0670, 28.7960, '08:30', '10:00', 20, 'Vestel Elektronik',        'Sabah erken teslimat', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rr01, 3, 'Delivery', 'Beylikdüzü OSB',                      41.0050, 28.6280, '10:00', '12:00', 20, 'LC Waikiki Depo',          'Tekstil dağıtımı', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rr01, 4, 'Delivery', 'Tuzla Deri OSB',                      40.8180, 29.3010, '12:00', '14:00', 25, 'Ford Otosan',              'Otomotiv parçası', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rr01, 5, 'Delivery', 'Gebze OSB, Kocaeli',                  40.8020, 29.4310, '14:00', '16:00', 25, 'Arçelik Beyaz Eşya',       'Beyaz eşya dağıtımı', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rr01, 6, 'Delivery', 'Dilovası OSB, Kocaeli',               40.7830, 29.5430, '16:00', '18:00', 20, 'TOFAŞ Otomotiv',           'Son teslimat noktası', FALSE, NOW(), 'seed')
ON CONFLICT DO NOTHING;

-- rr02: Ankara-Konya haftalik (5 stops)
INSERT INTO logistics.recurring_route_stops (id, tenant_id, recurring_route_id, stop_order, stop_type, address, lat, lng, time_window_start, time_window_end, service_time_minutes, customer_name, notes, is_deleted, created_at, created_by)
VALUES
    (gen_random_uuid(), tid, rr02, 1, 'Depot',    'Ankara Sincan Lojistik Üssü',         39.9680, 32.5730, '06:00', '07:00', 30, NULL,                       'Yükleme ve kontrol', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rr02, 2, 'Pickup',   'Ostim OSB, Ankara',                   39.9770, 32.7320, '07:30', '09:00', 25, 'Türk Traktör',             'Tarım makinesi parçası', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rr02, 3, 'Delivery', 'Aksaray Sanayi Sitesi',               38.3687, 34.0210, '11:00', '13:00', 20, 'Çimsa Çimento',            'İnşaat malzemesi', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rr02, 4, 'Delivery', 'Konya 1. OSB',                        37.8746, 32.4932, '14:00', '16:00', 30, 'Bellona Mobilya',          'Mobilya teslimat', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rr02, 5, 'Delivery', 'Konya 2. OSB',                        37.9100, 32.5100, '16:00', '18:00', 25, 'Eti Gıda',                 'Gıda dağıtımı', FALSE, NOW(), 'seed')
ON CONFLICT DO NOTHING;

-- rr03: Tüm Türkiye aylik (8 stops)
INSERT INTO logistics.recurring_route_stops (id, tenant_id, recurring_route_id, stop_order, stop_type, address, lat, lng, time_window_start, time_window_end, service_time_minutes, customer_name, notes, is_deleted, created_at, created_by)
VALUES
    (gen_random_uuid(), tid, rr03, 1, 'Depot',    'İstanbul Hadımköy Ana Depo',          41.1150, 28.7320, '05:00', '06:00', 45, NULL,                       'Aylık büyük yükleme', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rr03, 2, 'Delivery', 'Ankara Sincan OSB',                   39.9680, 32.5730, '10:00', '12:00', 30, 'Teknosa Dağıtım',          'Elektronik dağıtım', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rr03, 3, 'Delivery', 'İzmir Atatürk OSB',                   38.5010, 27.0560, '09:00', '11:00', 30, 'Migros Dağıtım',           'Gıda dağıtımı', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rr03, 4, 'Delivery', 'Bursa Nilüfer OSB',                   40.1885, 29.0610, '12:00', '14:00', 25, 'Defacto Tekstil',          'Tekstil dağıtımı', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rr03, 5, 'Delivery', 'Antalya Serbest Bölge',               36.8969, 30.7133, '14:00', '16:00', 25, 'ABC Gıda A.Ş.',            'Gıda dağıtımı', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rr03, 6, 'Delivery', 'Adana Hacı Sabancı OSB',              37.0000, 35.3213, '10:00', '12:00', 25, 'Ülker Bisküvi',            'Gıda dağıtımı', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rr03, 7, 'Delivery', 'Gaziantep OSB',                       37.0662, 37.3833, '13:00', '15:00', 30, 'Banvit Tavuk',             'Soğuk zincir teslimat', FALSE, NOW(), 'seed'),
    (gen_random_uuid(), tid, rr03, 8, 'Delivery', 'Samsun Sanayi Sitesi',                41.2928, 36.3313, '08:00', '10:00', 25, 'Eti Gıda',                 'Karadeniz bölge dağıtımı', FALSE, NOW(), 'seed')
ON CONFLICT DO NOTHING;

RAISE NOTICE 'Extended seed data completed: 16 vehicles, 20 drivers, 5 notification templates, 10 optimizations, 25 routes, 80 stops, 30 delivery slots, 25 feedback, 10 return requests, 40 package scans, 20 invoice audits, 3 recurring routes';

END $$;
