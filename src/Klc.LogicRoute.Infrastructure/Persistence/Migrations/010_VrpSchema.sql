-- ============================================================================
-- 010_VrpSchema.sql
-- Faz 3: VRP/TSP Route Optimization
-- ============================================================================

-- Route optimization results
CREATE TABLE IF NOT EXISTS logistics.route_optimization_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    name VARCHAR(200) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    total_distance_km DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_duration_minutes DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
    vehicle_count INT NOT NULL DEFAULT 0,
    stop_count INT NOT NULL DEFAULT 0,
    solver_type VARCHAR(50) NOT NULL DEFAULT 'NearestNeighbor',
    solve_time_ms BIGINT NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

-- Optimized routes (one per vehicle)
CREATE TABLE IF NOT EXISTS logistics.optimized_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    optimization_id UUID NOT NULL REFERENCES logistics.route_optimization_results(id),
    vehicle_id UUID,
    vehicle_plate VARCHAR(20),
    sequence_order INT NOT NULL DEFAULT 0,
    total_distance_km DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_duration_minutes DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_weight_kg NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_volume_m3 NUMERIC(18,4) NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_optimized_routes_opt_id ON logistics.optimized_routes(optimization_id);

-- Route stops
CREATE TABLE IF NOT EXISTS logistics.route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    route_id UUID NOT NULL REFERENCES logistics.optimized_routes(id),
    shipment_id UUID REFERENCES logistics.shipments(id),
    stop_order INT NOT NULL DEFAULT 0,
    stop_type VARCHAR(20) NOT NULL DEFAULT 'Delivery',
    address TEXT,
    lat DOUBLE PRECISION NOT NULL DEFAULT 0,
    lng DOUBLE PRECISION NOT NULL DEFAULT 0,
    arrival_time TIMESTAMPTZ,
    departure_time TIMESTAMPTZ,
    time_window_start TIMESTAMPTZ,
    time_window_end TIMESTAMPTZ,
    service_time_minutes INT NOT NULL DEFAULT 15,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_route_stops_route_id ON logistics.route_stops(route_id);
