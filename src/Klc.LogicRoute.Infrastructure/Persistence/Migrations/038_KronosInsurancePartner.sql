-- ============================================================
-- 038_KronosInsurancePartner
-- Kronos Brokerlik = API'siz sigorta partneri (yazilimcilari yok).
-- Entegrasyon yerine LogicRoute icindeki BROKER PORTALINDAN giris yapar:
-- api_key = erisim kodu (login), has_api = FALSE.
-- Idempotent: isim bazli WHERE NOT EXISTS ile tekrar calisir.
-- ============================================================
INSERT INTO logistics.insurance_partners
    (id, tenant_id, name, api_endpoint, api_key, has_api, contact_email, commission_percent, is_active, is_deleted, created_at, created_by)
SELECT
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    'Kronos Brokerlik',
    NULL,
    'KRONOS-2026-DEMO',
    FALSE,
    'gizem@kronosbrokerlik.com',
    5.00,
    TRUE,
    FALSE,
    NOW(),
    'seed-038'
WHERE NOT EXISTS (
    SELECT 1 FROM logistics.insurance_partners
    WHERE name = 'Kronos Brokerlik'
      AND tenant_id = '00000000-0000-0000-0000-000000000001'
      AND is_deleted = FALSE
);
