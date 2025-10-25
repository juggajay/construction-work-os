-- =====================================================
-- FINAL FIX: Add ALL missing columns to daily_reports
-- =====================================================
-- This safely adds columns that don't exist
-- Safe to run multiple times (uses IF NOT EXISTS)
-- Does NOT rename or drop anything
-- =====================================================

-- Add missing columns that code expects
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS safety_notes TEXT,
ADD COLUMN IF NOT EXISTS delays_challenges TEXT,
ADD COLUMN IF NOT EXISTS visitors_inspections TEXT;

-- Add comments for clarity
COMMENT ON COLUMN daily_reports.safety_notes IS 'Safety observations and notes for the day';
COMMENT ON COLUMN daily_reports.delays_challenges IS 'Delays and challenges encountered during the day';
COMMENT ON COLUMN daily_reports.visitors_inspections IS 'Combined visitors and inspections information';

-- Reload schema cache (CRITICAL!)
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check that columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'daily_reports'
  AND column_name IN ('safety_notes', 'delays_challenges', 'visitors_inspections')
ORDER BY column_name;
