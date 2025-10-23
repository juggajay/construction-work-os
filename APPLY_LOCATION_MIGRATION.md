# Apply Project Location Migration

## Issue
The `projects` table is missing `latitude`, `longitude`, and `location_address` columns which are required for Daily Reports to fetch weather data automatically.

## Solution
Run the following SQL in your Supabase Dashboard → SQL Editor:

### Step 1: Add Location Columns

```sql
-- Add location fields to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Add comments
COMMENT ON COLUMN projects.latitude IS 'Project latitude for weather data fetching (daily reports)';
COMMENT ON COLUMN projects.longitude IS 'Project longitude for weather data fetching (daily reports)';
COMMENT ON COLUMN projects.location_address IS 'Human-readable project location address';

-- Add constraints
ALTER TABLE projects
ADD CONSTRAINT check_location_coords
CHECK (
  (latitude IS NULL AND longitude IS NULL) OR
  (latitude IS NOT NULL AND longitude IS NOT NULL)
);

ALTER TABLE projects
ADD CONSTRAINT check_latitude_range
CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));

ALTER TABLE projects
ADD CONSTRAINT check_longitude_range
CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));
```

### Step 2: Set Default Location for Existing Projects

```sql
-- Set default location for projects without coordinates
-- Using NYC as default (40.7128, -74.0060)
UPDATE projects
SET
  latitude = 40.7128,
  longitude = -74.0060,
  location_address = 'New York, NY (Default - Please Update)'
WHERE latitude IS NULL;
```

## Verification

After running the above SQL, verify the migration worked:

```sql
SELECT id, name, latitude, longitude, location_address
FROM projects
LIMIT 5;
```

All projects should now have coordinates set.

## Important
Remember to update the default NYC coordinates to your actual project locations in the project settings!
