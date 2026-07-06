-- ============================================================================
-- 034_ProviderTariffSchema.sql
-- Tasiyici portali: arac-tipi + KM-araligi bazli tarife tablosu.
-- Kaynak: web/src/api/providerPortal.ts -> TariffRow { kmFrom, kmTo, price }.
-- SADECE idempotent CREATE TABLE IF NOT EXISTS + index. SEED/DROP/ALTER YOK.
-- ============================================================================

CREATE TABLE IF NOT EXISTS logistics.provider_tariffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    km_from INT NOT NULL DEFAULT 0,
    km_to INT NOT NULL DEFAULT 0,
    price NUMERIC(12,3) NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_provider_tariffs_lookup
    ON logistics.provider_tariffs(tenant_id, provider_id, vehicle_type) WHERE is_deleted = FALSE;
