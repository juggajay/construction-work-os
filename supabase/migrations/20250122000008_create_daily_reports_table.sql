-- Migration: Create Daily Reports Table
-- Created: 2025-01-22
-- Description: Main daily reports table with weather data, work hours, and tracking fields

-- UP Migration

CREATE TABLE IF NOT EXISTS daily_reports (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  submitted_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),

  -- Core fields
  report_date DATE NOT NULL,
  status daily_report_status NOT NULL DEFAULT 'draft',

  -- Weather fields
  weather_condition weather_condition,
  temperature_high NUMERIC(5,2), -- °F, e.g., 98.60
  temperature_low NUMERIC(5,2), -- °F
  precipitation NUMERIC(5,2), -- inches
  wind_speed NUMERIC(5,2), -- mph
  humidity INTEGER, -- %

  -- Work hours
  work_hours_start TIME,
  work_hours_end TIME,
  total_crew_count INTEGER DEFAULT 0,

  -- Content fields
  narrative TEXT,
  delays TEXT,
  visitors TEXT,
  inspections TEXT,

  -- Tracking timestamps
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,

  -- Metadata
  custom_fields JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT temperature_range_check CHECK (
    temperature_high IS NULL OR
    temperature_low IS NULL OR
    temperature_high >= temperature_low
  ),
  CONSTRAINT humidity_range_check CHECK (
    humidity IS NULL OR
    (humidity >= 0 AND humidity <= 100)
  ),
  CONSTRAINT total_crew_count_check CHECK (total_crew_count >= 0)
);

-- Unique constraint: only one submitted/approved/archived report per project per date
CREATE UNIQUE INDEX daily_reports_project_date_unique_idx
  ON daily_reports(project_id, report_date)
  WHERE status IN ('submitted', 'approved', 'archived') AND deleted_at IS NULL;

-- Performance indexes

-- Primary queries: list reports by project, filter by date range
CREATE INDEX daily_reports_project_date_idx
  ON daily_reports(project_id, report_date DESC)
  WHERE deleted_at IS NULL;

-- Filter by status (dashboard, approval queue)
CREATE INDEX daily_reports_project_status_idx
  ON daily_reports(project_id, status, report_date DESC)
  WHERE deleted_at IS NULL;

-- Search by creator (my reports)
CREATE INDEX daily_reports_creator_idx
  ON daily_reports(created_by, report_date DESC)
  WHERE deleted_at IS NULL;

-- Weather-based queries (analytics)
CREATE INDEX daily_reports_weather_idx
  ON daily_reports(project_id, weather_condition, report_date)
  WHERE deleted_at IS NULL AND weather_condition IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER daily_reports_updated_at_trigger
  BEFORE UPDATE ON daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- DOWN Migration (Rollback)
-- DROP TRIGGER IF EXISTS daily_reports_updated_at_trigger ON daily_reports;
-- DROP INDEX IF EXISTS daily_reports_weather_idx;
-- DROP INDEX IF EXISTS daily_reports_creator_idx;
-- DROP INDEX IF EXISTS daily_reports_project_status_idx;
-- DROP INDEX IF EXISTS daily_reports_project_date_idx;
-- DROP INDEX IF EXISTS daily_reports_project_date_unique_idx;
-- DROP TABLE IF EXISTS daily_reports;
