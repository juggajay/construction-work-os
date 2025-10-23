-- Add location fields to projects table for daily reports weather integration
-- Daily reports require project coordinates to fetch weather data

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Add comment
COMMENT ON COLUMN projects.latitude IS 'Project latitude for weather data fetching (daily reports)';
COMMENT ON COLUMN projects.longitude IS 'Project longitude for weather data fetching (daily reports)';
COMMENT ON COLUMN projects.location_address IS 'Human-readable project location address';

-- Add constraint to ensure both latitude and longitude are set together or both null
ALTER TABLE projects
ADD CONSTRAINT check_location_coords
CHECK (
  (latitude IS NULL AND longitude IS NULL) OR
  (latitude IS NOT NULL AND longitude IS NOT NULL)
);

-- Add constraint for valid latitude range
ALTER TABLE projects
ADD CONSTRAINT check_latitude_range
CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));

-- Add constraint for valid longitude range
ALTER TABLE projects
ADD CONSTRAINT check_longitude_range
CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));
