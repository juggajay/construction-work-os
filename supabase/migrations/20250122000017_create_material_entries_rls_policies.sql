-- Migration: Create RLS Policies for Material Entries
-- Created: 2025-01-22
-- Description: Row-level security policies for daily_report_material_entries table

-- UP Migration

-- Enable RLS
ALTER TABLE daily_report_material_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view material entries in accessible reports
CREATE POLICY "Users can view material entries in accessible reports"
  ON daily_report_material_entries FOR SELECT
  USING (
    daily_report_id IN (
      SELECT id FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
    )
  );

-- Policy: Users can create material entries in draft reports
CREATE POLICY "Users can create material entries in draft reports"
  ON daily_report_material_entries FOR INSERT
  WITH CHECK (
    daily_report_id IN (
      SELECT id FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
      AND status = 'draft'
    )
  );

-- Policy: Users can update material entries in draft reports
CREATE POLICY "Users can update material entries in draft reports"
  ON daily_report_material_entries FOR UPDATE
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

-- Policy: Users can delete material entries from draft reports
CREATE POLICY "Users can delete material entries from draft reports"
  ON daily_report_material_entries FOR DELETE
  USING (
    daily_report_id IN (
      SELECT id FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
      AND status = 'draft'
    )
  );

-- DOWN Migration (Rollback)
-- DROP POLICY IF EXISTS "Users can delete material entries from draft reports" ON daily_report_material_entries;
-- DROP POLICY IF EXISTS "Users can update material entries in draft reports" ON daily_report_material_entries;
-- DROP POLICY IF EXISTS "Users can create material entries in draft reports" ON daily_report_material_entries;
-- DROP POLICY IF EXISTS "Users can view material entries in accessible reports" ON daily_report_material_entries;
-- ALTER TABLE daily_report_material_entries DISABLE ROW LEVEL SECURITY;
