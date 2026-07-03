-- ============================================================================
-- 033_ReconcileSchema.sql
-- RECONCILE / SELF-HEAL — sadece idempotent CREATE TABLE IF NOT EXISTS.
--
-- Amac: Uzun-omurlu (persistent) bir DB'de, onceki bir migration patlayip
-- initializer durdugu icin HIC uygulanmamis olabilecek tablolarin eksigini
-- guvenle tamamlamak. Prod'da 500 veren endpoint'lerin bagli oldugu tablolar:
--   logistics.invoices / logistics.invoice_lines  (kaynak: 025_InvoiceSchema.sql)
--   logistics.locations                           (kaynak: 029_LocationSchema.sql)
--   logistics.vehicles / logistics.drivers        (kaynak: 005_FleetSchema.sql)
--
-- DDL orijinal migration'lardan BIREBIR kopyalanmistir (sema tipatip uysun).
-- SADECE CREATE TABLE IF NOT EXISTS + index. SEED/INSERT YOK, DROP YOK, ALTER YOK.
-- Tablolar zaten varsa bu dosya no-op'tur (IF NOT EXISTS).
--
-- NOT: Bu dosya tip-drift (mevcut ama yanlis tipli kolon) sorununu COZMEZ;
-- onun icin ayri ALTER'lar gerekir ve prod semasi teshis edilince eklenecektir.
-- ============================================================================

-- --- Invoices (kaynak: 025_InvoiceSchema.sql, birebir) ---------------------
CREATE TABLE IF NOT EXISTS logistics.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    invoice_number VARCHAR(100) NOT NULL,
    customer_id UUID,
    customer_name VARCHAR(300),
    period_month INT NOT NULL,
    period_year INT NOT NULL,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'TRY',
    status VARCHAR(20) NOT NULL DEFAULT 'Draft',    -- Draft, Sent, Paid
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON logistics.invoices(tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoices_status ON logistics.invoices(status, tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoices_period ON logistics.invoices(period_year, period_month, tenant_id) WHERE is_deleted = FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_number ON logistics.invoices(invoice_number);

-- --- Invoice Lines (kaynak: 025_InvoiceSchema.sql, birebir) -----------------
CREATE TABLE IF NOT EXISTS logistics.invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    invoice_id UUID NOT NULL REFERENCES logistics.invoices(id) ON DELETE CASCADE,
    shipment_id UUID,
    description TEXT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON logistics.invoice_lines(invoice_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_invoice_lines_shipment ON logistics.invoice_lines(shipment_id) WHERE is_deleted = FALSE;

-- --- Locations (kaynak: 029_LocationSchema.sql, birebir) --------------------
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

-- --- Vehicles (kaynak: 005_FleetSchema.sql, birebir) -----------------------
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

-- --- Drivers (kaynak: 005_FleetSchema.sql, birebir) ------------------------
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
