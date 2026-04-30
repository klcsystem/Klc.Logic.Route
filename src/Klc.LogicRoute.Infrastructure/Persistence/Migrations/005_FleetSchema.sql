-- Fleet Management: Vehicles + Drivers + Provider IntegrationMode + ContractRate distance
DO $$ BEGIN

-- Vehicles table
CREATE TABLE IF NOT EXISTS logistics.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    plate_number VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL DEFAULT 'Kamyon',
    body_type VARCHAR(50),
    tonnage DECIMAL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    insurance_expiry TIMESTAMPTZ,
    current_driver_id UUID,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_vehicles_tenant ON logistics.vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_provider ON logistics.vehicles(provider_id);

-- Drivers table
CREATE TABLE IF NOT EXISTS logistics.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    phone VARCHAR(30),
    license_number VARCHAR(50),
    license_expiry TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_drivers_tenant ON logistics.drivers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_drivers_provider ON logistics.drivers(provider_id);

-- Provider integration_mode column
ALTER TABLE logistics.providers ADD COLUMN IF NOT EXISTS integration_mode VARCHAR(20) NOT NULL DEFAULT 'Managed';

-- ContractRate distance columns (km kademe bazlı fiyatlandırma)
ALTER TABLE logistics.contract_rates ADD COLUMN IF NOT EXISTS min_distance_km DECIMAL;
ALTER TABLE logistics.contract_rates ADD COLUMN IF NOT EXISTS max_distance_km DECIMAL;

END $$;
