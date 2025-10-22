-- Migration: Create Daily Report Incidents Table
-- Created: 2025-01-22
-- Description: Track safety incidents, delays, inspections, and site visitors

-- UP Migration

CREATE TABLE IF NOT EXISTS daily_report_incidents (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key
  daily_report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,

  -- Incident details
  incident_type incident_type NOT NULL,
  severity incident_severity, -- nullable for non-safety incidents
  time_occurred TIME,
  description TEXT NOT NULL,
  involved_parties TEXT, -- names, companies
  corrective_action TEXT,
  reported_to TEXT, -- who was notified
  follow_up_required BOOLEAN DEFAULT FALSE,
  osha_recordable BOOLEAN DEFAULT FALSE, -- for safety incidents
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes

-- Primary lookup: all incidents for a daily report
CREATE INDEX incidents_report_idx
  ON daily_report_incidents(daily_report_id);

-- Analytics: incidents by type
CREATE INDEX incidents_type_idx
  ON daily_report_incidents(daily_report_id, incident_type);

-- OSHA compliance reporting
CREATE INDEX incidents_osha_recordable_idx
  ON daily_report_incidents(osha_recordable, created_at DESC)
  WHERE osha_recordable = TRUE;

-- Trigger for updated_at
CREATE TRIGGER incidents_updated_at_trigger
  BEFORE UPDATE ON daily_report_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- DOWN Migration (Rollback)
-- DROP TRIGGER IF EXISTS incidents_updated_at_trigger ON daily_report_incidents;
-- DROP INDEX IF EXISTS incidents_osha_recordable_idx;
-- DROP INDEX IF EXISTS incidents_type_idx;
-- DROP INDEX IF EXISTS incidents_report_idx;
-- DROP TABLE IF EXISTS daily_report_incidents;
