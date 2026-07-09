-- ============================================================
-- 037_ReconcileShipmentSchema
-- Prod'daki logistics.shipments tablosu ESKI sema ile olusmus
-- (pickup_/delivery_/current_location_/desi_weight adlari).
-- Kod (ShipmentRepository INSERT/UPDATE) ise origin_/destination_/
-- current_latitude/total_desi_weight bekliyor -> tum shipment YAZMA
-- yollari prod'da patliyordu ("column origin_address does not exist").
-- SELECT * kullanildigi icin okuma sessizce null map'liyordu.
--
-- Cozum: eksik kolonlari EKLE (additive, dusuk risk), eski kolonlardan
-- veriyi tasi. Eski kolonlar birakiliyor (SELECT * onlari yok sayar).
-- Idempotent: her acilista guvenle tekrar calisir.
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'logistics' AND table_name = 'shipments') THEN

        -- Kodun bekledigi eksik kolonlar
        ALTER TABLE logistics.shipments ADD COLUMN IF NOT EXISTS origin_address TEXT;
        ALTER TABLE logistics.shipments ADD COLUMN IF NOT EXISTS origin_city VARCHAR(100);
        ALTER TABLE logistics.shipments ADD COLUMN IF NOT EXISTS destination_address TEXT;
        ALTER TABLE logistics.shipments ADD COLUMN IF NOT EXISTS destination_city VARCHAR(100);
        ALTER TABLE logistics.shipments ADD COLUMN IF NOT EXISTS total_desi_weight NUMERIC(18,2) NOT NULL DEFAULT 0;
        ALTER TABLE logistics.shipments ADD COLUMN IF NOT EXISTS is_stackable BOOLEAN NOT NULL DEFAULT TRUE;
        ALTER TABLE logistics.shipments ADD COLUMN IF NOT EXISTS selected_provider_id UUID;
        ALTER TABLE logistics.shipments ADD COLUMN IF NOT EXISTS recommended_vehicle INT NOT NULL DEFAULT 0;
        ALTER TABLE logistics.shipments ADD COLUMN IF NOT EXISTS current_latitude NUMERIC(10,6);
        ALTER TABLE logistics.shipments ADD COLUMN IF NOT EXISTS current_longitude NUMERIC(10,6);
        ALTER TABLE logistics.shipments ADD COLUMN IF NOT EXISTS last_tracking_update TIMESTAMPTZ;

        -- Eski adres kolonlarindan veriyi tasi (varsa)
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='logistics' AND table_name='shipments' AND column_name='pickup_address') THEN
            UPDATE logistics.shipments
               SET origin_address      = COALESCE(origin_address, pickup_address),
                   origin_city         = COALESCE(origin_city, pickup_city),
                   destination_address = COALESCE(destination_address, delivery_address),
                   destination_city    = COALESCE(destination_city, delivery_city);
        END IF;

        -- Eski konum kolonlarindan veriyi tasi (double precision -> numeric)
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='logistics' AND table_name='shipments' AND column_name='current_location_lat') THEN
            UPDATE logistics.shipments
               SET current_latitude    = COALESCE(current_latitude, current_location_lat::NUMERIC(10,6)),
                   current_longitude   = COALESCE(current_longitude, current_location_lng::NUMERIC(10,6)),
                   last_tracking_update = COALESCE(last_tracking_update, last_location_update);
        END IF;

        -- Eski desi kolonundan tasi
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='logistics' AND table_name='shipments' AND column_name='desi_weight') THEN
            UPDATE logistics.shipments
               SET total_desi_weight = CASE WHEN total_desi_weight = 0 THEN COALESCE(desi_weight, 0) ELSE total_desi_weight END;
        END IF;

        -- TIP KAYMASI: prod estimated_arrival timestamptz olarak olusmus ama kod string (VARCHAR) bekliyor
        -- ("column estimated_arrival is of type timestamp but expression is of type text"). VARCHAR'a cevir.
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema='logistics' AND table_name='shipments'
                     AND column_name='estimated_arrival' AND data_type='timestamp with time zone') THEN
            ALTER TABLE logistics.shipments
                ALTER COLUMN estimated_arrival TYPE VARCHAR(200) USING estimated_arrival::TEXT;
        END IF;

    END IF;
END $$;
