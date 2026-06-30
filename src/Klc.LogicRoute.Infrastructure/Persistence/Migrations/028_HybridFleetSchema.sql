-- ============================================================================
-- 028_HybridFleetSchema.sql
-- Hybrid Fleet / 3P Carrier Network — third-party carrier integration
-- ============================================================================

CREATE TABLE IF NOT EXISTS logistics.carrier_networks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    carrier_name VARCHAR(200) NOT NULL,
    api_endpoint VARCHAR(500),
    api_key VARCHAR(500),
    supported_regions JSONB, -- ["Istanbul", "Ankara", "Izmir"]
    vehicle_types JSONB, -- ["Van", "Truck", "Refrigerated"]
    pricing_model INT NOT NULL DEFAULT 1, -- 0=PerKg, 1=PerKm, 2=Flat
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_carrier_networks_tenant ON logistics.carrier_networks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_carrier_networks_active ON logistics.carrier_networks(tenant_id, is_active)
    WHERE is_active = TRUE AND is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_carrier_networks_name ON logistics.carrier_networks(carrier_name);
