-- Migration: Create RLS Policies for Crew Entries
-- Created: 2025-01-22
-- Description: Row-level security policies for daily_report_crew_entries table

-- UP Migration

-- Enable RLS
ALTER TABLE daily_report_crew_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view crew entries in accessible reports
CREATE POLICY "Users can view crew entries in accessible reports"
  ON daily_report_crew_entries FOR SELECT
  USING (
    daily_report_id IN (
      SELECT id FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
    )
  );

-- Policy: Users can create crew entries in draft reports
CREATE POLICY "Users can create crew entries in draft reports"
  ON daily_report_crew_entries FOR INSERT
  WITH CHECK (
    daily_report_id IN (
      SELECT id FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
      AND status = 'draft'
    )
  );

-- Policy: Users can update crew entries in draft reports
CREATE POLICY "Users can update crew entries in draft reports"
  ON daily_report_crew_entries FOR UPDATE
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

-- Policy: Users can delete crew entries from draft reports
CREATE POLICY "Users can delete crew entries from draft reports"
  ON daily_report_crew_entries FOR DELETE
  USING (
    daily_report_id IN (
      SELECT id FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
      AND status = 'draft'
    )
  );

-- DOWN Migration (Rollback)
-- DROP POLICY IF EXISTS "Users can delete crew entries from draft reports" ON daily_report_crew_entries;
-- DROP POLICY IF EXISTS "Users can update crew entries in draft reports" ON daily_report_crew_entries;
-- DROP POLICY IF EXISTS "Users can create crew entries in draft reports" ON daily_report_crew_entries;
-- DROP POLICY IF EXISTS "Users can view crew entries in accessible reports" ON daily_report_crew_entries;
-- ALTER TABLE daily_report_crew_entries DISABLE ROW LEVEL SECURITY;
