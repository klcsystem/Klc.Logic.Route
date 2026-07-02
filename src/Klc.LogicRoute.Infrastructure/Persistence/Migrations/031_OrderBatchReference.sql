-- 031: AutoBatchJob'in kullandigi batch_reference kolonu (Order.BatchReference entity'de vardi, DB'de eksikti)
ALTER TABLE logistics.orders ADD COLUMN IF NOT EXISTS batch_reference VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_orders_batch_reference ON logistics.orders(tenant_id, batch_reference);
