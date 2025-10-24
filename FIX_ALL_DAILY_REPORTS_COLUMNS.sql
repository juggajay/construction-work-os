-- =====================================================
-- COMPREHENSIVE FIX: All daily_reports Schema Mismatches
-- =====================================================
-- This migration fixes ALL schema mismatches between the
-- code expectations and the database schema.
--
-- Generated: 2025-10-25
-- =====================================================

-- MISMATCH #1: Add missing 'safety_notes' column
-- CODE: expects 'safety_notes' (create-daily-report.ts line 146)
-- DB: column does not exist
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS safety_notes TEXT;

COMMENT ON COLUMN daily_reports.safety_notes IS 'Safety observations and notes for the day';

-- MISMATCH #2: Rename 'delays' to 'delays_challenges'
-- CODE: expects 'delays_challenges' (create-daily-report.ts line 145)
-- DB: has 'delays'
ALTER TABLE daily_reports
RENAME COLUMN delays TO delays_challenges;

COMMENT ON COLUMN daily_reports.delays_challenges IS 'Delays and challenges encountered during the day';

-- MISMATCH #3: Add 'visitors_inspections' column
-- CODE: expects 'visitors_inspections' (create-daily-report.ts line 147)
-- DB: has separate 'visitors' and 'inspections' columns
-- SOLUTION: Add new column, migrate data, keep old columns for backward compatibility
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS visitors_inspections TEXT;

COMMENT ON COLUMN daily_reports.visitors_inspections IS 'Combined visitors and inspections information';

-- Migrate existing data from visitors and inspections to visitors_inspections
-- This ensures no data loss
UPDATE daily_reports
SET visitors_inspections = CONCAT_WS(
  E'\n\n',
  CASE WHEN visitors IS NOT NULL AND visitors != '' THEN CONCAT('Visitors: ', visitors) END,
  CASE WHEN inspections IS NOT NULL AND inspections != '' THEN CONCAT('Inspections: ', inspections) END
)
WHERE visitors IS NOT NULL OR inspections IS NOT NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify the fix worked:

-- 1. Check all columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'daily_reports'
  AND column_name IN (
    'narrative',
    'delays_challenges',
    'safety_notes',
    'visitors_inspections',
    'visitors',
    'inspections',
    'weather_condition',
    'temperature_high',
    'temperature_low',
    'precipitation',
    'wind_speed',
    'humidity',
    'work_hours_start',
    'work_hours_end',
    'total_crew_count'
  )
ORDER BY column_name;

-- 2. Verify data migration for visitors_inspections
SELECT
  id,
  visitors,
  inspections,
  visitors_inspections,
  report_date
FROM daily_reports
WHERE visitors IS NOT NULL OR inspections IS NOT NULL
LIMIT 5;

-- 3. Check for any NULL values that might cause issues
SELECT
  COUNT(*) as total_reports,
  COUNT(narrative) as has_narrative,
  COUNT(delays_challenges) as has_delays_challenges,
  COUNT(safety_notes) as has_safety_notes,
  COUNT(visitors_inspections) as has_visitors_inspections
FROM daily_reports;

-- =====================================================
-- RELOAD SCHEMA CACHE
-- =====================================================
-- This is CRITICAL - it forces PostgREST to reload the schema
-- and recognize the new columns immediately
NOTIFY pgrst, 'reload schema';
