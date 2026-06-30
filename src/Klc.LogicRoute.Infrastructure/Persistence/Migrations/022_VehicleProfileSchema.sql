-- ============================================================================
-- 022_VehicleProfileSchema.sql
-- Vehicle Profile Templates — Arac Profil Sablonlari
-- ============================================================================

-- Vehicle Profiles — arac profilleri
CREATE TABLE IF NOT EXISTS logistics.vehicle_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    name VARCHAR(200) NOT NULL,
    description TEXT,
    max_weight_kg NUMERIC(12,2) NOT NULL DEFAULT 0,
    max_volume_m3 NUMERIC(10,2) NOT NULL DEFAULT 0,
    max_height_m DOUBLE PRECISION NOT NULL DEFAULT 0,
    max_width_m DOUBLE PRECISION NOT NULL DEFAULT 0,
    max_length_m DOUBLE PRECISION NOT NULL DEFAULT 0,
    is_hazmat BOOLEAN NOT NULL DEFAULT FALSE,
    is_frigorifik BOOLEAN NOT NULL DEFAULT FALSE,
    avoid_tolls BOOLEAN NOT NULL DEFAULT FALSE,
    avoid_ferries BOOLEAN NOT NULL DEFAULT FALSE,
    cost_per_km NUMERIC(10,2) NOT NULL DEFAULT 0,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_tenant ON logistics.vehicle_profiles(tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_vehicle_profiles_default ON logistics.vehicle_profiles(tenant_id, is_default) WHERE is_deleted = FALSE;

-- Add profile_id FK column to vehicles table
ALTER TABLE logistics.vehicles ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES logistics.vehicle_profiles(id);
CREATE INDEX IF NOT EXISTS idx_vehicles_profile ON logistics.vehicles(profile_id) WHERE profile_id IS NOT NULL;
