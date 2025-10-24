-- ============================================================================
-- COMPLETE FIX FOR ALL PRODUCTION ISSUES
-- ============================================================================
-- Run this entire file in Supabase Dashboard → SQL Editor
-- After running, restart your Next.js app (Vercel will auto-deploy)
-- ============================================================================

-- Fix 1: Add location columns to projects table
-- Required for: Daily Reports weather feature
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Set default coordinates (NYC) for existing projects
UPDATE projects
SET
  latitude = 40.7128,
  longitude = -74.0060,
  location_address = 'New York, NY (Default - Please Update)'
WHERE latitude IS NULL;

-- Fix 2: Rename delays column to match code expectations
-- The code expects 'delays_challenges' but DB has 'delays'
ALTER TABLE daily_reports
RENAME COLUMN delays TO delays_challenges;

-- Fix 3: Reload PostgREST schema cache
-- This forces Supabase to recognize the column changes
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify projects table has location columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'projects'
  AND column_name IN ('latitude', 'longitude', 'location_address')
ORDER BY column_name;

-- Verify daily_reports table has delays_challenges column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'daily_reports'
  AND column_name IN ('delays', 'delays_challenges')
ORDER BY column_name;

-- Check your projects have coordinates
SELECT id, name, latitude, longitude, location_address
FROM projects
ORDER BY created_at DESC;

-- ============================================================================
-- POST-FIX INSTRUCTIONS
-- ============================================================================
-- After running this SQL:
--
-- 1. ✅ Wait 10-30 seconds for schema cache to reload
-- 2. ✅ Refresh your browser (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
-- 3. ✅ Try creating a Daily Report
-- 4. ✅ If still getting cache errors, restart your Vercel deployment:
--    - Go to Vercel dashboard
--    - Trigger a new deployment (or just push a commit to trigger redeploy)
--
-- The schema cache error happens because Supabase's API layer caches the
-- table structure. NOTIFY pgrst should reload it, but sometimes you need
-- to wait or restart your app.
-- ============================================================================
