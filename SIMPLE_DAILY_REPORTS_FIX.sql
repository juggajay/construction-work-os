-- =====================================================
-- SIMPLE FIX: Add ALL missing columns to daily_reports
-- =====================================================
-- This safely adds columns without renaming anything
-- Safe to run multiple times (uses IF NOT EXISTS)
-- =====================================================

-- Add missing columns that code expects
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS safety_notes TEXT,
ADD COLUMN IF NOT EXISTS delays_challenges TEXT,
ADD COLUMN IF NOT EXISTS visitors_inspections TEXT;

-- Add comments for clarity
COMMENT ON COLUMN daily_reports.safety_notes IS 'Safety observations and notes';
COMMENT ON COLUMN daily_reports.delays_challenges IS 'Delays and challenges encountered';
COMMENT ON COLUMN daily_reports.visitors_inspections IS 'Visitors and inspections information';

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
