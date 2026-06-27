-- ============================================================================
-- 017_ReturnSchema.sql
-- Return/Reverse Logistics — Iade yonetimi
-- ============================================================================

CREATE TABLE IF NOT EXISTS logistics.return_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    original_shipment_id UUID,
    order_id UUID,
    reason VARCHAR(50) NOT NULL DEFAULT 'Other',          -- Damaged, WrongItem, Refused, Other
    status VARCHAR(50) NOT NULL DEFAULT 'Requested',      -- Requested, PickupScheduled, InTransit, Received, Processed
    pickup_address TEXT,
    pickup_lat DOUBLE PRECISION NOT NULL DEFAULT 0,
    pickup_lng DOUBLE PRECISION NOT NULL DEFAULT 0,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pickup_date TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    notes TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_return_requests_tenant ON logistics.return_requests(tenant_id, status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_return_requests_shipment ON logistics.return_requests(original_shipment_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_return_requests_order ON logistics.return_requests(order_id) WHERE is_deleted = FALSE;
