-- Migration: Create RLS Policies for Equipment Entries
-- Created: 2025-01-22
-- Description: Row-level security policies for daily_report_equipment_entries table

-- UP Migration

-- Enable RLS
ALTER TABLE daily_report_equipment_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view equipment entries in accessible reports
CREATE POLICY "Users can view equipment entries in accessible reports"
  ON daily_report_equipment_entries FOR SELECT
  USING (
    daily_report_id IN (
      SELECT id FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
    )
  );

-- Policy: Users can create equipment entries in draft reports
CREATE POLICY "Users can create equipment entries in draft reports"
  ON daily_report_equipment_entries FOR INSERT
  WITH CHECK (
    daily_report_id IN (
      SELECT id FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
      AND status = 'draft'
    )
  );

-- Policy: Users can update equipment entries in draft reports
CREATE POLICY "Users can update equipment entries in draft reports"
  ON daily_report_equipment_entries FOR UPDATE
  USING (
    daily_report_id IN (
      SELECT id FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
      AND status = 'draft'
    )
  )
  WITH CHECK (
    daily_report_id IN (
      SELECT id FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
      AND status = 'draft'
    )
  );

-- Policy: Users can delete equipment entries from draft reports
CREATE POLICY "Users can delete equipment entries from draft reports"
  ON daily_report_equipment_entries FOR DELETE
  USING (
    daily_report_id IN (
      SELECT id FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
      AND status = 'draft'
    )
  );

-- DOWN Migration (Rollback)
-- DROP POLICY IF EXISTS "Users can delete equipment entries from draft reports" ON daily_report_equipment_entries;
-- DROP POLICY IF EXISTS "Users can update equipment entries in draft reports" ON daily_report_equipment_entries;
-- DROP POLICY IF EXISTS "Users can create equipment entries in draft reports" ON daily_report_equipment_entries;
-- DROP POLICY IF EXISTS "Users can view equipment entries in accessible reports" ON daily_report_equipment_entries;
-- ALTER TABLE daily_report_equipment_entries DISABLE ROW LEVEL SECURITY;
