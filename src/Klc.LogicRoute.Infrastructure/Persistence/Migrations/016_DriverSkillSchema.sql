-- ============================================================================
-- 016_DriverSkillSchema.sql
-- Driver Skill Matching & Workload Balancing — Surucu yetenek eslestirme
-- ============================================================================

-- Add skill and workload columns to drivers table
ALTER TABLE logistics.drivers ADD COLUMN IF NOT EXISTS skills VARCHAR(500);
ALTER TABLE logistics.drivers ADD COLUMN IF NOT EXISTS certifications VARCHAR(500);
ALTER TABLE logistics.drivers ADD COLUMN IF NOT EXISTS max_working_hours DECIMAL(5,2) NOT NULL DEFAULT 10;
ALTER TABLE logistics.drivers ADD COLUMN IF NOT EXISTS preferred_zones VARCHAR(500);

-- Index for certification-based lookups
CREATE INDEX IF NOT EXISTS idx_drivers_certifications ON logistics.drivers(certifications) WHERE is_deleted = FALSE AND is_active = TRUE;
