-- ============================================================================
-- 012_SimulationSchema.sql
-- Faz 5: Digital Twin — Simulation Scenarios & Results
-- ============================================================================

-- Simulation scenarios
CREATE TABLE IF NOT EXISTS logistics.simulation_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    base_snapshot JSONB,
    modifications JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_sim_scenarios_tenant ON logistics.simulation_scenarios(tenant_id, status);

-- Simulation results
CREATE TABLE IF NOT EXISTS logistics.simulation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    scenario_id UUID NOT NULL REFERENCES logistics.simulation_scenarios(id),
    total_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_distance_km DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_duration_hours DOUBLE PRECISION NOT NULL DEFAULT 0,
    vehicle_utilization_pct DOUBLE PRECISION NOT NULL DEFAULT 0,
    on_time_prediction_pct DOUBLE PRECISION NOT NULL DEFAULT 0,
    co2_total_kg DOUBLE PRECISION NOT NULL DEFAULT 0,
    unserved_shipments INT NOT NULL DEFAULT 0,
    cost_delta_pct DOUBLE PRECISION NOT NULL DEFAULT 0,
    details JSONB,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_sim_results_scenario ON logistics.simulation_results(scenario_id);
