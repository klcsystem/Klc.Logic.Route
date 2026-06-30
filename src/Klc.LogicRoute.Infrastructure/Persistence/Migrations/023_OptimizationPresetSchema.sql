-- ============================================================================
-- 023_OptimizationPresetSchema.sql
-- Optimization Presets — Optimizasyon Ayar Sablonlari
-- ============================================================================

-- Optimization Presets — optimizasyon preset'leri
CREATE TABLE IF NOT EXISTS logistics.optimization_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    name VARCHAR(200) NOT NULL,
    description TEXT,
    max_stops_per_route INT NOT NULL DEFAULT 25,
    max_distance_km NUMERIC(10,2) NOT NULL DEFAULT 500,
    max_duration_minutes INT NOT NULL DEFAULT 480,
    break_duration_minutes INT NOT NULL DEFAULT 30,
    break_after_minutes INT NOT NULL DEFAULT 240,
    allow_overnight BOOLEAN NOT NULL DEFAULT FALSE,
    balance_workload BOOLEAN NOT NULL DEFAULT TRUE,
    route_end_mode INT NOT NULL DEFAULT 0,        -- 0=ReturnToDepot, 1=EndAtLastStop, 2=EndAtAddress
    end_address VARCHAR(500),
    end_lat DOUBLE PRECISION,
    end_lng DOUBLE PRECISION,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_optimization_presets_tenant ON logistics.optimization_presets(tenant_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_optimization_presets_default ON logistics.optimization_presets(tenant_id, is_default) WHERE is_deleted = FALSE;
