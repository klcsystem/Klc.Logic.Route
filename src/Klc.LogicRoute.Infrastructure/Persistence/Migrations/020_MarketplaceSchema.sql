-- ============================================================================
-- 020_MarketplaceSchema.sql
-- Collaborative Logistics — Capacity Marketplace
-- ============================================================================

-- Capacity Listings — bos kapasite ilanlari
CREATE TABLE IF NOT EXISTS logistics.capacity_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    origin_city VARCHAR(200) NOT NULL,
    destination_city VARCHAR(200) NOT NULL,
    available_date DATE NOT NULL,
    available_weight_kg NUMERIC(12,2) NOT NULL DEFAULT 0,
    available_volume_m3 NUMERIC(10,2) NOT NULL DEFAULT 0,
    vehicle_type VARCHAR(100) NOT NULL DEFAULT '',
    price_per_kg NUMERIC(10,4) NOT NULL DEFAULT 0,
    status INT NOT NULL DEFAULT 0,          -- 0=Available, 1=Matched, 2=Expired, 3=Cancelled
    contact_phone VARCHAR(50),
    notes TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_capacity_listings_status ON logistics.capacity_listings(status, available_date) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_capacity_listings_tenant ON logistics.capacity_listings(tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_capacity_listings_route ON logistics.capacity_listings(origin_city, destination_city, available_date) WHERE is_deleted = FALSE AND status = 0;

-- Capacity Matches — eslesmeler
CREATE TABLE IF NOT EXISTS logistics.capacity_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    listing_id UUID NOT NULL REFERENCES logistics.capacity_listings(id),
    requesting_tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    requested_weight_kg NUMERIC(12,2) NOT NULL DEFAULT 0,
    match_status INT NOT NULL DEFAULT 0,    -- 0=Pending, 1=Accepted, 2=Rejected
    agreed_price NUMERIC(12,2),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_capacity_matches_listing ON logistics.capacity_matches(listing_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_capacity_matches_requesting ON logistics.capacity_matches(requesting_tenant_id) WHERE is_deleted = FALSE;
