-- ============================================================================
-- 013_RecurringRouteSchema.sql
-- Tekrarlayan Rotalar (Recurring Routes) — Sablon bazli rota tekrari
-- ============================================================================

-- Recurring route templates
CREATE TABLE IF NOT EXISTS logistics.recurring_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    name VARCHAR(200) NOT NULL,
    schedule VARCHAR(50) NOT NULL DEFAULT 'Daily',  -- Daily, Weekly, Monthly
    days_of_week VARCHAR(200),                       -- "Monday,Wednesday,Friday"
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    source_optimization_id UUID,                     -- optional link to original optimization
    last_activated_at TIMESTAMPTZ,
    activation_count INT NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_recurring_routes_tenant ON logistics.recurring_routes(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_routes_schedule ON logistics.recurring_routes(tenant_id, schedule) WHERE is_deleted = FALSE;

-- Recurring route template stops
CREATE TABLE IF NOT EXISTS logistics.recurring_route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    recurring_route_id UUID NOT NULL REFERENCES logistics.recurring_routes(id),
    stop_order INT NOT NULL DEFAULT 0,
    stop_type VARCHAR(50) NOT NULL DEFAULT 'Delivery',
    address TEXT,
    lat DOUBLE PRECISION NOT NULL DEFAULT 0,
    lng DOUBLE PRECISION NOT NULL DEFAULT 0,
    time_window_start VARCHAR(10),   -- HH:mm format (time-of-day template)
    time_window_end VARCHAR(10),     -- HH:mm format
    service_time_minutes INT NOT NULL DEFAULT 0,
    customer_name VARCHAR(200),
    notes TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_recurring_route_stops_route ON logistics.recurring_route_stops(recurring_route_id);
