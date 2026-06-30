-- ============================================================================
-- 024_MessagingSchema.sql
-- Driver-Operations-Customer Messaging + Driver Breaks + Delivery Point Change
-- ============================================================================

-- Driver messages (messaging between driver, operations, customer)
CREATE TABLE IF NOT EXISTS logistics.driver_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    shipment_id UUID NOT NULL REFERENCES logistics.shipments(id),
    sender_id UUID NOT NULL,
    sender_type INT NOT NULL DEFAULT 0, -- 0=Driver, 1=Operations, 2=Customer
    message TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_driver_messages_shipment ON logistics.driver_messages(shipment_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_driver_messages_sender ON logistics.driver_messages(sender_id);

-- Driver breaks (rest, food, refueling, accident/malfunction)
CREATE TABLE IF NOT EXISTS logistics.driver_breaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    driver_id UUID NOT NULL REFERENCES logistics.drivers(id),
    shipment_id UUID REFERENCES logistics.shipments(id),
    break_type INT NOT NULL DEFAULT 0, -- 0=Rest, 1=Food, 2=Refueling, 3=AccidentOrMalfunction
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    notes TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_driver_breaks_driver ON logistics.driver_breaks(driver_id, started_at DESC);

-- Delivery point change requests (customer-initiated)
CREATE TABLE IF NOT EXISTS logistics.delivery_point_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    shipment_id UUID NOT NULL REFERENCES logistics.shipments(id),
    tracking_token VARCHAR(64) NOT NULL,
    delivery_option VARCHAR(50) NOT NULL, -- Door, Security, Neighbor, Locker, CustomAddress
    custom_address TEXT,
    customer_notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_delivery_point_changes_shipment ON logistics.delivery_point_changes(shipment_id);
CREATE INDEX IF NOT EXISTS idx_delivery_point_changes_token ON logistics.delivery_point_changes(tracking_token);
