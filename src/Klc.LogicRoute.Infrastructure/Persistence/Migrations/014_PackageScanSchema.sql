-- ============================================================================
-- 014_PackageScanSchema.sql
-- Barkod/QR Tarama — Package Scans
-- ============================================================================

CREATE TABLE IF NOT EXISTS logistics.package_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.tenants(id),
    shipment_id UUID NOT NULL REFERENCES logistics.shipments(id),
    order_id UUID REFERENCES logistics.orders(id),
    driver_id UUID NOT NULL REFERENCES logistics.drivers(id),
    barcode_value VARCHAR(500) NOT NULL,
    scan_type SMALLINT NOT NULL DEFAULT 0,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMPTZ,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_package_scans_shipment ON logistics.package_scans(shipment_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_package_scans_driver ON logistics.package_scans(driver_id);
CREATE INDEX IF NOT EXISTS idx_package_scans_barcode ON logistics.package_scans(barcode_value);
