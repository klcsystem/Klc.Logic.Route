-- ============================================================================
-- 003_DashboardSchema.sql
-- Faz 3: Notifications, Carrier Performance, Dashboard support
-- ============================================================================

-- Notifications (bildirimler)
CREATE TABLE IF NOT EXISTS logistics.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    user_id UUID,
    title VARCHAR(300) NOT NULL,
    message TEXT NOT NULL,
    type INT NOT NULL DEFAULT 0,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_user ON logistics.notifications(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON logistics.notifications(tenant_id, user_id, is_read);

-- Carrier Performance (tasiyici performans puanlama)
CREATE TABLE IF NOT EXISTS logistics.carrier_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    provider_id UUID NOT NULL REFERENCES logistics.providers(id),
    provider_name VARCHAR(300),
    period INT NOT NULL DEFAULT 0,
    year INT NOT NULL,
    month INT NOT NULL,
    total_shipments INT NOT NULL DEFAULT 0,
    on_time_deliveries INT NOT NULL DEFAULT 0,
    late_deliveries INT NOT NULL DEFAULT 0,
    damaged_shipments INT NOT NULL DEFAULT 0,
    cancelled_shipments INT NOT NULL DEFAULT 0,
    on_time_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    average_delivery_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
    average_cost_per_kg NUMERIC(10,4) NOT NULL DEFAULT 0,
    co2_total_kg NUMERIC(18,2) NOT NULL DEFAULT 0,
    overall_score NUMERIC(5,2) NOT NULL DEFAULT 0,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    UNIQUE(tenant_id, provider_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_carrier_performance_tenant ON logistics.carrier_performance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_carrier_performance_provider ON logistics.carrier_performance(provider_id);
CREATE INDEX IF NOT EXISTS idx_carrier_performance_period ON logistics.carrier_performance(tenant_id, year, month);
