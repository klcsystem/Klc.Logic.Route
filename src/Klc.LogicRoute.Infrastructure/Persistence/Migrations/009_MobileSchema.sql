-- ============================================================================
-- 009_MobileSchema.sql
-- Faz 2: Sürücü Mobil App - Driver Locations, Proof of Delivery
-- ============================================================================

-- Driver location tracking (GPS batch records)
CREATE TABLE IF NOT EXISTS logistics.driver_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    driver_id UUID NOT NULL REFERENCES logistics.drivers(id),
    shipment_id UUID REFERENCES logistics.shipments(id),
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    accuracy DOUBLE PRECISION,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_driver_locations_driver ON logistics.driver_locations(driver_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_locations_shipment ON logistics.driver_locations(shipment_id);

-- Proof of delivery
CREATE TABLE IF NOT EXISTS logistics.proof_of_delivery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    shipment_id UUID NOT NULL REFERENCES logistics.shipments(id),
    photo_path TEXT,
    signature_path TEXT,
    recipient_name VARCHAR(200),
    notes TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_pod_shipment ON logistics.proof_of_delivery(shipment_id);

-- Add user_id and device_token to drivers (for mobile login association)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='logistics' AND table_name='drivers' AND column_name='user_id') THEN
        ALTER TABLE logistics.drivers ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='logistics' AND table_name='drivers' AND column_name='device_token') THEN
        ALTER TABLE logistics.drivers ADD COLUMN device_token VARCHAR(500);
    END IF;
END $$;
