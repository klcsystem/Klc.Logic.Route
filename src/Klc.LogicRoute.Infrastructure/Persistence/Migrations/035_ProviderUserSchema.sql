-- ============================================================================
-- 035_ProviderUserSchema.sql
-- Tasiyici portali: saglayiciya bagli portal kullanicilari.
-- Kaynak: web/src/api/providerPortal.ts -> PortalUser { name, email, role, active }.
-- Roller portal-ozgu (ProviderAdmin/ProviderDriver/ProviderDispatcher) oldugu icin
-- auth.users reuse edilmedi; ayri hafif tablo kullanilir.
-- SADECE idempotent CREATE TABLE IF NOT EXISTS + index. SEED/DROP/ALTER YOK.
-- ============================================================================

CREATE TABLE IF NOT EXISTS logistics.provider_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ProviderDriver',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_provider_users_lookup
    ON logistics.provider_users(tenant_id, provider_id) WHERE is_deleted = FALSE;
