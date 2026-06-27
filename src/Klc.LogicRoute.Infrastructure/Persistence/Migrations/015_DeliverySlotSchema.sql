-- ============================================================================
-- 015_DeliverySlotSchema.sql
-- Teslimat Slot Yonetimi — Musteri Zaman Penceresi Secimi
-- ============================================================================

CREATE TABLE IF NOT EXISTS logistics.delivery_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    order_id UUID REFERENCES logistics.orders(id),
    shipment_id UUID REFERENCES logistics.shipments(id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    customer_name VARCHAR(200),
    customer_phone VARCHAR(50),
    zip_code VARCHAR(20),
    status SMALLINT NOT NULL DEFAULT 0,
    reserved_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_delivery_slots_date_zip ON logistics.delivery_slots(date, zip_code, status);
CREATE INDEX IF NOT EXISTS idx_delivery_slots_order ON logistics.delivery_slots(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_slots_shipment ON logistics.delivery_slots(shipment_id);
