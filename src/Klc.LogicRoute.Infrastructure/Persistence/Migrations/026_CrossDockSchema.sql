-- ============================================================================
-- 026_CrossDockSchema.sql
-- Cross-Docking Support — transfer goods between vehicles at hub points
-- ============================================================================

CREATE TABLE IF NOT EXISTS logistics.cross_dock_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    hub_name VARCHAR(200) NOT NULL,
    hub_lat DOUBLE PRECISION NOT NULL DEFAULT 0,
    hub_lng DOUBLE PRECISION NOT NULL DEFAULT 0,
    inbound_vehicle_id UUID NOT NULL,
    outbound_vehicle_id UUID NOT NULL,
    transfer_date TIMESTAMPTZ NOT NULL,
    status INT NOT NULL DEFAULT 0, -- 0=Planned, 1=InProgress, 2=Completed, 3=Cancelled
    items JSONB, -- array of shipment IDs
    notes TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_cross_dock_tenant ON logistics.cross_dock_operations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cross_dock_hub ON logistics.cross_dock_operations(hub_name, tenant_id);
CREATE INDEX IF NOT EXISTS idx_cross_dock_transfer_date ON logistics.cross_dock_operations(transfer_date DESC);
CREATE INDEX IF NOT EXISTS idx_cross_dock_status ON logistics.cross_dock_operations(status);
