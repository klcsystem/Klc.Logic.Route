-- ============================================================================
-- 001_LogisticsSchema.sql
-- Faz 1: Orders, Providers, Contracts, ERP Connections
-- Anlasma motoru: firmalar zaten provider'larla anlasma yapmis.
-- Anlasma sartlari (tarife) sisteme girilir, sistem en uygun secenegi hesaplar.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS logistics;

-- Providers (lojistik saglayicilar — Yolda, Murat Lojistik vb.)
CREATE TABLE IF NOT EXISTS logistics.providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    name VARCHAR(300) NOT NULL,
    code VARCHAR(50) NOT NULL,
    type INT NOT NULL DEFAULT 1,
    api_base_url VARCHAR(1000),
    api_key VARCHAR(500),
    api_secret VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_global BOOLEAN NOT NULL DEFAULT FALSE,
    supported_vehicle_types TEXT,
    service_regions TEXT,
    tax_number VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(256),
    contact_person VARCHAR(200),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_providers_tenant ON logistics.providers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_providers_code ON logistics.providers(tenant_id, code);

-- Contracts (anlasma / sozlesme)
CREATE TABLE IF NOT EXISTS logistics.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    provider_id UUID NOT NULL REFERENCES logistics.providers(id),
    contract_number VARCHAR(50) NOT NULL,
    name VARCHAR(300),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status INT NOT NULL DEFAULT 0,
    notes TEXT,
    currency VARCHAR(10) DEFAULT 'TRY',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON logistics.contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_provider ON logistics.contracts(provider_id);

-- Contract Rates (tarife kalemi — anlasma motoru)
CREATE TABLE IF NOT EXISTS logistics.contract_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    contract_id UUID NOT NULL REFERENCES logistics.contracts(id) ON DELETE CASCADE,
    origin_region VARCHAR(100),
    destination_region VARCHAR(100),
    vehicle_category INT NOT NULL DEFAULT 0,
    min_weight_kg NUMERIC(18,2) NOT NULL DEFAULT 0,
    max_weight_kg NUMERIC(18,2) NOT NULL DEFAULT 99999,
    price_per_unit NUMERIC(18,4) NOT NULL,
    pricing_unit INT NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'TRY',
    urgent_surcharge_percent NUMERIC(5,2),
    adr_surcharge_percent NUMERIC(5,2),
    frigo_surcharge_percent NUMERIC(5,2),
    weekend_surcharge_percent NUMERIC(5,2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contract_rates_contract ON logistics.contract_rates(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_rates_route ON logistics.contract_rates(origin_region, destination_region);

-- ERP Connections (ERP baglantilari) — orders tablosundan ONCE olusturulmali (FK referansi var)
CREATE TABLE IF NOT EXISTS logistics.erp_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    name VARCHAR(200) NOT NULL,
    erp_type INT NOT NULL DEFAULT 0,
    endpoint_url VARCHAR(1000),
    username VARCHAR(200),
    password VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_sync_at TIMESTAMPTZ,
    last_sync_status VARCHAR(100),
    settings TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100),
    updated_at TIMESTAMPTZ
);

-- Orders (ERP'den gelen siparisler)
CREATE TABLE IF NOT EXISTS logistics.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    order_number VARCHAR(50) NOT NULL,
    erp_reference_id VARCHAR(100),
    erp_connection_id UUID REFERENCES logistics.erp_connections(id),
    customer_name VARCHAR(300),
    origin_address TEXT,
    origin_city VARCHAR(100),
    origin_lat DOUBLE PRECISION,
    origin_lng DOUBLE PRECISION,
    destination_address TEXT,
    destination_city VARCHAR(100),
    destination_lat DOUBLE PRECISION,
    destination_lng DOUBLE PRECISION,
    total_weight_kg NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_volume_m3 NUMERIC(18,4) NOT NULL DEFAULT 0,
    pallet_count INT NOT NULL DEFAULT 0,
    product_category VARCHAR(100),
    is_hazardous BOOLEAN NOT NULL DEFAULT FALSE,
    requires_cold_chain BOOLEAN NOT NULL DEFAULT FALSE,
    temperature_min NUMERIC(5,1),
    temperature_max NUMERIC(5,1),
    status INT NOT NULL DEFAULT 0,
    priority INT NOT NULL DEFAULT 0,
    requested_delivery_date TIMESTAMPTZ,
    total_amount NUMERIC(18,2),
    currency VARCHAR(10) DEFAULT 'TRY',
    notes TEXT,
    contract_id UUID REFERENCES logistics.contracts(id),
    provider_id UUID REFERENCES logistics.providers(id),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100),
    updated_at TIMESTAMPTZ
);

-- Order Lines (siparis kalemleri — boyut/desi bilgileri)
CREATE TABLE IF NOT EXISTS logistics.order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    order_id UUID NOT NULL REFERENCES logistics.orders(id) ON DELETE CASCADE,
    line_number INT NOT NULL,
    product_code VARCHAR(50),
    product_name VARCHAR(300),
    quantity NUMERIC(18,4) NOT NULL DEFAULT 0,
    unit VARCHAR(20),
    weight_kg NUMERIC(18,2) NOT NULL DEFAULT 0,
    volume_m3 NUMERIC(18,4) NOT NULL DEFAULT 0,
    width_cm NUMERIC(10,2) NOT NULL DEFAULT 0,
    height_cm NUMERIC(10,2) NOT NULL DEFAULT 0,
    depth_cm NUMERIC(10,2) NOT NULL DEFAULT 0,
    desi_weight NUMERIC(18,2) NOT NULL DEFAULT 0,
    is_stackable BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100),
    updated_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON logistics.orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON logistics.orders(tenant_id, order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON logistics.orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_provider ON logistics.orders(provider_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_order ON logistics.order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_erp_connections_tenant ON logistics.erp_connections(tenant_id);
