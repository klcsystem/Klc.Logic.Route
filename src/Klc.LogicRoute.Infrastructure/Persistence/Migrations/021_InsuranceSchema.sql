-- ============================================================================
-- 021_InsuranceSchema.sql
-- Insurance Marketplace — Sigorta Pazaryeri
-- ============================================================================

-- Insurance Partners — sigorta partnerleri
CREATE TABLE IF NOT EXISTS logistics.insurance_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    name VARCHAR(300) NOT NULL,
    api_endpoint VARCHAR(500),
    api_key VARCHAR(500),
    has_api BOOLEAN NOT NULL DEFAULT FALSE,
    contact_email VARCHAR(300),
    commission_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_insurance_partners_active ON logistics.insurance_partners(is_active) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_insurance_partners_api_key ON logistics.insurance_partners(api_key) WHERE is_active = TRUE AND is_deleted = FALSE;

-- Insurance Quotes — sigorta teklifleri
CREATE TABLE IF NOT EXISTS logistics.insurance_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    shipment_id UUID NOT NULL,
    partner_id UUID NOT NULL REFERENCES logistics.insurance_partners(id),
    cargo_value NUMERIC(15,2) NOT NULL DEFAULT 0,
    risk_score NUMERIC(5,1) NOT NULL DEFAULT 0,
    premium_amount NUMERIC(12,2),
    currency VARCHAR(10) NOT NULL DEFAULT 'TRY',
    valid_until TIMESTAMPTZ,
    status INT NOT NULL DEFAULT 0,           -- 0=Pending, 1=Quoted, 2=Accepted, 3=Expired, 4=Rejected
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_insurance_quotes_shipment ON logistics.insurance_quotes(shipment_id, tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_partner ON logistics.insurance_quotes(partner_id, status) WHERE is_deleted = FALSE;

-- Insurance Policies — sigorta policeleri
CREATE TABLE IF NOT EXISTS logistics.insurance_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    quote_id UUID NOT NULL REFERENCES logistics.insurance_quotes(id),
    shipment_id UUID NOT NULL,
    partner_id UUID NOT NULL REFERENCES logistics.insurance_partners(id),
    policy_number VARCHAR(100) NOT NULL,
    premium_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    coverage_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status INT NOT NULL DEFAULT 0,           -- 0=Active, 1=Claimed, 2=Expired, 3=Cancelled
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_insurance_policies_tenant ON logistics.insurance_policies(tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_insurance_policies_shipment ON logistics.insurance_policies(shipment_id) WHERE is_deleted = FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_insurance_policies_number ON logistics.insurance_policies(policy_number);
