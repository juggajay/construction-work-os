-- Migration: Create Daily Report Crew Entries Table
-- Created: 2025-01-22
-- Description: Track crew hours by trade, classification, and subcontractor

-- UP Migration

CREATE TABLE IF NOT EXISTS daily_report_crew_entries (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  daily_report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
  subcontractor_org_id UUID REFERENCES organizations(id), -- nullable for GC crews

  -- Crew details
  trade TEXT NOT NULL, -- e.g., "Electrician", "Plumber", "General Labor"
  csi_division TEXT, -- e.g., "26 - Electrical", "22 - Plumbing"
  headcount INTEGER NOT NULL,
  hours_worked NUMERIC(8,2) NOT NULL, -- total hours for all workers
  classification TEXT, -- e.g., "Foreman", "Journeyman", "Apprentice", "Laborer"
  hourly_rate NUMERIC(10,2), -- for cost tracking (nullable)
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT headcount_positive_check CHECK (headcount > 0),
  CONSTRAINT hours_worked_non_negative_check CHECK (hours_worked >= 0)
);

-- Indexes

-- Primary lookup: all entries for a daily report
CREATE INDEX crew_entries_report_idx
  ON daily_report_crew_entries(daily_report_id);

-- Analytics: crew by trade and hours
CREATE INDEX crew_entries_trade_idx
  ON daily_report_crew_entries(daily_report_id, trade, hours_worked);

-- Subcontractor tracking
CREATE INDEX crew_entries_subcontractor_idx
  ON daily_report_crew_entries(subcontractor_org_id)
  WHERE subcontractor_org_id IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER crew_entries_updated_at_trigger
  BEFORE UPDATE ON daily_report_crew_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger to update total_crew_count on parent daily_report
CREATE OR REPLACE FUNCTION update_daily_report_crew_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate total crew count for the affected daily report
  UPDATE daily_reports
  SET total_crew_count = (
    SELECT COALESCE(SUM(headcount), 0)
    FROM daily_report_crew_entries
    WHERE daily_report_id = COALESCE(NEW.daily_report_id, OLD.daily_report_id)
  )
  WHERE id = COALESCE(NEW.daily_report_id, OLD.daily_report_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crew_entries_update_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON daily_report_crew_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_report_crew_count();

-- DOWN Migration (Rollback)
-- DROP TRIGGER IF EXISTS crew_entries_update_count_trigger ON daily_report_crew_entries;
-- DROP FUNCTION IF EXISTS update_daily_report_crew_count();
-- DROP TRIGGER IF EXISTS crew_entries_updated_at_trigger ON daily_report_crew_entries;
-- DROP INDEX IF EXISTS crew_entries_subcontractor_idx;
-- DROP INDEX IF EXISTS crew_entries_trade_idx;
-- DROP INDEX IF EXISTS crew_entries_report_idx;
-- DROP TABLE IF EXISTS daily_report_crew_entries;
