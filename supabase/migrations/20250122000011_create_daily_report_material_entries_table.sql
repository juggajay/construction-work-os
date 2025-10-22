-- Migration: Create Daily Report Material Entries Table
-- Created: 2025-01-22
-- Description: Track material deliveries with supplier, quantity, and location

-- UP Migration

CREATE TABLE IF NOT EXISTS daily_report_material_entries (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key
  daily_report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,

  -- Material details
  material_description TEXT NOT NULL, -- e.g., "Concrete - 4000 PSI", "Rebar #5"
  supplier TEXT,
  quantity NUMERIC(12,2) NOT NULL,
  unit TEXT NOT NULL, -- e.g., "CY", "LF", "EA", "Tons"
  delivery_time TIME,
  delivery_ticket TEXT, -- reference number
  location TEXT, -- where stored on site
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT quantity_positive_check CHECK (quantity > 0)
);

-- Indexes

-- Primary lookup: all entries for a daily report
CREATE INDEX material_entries_report_idx
  ON daily_report_material_entries(daily_report_id);

-- Trigger for updated_at
CREATE TRIGGER material_entries_updated_at_trigger
  BEFORE UPDATE ON daily_report_material_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- DOWN Migration (Rollback)
-- DROP TRIGGER IF EXISTS material_entries_updated_at_trigger ON daily_report_material_entries;
-- DROP INDEX IF EXISTS material_entries_report_idx;
-- DROP TABLE IF EXISTS daily_report_material_entries;
