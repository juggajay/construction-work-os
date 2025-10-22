-- Migration: Create RLS Policies for Incidents
-- Created: 2025-01-22
-- Description: Row-level security policies for daily_report_incidents table

-- UP Migration

-- Enable RLS
ALTER TABLE daily_report_incidents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view incidents in accessible reports
CREATE POLICY "Users can view incidents in accessible reports"
  ON daily_report_incidents FOR SELECT
  USING (
    daily_report_id IN (
      SELECT id FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
    )
  );

-- Policy: Users can create incidents in draft reports
CREATE POLICY "Users can create incidents in draft reports"
  ON daily_report_incidents FOR INSERT
  WITH CHECK (
    daily_report_id IN (
      SELECT id FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
      AND status = 'draft'
    )
  );

-- Policy: Users can update incidents in draft reports
CREATE POLICY "Users can update incidents in draft reports"
  ON daily_report_incidents FOR UPDATE
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

-- Policy: Users can delete incidents from draft reports
CREATE POLICY "Users can delete incidents from draft reports"
  ON daily_report_incidents FOR DELETE
  USING (
    daily_report_id IN (
      SELECT id FROM daily_reports
      WHERE project_id IN (SELECT user_project_ids(auth.uid()))
      AND status = 'draft'
    )
  );

-- DOWN Migration (Rollback)
-- DROP POLICY IF EXISTS "Users can delete incidents from draft reports" ON daily_report_incidents;
-- DROP POLICY IF EXISTS "Users can update incidents in draft reports" ON daily_report_incidents;
-- DROP POLICY IF EXISTS "Users can create incidents in draft reports" ON daily_report_incidents;
-- DROP POLICY IF EXISTS "Users can view incidents in accessible reports" ON daily_report_incidents;
-- ALTER TABLE daily_report_incidents DISABLE ROW LEVEL SECURITY;
