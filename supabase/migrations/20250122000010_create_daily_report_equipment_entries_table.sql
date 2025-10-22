-- Migration: Create Daily Report Equipment Entries Table
-- Created: 2025-01-22
-- Description: Track equipment usage, hours, fuel consumption, and rental costs

-- UP Migration

CREATE TABLE IF NOT EXISTS daily_report_equipment_entries (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key
  daily_report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,

  -- Equipment details
  equipment_type TEXT NOT NULL, -- e.g., "Excavator", "Crane", "Forklift", "Generator"
  equipment_id TEXT, -- internal ID or asset number
  operator_name TEXT,
  hours_used NUMERIC(8,2) NOT NULL,
  fuel_consumed NUMERIC(8,2), -- gallons (nullable)
  rental_cost NUMERIC(10,2), -- $ per day (nullable)
  notes TEXT, -- condition, issues, maintenance

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT hours_used_positive_check CHECK (hours_used > 0),
  CONSTRAINT fuel_consumed_non_negative_check CHECK (fuel_consumed IS NULL OR fuel_consumed >= 0),
  CONSTRAINT rental_cost_non_negative_check CHECK (rental_cost IS NULL OR rental_cost >= 0)
);

-- Indexes

-- Primary lookup: all entries for a daily report
CREATE INDEX equipment_entries_report_idx
  ON daily_report_equipment_entries(daily_report_id);

-- Analytics: equipment by type and hours
CREATE INDEX equipment_entries_type_idx
  ON daily_report_equipment_entries(daily_report_id, equipment_type, hours_used);

-- Trigger for updated_at
CREATE TRIGGER equipment_entries_updated_at_trigger
  BEFORE UPDATE ON daily_report_equipment_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- DOWN Migration (Rollback)
-- DROP TRIGGER IF EXISTS equipment_entries_updated_at_trigger ON daily_report_equipment_entries;
-- DROP INDEX IF EXISTS equipment_entries_type_idx;
-- DROP INDEX IF EXISTS equipment_entries_report_idx;
-- DROP TABLE IF EXISTS daily_report_equipment_entries;
