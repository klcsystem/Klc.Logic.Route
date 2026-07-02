-- ============================================================================
-- 029_LocationSchema.sql
-- Lokasyon/Depo Yonetimi
-- ============================================================================

CREATE TABLE IF NOT EXISTS logistics.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50),
    location_type INT NOT NULL DEFAULT 0,
    address TEXT,
    city VARCHAR(100),
    district VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    capacity INT,
    working_hours VARCHAR(500),
    contact_name VARCHAR(200),
    contact_phone VARCHAR(50),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_locations_tenant ON logistics.locations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON logistics.locations(tenant_id, location_type);
CREATE INDEX IF NOT EXISTS idx_locations_code ON logistics.locations(tenant_id, code);
