-- ============================================================================
-- 002_ShipmentSchema.sql
-- Faz 2: Shipments, Cargo Details, Recommendations (Karar Motoru)
-- ============================================================================

-- Shipments (sevkiyatlar)
CREATE TABLE IF NOT EXISTS logistics.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    shipment_number VARCHAR(50) NOT NULL,
    order_id UUID REFERENCES logistics.orders(id),
    origin_address TEXT,
    origin_city VARCHAR(100),
    destination_address TEXT,
    destination_city VARCHAR(100),
    status INT NOT NULL DEFAULT 0,
    priority INT NOT NULL DEFAULT 0,
    requested_pickup_date TIMESTAMPTZ,
    requested_delivery_date TIMESTAMPTZ,
    actual_pickup_date TIMESTAMPTZ,
    actual_delivery_date TIMESTAMPTZ,
    -- Kargo Hesaplama
    total_weight_kg NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_volume_m3 NUMERIC(18,4) NOT NULL DEFAULT 0,
    total_desi_weight NUMERIC(18,2) NOT NULL DEFAULT 0,
    chargeable_weight NUMERIC(18,2) NOT NULL DEFAULT 0,
    pallet_count INT NOT NULL DEFAULT 0,
    is_hazardous BOOLEAN NOT NULL DEFAULT FALSE,
    requires_cold_chain BOOLEAN NOT NULL DEFAULT FALSE,
    temperature_min NUMERIC(5,1),
    temperature_max NUMERIC(5,1),
    is_stackable BOOLEAN NOT NULL DEFAULT TRUE,
    -- Karar Motoru Sonucu
    selected_provider_id UUID REFERENCES logistics.providers(id),
    selected_contract_rate_id UUID REFERENCES logistics.contract_rates(id),
    recommended_vehicle INT NOT NULL DEFAULT 0,
    calculated_price NUMERIC(18,2),
    currency VARCHAR(10) DEFAULT 'TRY',
    provider_reference_id VARCHAR(100),
    -- Takip
    current_latitude NUMERIC(10,6),
    current_longitude NUMERIC(10,6),
    last_tracking_update TIMESTAMPTZ,
    estimated_arrival VARCHAR(200),
    driver_name VARCHAR(200),
    driver_phone VARCHAR(20),
    vehicle_plate VARCHAR(20),
    notes TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_shipments_tenant ON logistics.shipments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shipments_number ON logistics.shipments(tenant_id, shipment_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON logistics.shipments(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_shipments_provider ON logistics.shipments(selected_provider_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON logistics.shipments(order_id);

-- Shipment Items (sevkiyat kalemleri)
CREATE TABLE IF NOT EXISTS logistics.shipment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    shipment_id UUID NOT NULL REFERENCES logistics.shipments(id) ON DELETE CASCADE,
    order_line_id UUID,
    product_code VARCHAR(50),
    product_name VARCHAR(300),
    quantity NUMERIC(18,4) NOT NULL DEFAULT 0,
    weight_kg NUMERIC(18,2) NOT NULL DEFAULT 0,
    volume_m3 NUMERIC(18,4) NOT NULL DEFAULT 0,
    width_cm NUMERIC(10,2) NOT NULL DEFAULT 0,
    height_cm NUMERIC(10,2) NOT NULL DEFAULT 0,
    depth_cm NUMERIC(10,2) NOT NULL DEFAULT 0,
    desi_weight NUMERIC(18,2) NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment ON logistics.shipment_items(shipment_id);

-- Cargo Details (kargo hesaplama sonuclari)
CREATE TABLE IF NOT EXISTS logistics.cargo_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    order_id UUID NOT NULL REFERENCES logistics.orders(id),
    actual_weight_kg NUMERIC(18,2) NOT NULL DEFAULT 0,
    volumetric_weight_kg NUMERIC(18,2) NOT NULL DEFAULT 0,
    chargeable_weight_kg NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_volume_m3 NUMERIC(18,4) NOT NULL DEFAULT 0,
    total_pallets INT NOT NULL DEFAULT 0,
    total_desi NUMERIC(18,2) NOT NULL DEFAULT 0,
    suggested_vehicle INT NOT NULL DEFAULT 0,
    suggested_load_type INT NOT NULL DEFAULT 0,
    is_hazardous BOOLEAN NOT NULL DEFAULT FALSE,
    requires_cold_chain BOOLEAN NOT NULL DEFAULT FALSE,
    calculation_notes TEXT,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cargo_details_order ON logistics.cargo_details(order_id);

-- Recommendations (karar motoru sonuclari — provider karsilastirma + scoring)
CREATE TABLE IF NOT EXISTS logistics.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    shipment_id UUID NOT NULL REFERENCES logistics.shipments(id),
    selected_provider_id UUID REFERENCES logistics.providers(id),
    selected_contract_rate_id UUID REFERENCES logistics.contract_rates(id),
    selected_provider_name VARCHAR(300),
    calculated_price NUMERIC(18,2) NOT NULL DEFAULT 0,
    -- Alternatifler
    alternative_price_1 NUMERIC(18,2),
    alternative_provider_id_1 UUID,
    alternative_provider_name_1 VARCHAR(300),
    alternative_price_2 NUMERIC(18,2),
    alternative_provider_id_2 UUID,
    alternative_provider_name_2 VARCHAR(300),
    -- Tasarruf
    savings_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    savings_percent NUMERIC(8,2) NOT NULL DEFAULT 0,
    -- Scoring
    reason INT NOT NULL DEFAULT 0,
    score_price NUMERIC(8,2) NOT NULL DEFAULT 0,
    score_speed NUMERIC(8,2) NOT NULL DEFAULT 0,
    score_reliability NUMERIC(8,2) NOT NULL DEFAULT 0,
    overall_score NUMERIC(8,2) NOT NULL DEFAULT 0,
    recommended_vehicle INT NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'TRY',
    explanation TEXT,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recommendations_shipment ON logistics.recommendations(shipment_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_provider ON logistics.recommendations(selected_provider_id);
