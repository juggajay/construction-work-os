-- Simple version for Supabase SQL Editor (no IF NOT EXISTS on constraints)

-- Step 1: Add columns (safe, won't error if exists)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Step 2: Set default location for any projects without coordinates
UPDATE projects
SET
  latitude = 40.7128,
  longitude = -74.0060,
  location_address = 'New York, NY (Default - Please Update)'
WHERE latitude IS NULL;
