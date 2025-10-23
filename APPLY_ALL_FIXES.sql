-- ============================================================================
-- PRODUCTION FIXES - RUN THIS IN SUPABASE DASHBOARD → SQL EDITOR
-- ============================================================================
-- This SQL file applies all necessary fixes for Daily Reports, Submittals, and RFIs
-- Date: 2025-10-23
-- Issue: "Organization not found" errors when creating features
-- Resolution: Add missing columns and set default project coordinates
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FIX #1: Add Location Columns to Projects Table
-- ----------------------------------------------------------------------------
-- Daily Reports require project coordinates to fetch weather data
-- These columns were missing from the production schema

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Add helpful comments
COMMENT ON COLUMN projects.latitude IS 'Project latitude for weather data fetching (daily reports)';
COMMENT ON COLUMN projects.longitude IS 'Project longitude for weather data fetching (daily reports)';
COMMENT ON COLUMN projects.location_address IS 'Human-readable project location address';

-- Add constraint to ensure both latitude and longitude are set together
ALTER TABLE projects
ADD CONSTRAINT IF NOT EXISTS check_location_coords
CHECK (
  (latitude IS NULL AND longitude IS NULL) OR
  (latitude IS NOT NULL AND longitude IS NOT NULL)
);

-- Add constraint for valid latitude range (-90 to 90)
ALTER TABLE projects
ADD CONSTRAINT IF NOT EXISTS check_latitude_range
CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));

-- Add constraint for valid longitude range (-180 to 180)
ALTER TABLE projects
ADD CONSTRAINT IF NOT EXISTS check_longitude_range
CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

-- ----------------------------------------------------------------------------
-- FIX #2: Set Default Location for Existing Projects
-- ----------------------------------------------------------------------------
-- Set default coordinates (New York City) for any projects without location
-- IMPORTANT: Update these to your actual project locations after running this!

UPDATE projects
SET
  latitude = 40.7128,
  longitude = -74.0060,
  location_address = 'New York, NY (Default - Please Update)'
WHERE latitude IS NULL;

-- ----------------------------------------------------------------------------
-- VERIFICATION QUERIES
-- ----------------------------------------------------------------------------
-- Run these to verify the fixes were applied correctly

-- Check that location columns exist and have data
SELECT
  id,
  name,
  latitude,
  longitude,
  location_address,
  status,
  created_at
FROM projects
ORDER BY created_at DESC;

-- Check project access for users
SELECT
  pa.project_id,
  p.name AS project_name,
  pa.user_id,
  pr.full_name AS user_name,
  pa.role,
  pa.created_at
FROM project_access pa
JOIN projects p ON p.id = pa.project_id
JOIN profiles pr ON pr.id = pa.user_id
WHERE pa.deleted_at IS NULL
ORDER BY pa.created_at DESC;

-- Verify RPC functions work
SELECT
  'user_org_ids' AS function_name,
  COUNT(*) AS org_count
FROM user_org_ids(auth.uid());

SELECT
  'user_project_ids' AS function_name,
  COUNT(*) AS project_count
FROM user_project_ids(auth.uid());

-- ============================================================================
-- POST-MIGRATION TASKS
-- ============================================================================
-- After running this SQL:
--
-- 1. ✅ Verify all queries returned expected results
-- 2. ✅ Update project coordinates to actual locations in the UI
-- 3. ✅ Test creating a Daily Report
-- 4. ✅ Test creating a Submittal
-- 5. ✅ Test creating an RFI
--
-- All three features should now work without "Organization not found" errors
-- ============================================================================
