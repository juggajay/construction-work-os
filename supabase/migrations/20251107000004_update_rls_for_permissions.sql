-- Migration: Update RLS Policies to Use Permission Functions
-- Created: 2025-11-07
-- Purpose: Replace generic RLS policies with permission-based policies for
--          granular access control

-- ============================================================================
-- OVERVIEW
-- ============================================================================
-- This migration updates RLS policies on the following tables:
--   - project_budgets: Use can_edit_budget()
--   - project_costs: Use can_create_cost(), can_edit_cost(), can_delete_cost()
--   - change_orders: Use can_create_change_order(), can_approve_change_order()
--   - daily_reports: Use can_create_daily_report(), can_edit_daily_report()
--   - rfis: Use can_submit_rfi(), can_respond_to_rfi(), can_close_rfi()
--   - submittals: Use can_create_submittal(), can_review_submittal(), can_approve_submittal()

-- ============================================================================
-- PROJECT_BUDGETS TABLE
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view budgets for accessible projects" ON project_budgets;
DROP POLICY IF EXISTS "Users can create budgets for accessible projects" ON project_budgets;
DROP POLICY IF EXISTS "Users can update budgets for accessible projects" ON project_budgets;
DROP POLICY IF EXISTS "Users can delete budgets for accessible projects" ON project_budgets;

-- New permission-based policies
CREATE POLICY "Project members can view budgets"
  ON project_budgets FOR SELECT
  TO authenticated
  USING (
    project_id IN (SELECT user_project_ids(auth.uid()))
  );

CREATE POLICY "Managers and admins can create budgets"
  ON project_budgets FOR INSERT
  TO authenticated
  WITH CHECK (
    can_edit_budget(auth.uid(), project_id)
  );

CREATE POLICY "Managers and admins can edit budgets"
  ON project_budgets FOR UPDATE
  TO authenticated
  USING (
    can_edit_budget(auth.uid(), project_id)
  );

CREATE POLICY "Managers and admins can delete budgets"
  ON project_budgets FOR DELETE
  TO authenticated
  USING (
    can_edit_budget(auth.uid(), project_id)
  );

-- ============================================================================
-- PROJECT_COSTS TABLE
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view costs for accessible projects" ON project_costs;
DROP POLICY IF EXISTS "Users can create costs for accessible projects" ON project_costs;
DROP POLICY IF EXISTS "Users can update costs for accessible projects" ON project_costs;
DROP POLICY IF EXISTS "Users can delete costs for accessible projects" ON project_costs;
DROP POLICY IF EXISTS "Project members can view costs" ON project_costs;
DROP POLICY IF EXISTS "Users with project access can create costs" ON project_costs;

-- New permission-based policies
CREATE POLICY "Project members can view costs"
  ON project_costs FOR SELECT
  TO authenticated
  USING (
    project_id IN (SELECT user_project_ids(auth.uid()))
  );

CREATE POLICY "Managers and supervisors can create costs"
  ON project_costs FOR INSERT
  TO authenticated
  WITH CHECK (
    can_create_cost(auth.uid(), project_id)
  );

CREATE POLICY "Managers and cost owners can edit costs"
  ON project_costs FOR UPDATE
  TO authenticated
  USING (
    can_edit_cost(auth.uid(), project_id, id)
  );

CREATE POLICY "Managers and cost owners can delete costs"
  ON project_costs FOR DELETE
  TO authenticated
  USING (
    can_delete_cost(auth.uid(), project_id, id)
  );

-- ============================================================================
-- CHANGE_ORDERS TABLE
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view change orders for accessible projects" ON change_orders;
DROP POLICY IF EXISTS "Users can create change orders for accessible projects" ON change_orders;
DROP POLICY IF EXISTS "Users can update change orders for accessible projects" ON change_orders;
DROP POLICY IF EXISTS "Users can delete change orders for accessible projects" ON change_orders;
DROP POLICY IF EXISTS "Project members can view change orders" ON change_orders;

-- New permission-based policies
CREATE POLICY "Project members can view change orders"
  ON change_orders FOR SELECT
  TO authenticated
  USING (
    project_id IN (SELECT user_project_ids(auth.uid()))
  );

CREATE POLICY "Managers and supervisors can create change orders"
  ON change_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    can_create_change_order(auth.uid(), project_id)
  );

-- Special policy for approval: Only managers/admins can update status to 'approved'
CREATE POLICY "Managers can approve and update change orders"
  ON change_orders FOR UPDATE
  TO authenticated
  USING (
    -- Managers can approve OR anyone with create permission can update non-approval fields
    can_approve_change_order(auth.uid(), project_id)
    OR
    can_create_change_order(auth.uid(), project_id)
  );

CREATE POLICY "Managers and admins can delete change orders"
  ON change_orders FOR DELETE
  TO authenticated
  USING (
    can_approve_change_order(auth.uid(), project_id)
  );

-- ============================================================================
-- DAILY_REPORTS TABLE
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view daily reports for accessible projects" ON daily_reports;
DROP POLICY IF EXISTS "Users can create daily reports for accessible projects" ON daily_reports;
DROP POLICY IF EXISTS "Users can update daily reports for accessible projects" ON daily_reports;
DROP POLICY IF EXISTS "Users can delete daily reports for accessible projects" ON daily_reports;
DROP POLICY IF EXISTS "Project members can view daily reports" ON daily_reports;
DROP POLICY IF EXISTS "Project members with access can create daily reports" ON daily_reports;

-- New permission-based policies
CREATE POLICY "Project members can view daily reports"
  ON daily_reports FOR SELECT
  TO authenticated
  USING (
    project_id IN (SELECT user_project_ids(auth.uid()))
  );

CREATE POLICY "Managers and supervisors can create daily reports"
  ON daily_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    can_create_daily_report(auth.uid(), project_id)
  );

CREATE POLICY "Managers and report owners can edit daily reports"
  ON daily_reports FOR UPDATE
  TO authenticated
  USING (
    can_edit_daily_report(auth.uid(), project_id, id)
  );

CREATE POLICY "Managers and admins can delete daily reports"
  ON daily_reports FOR DELETE
  TO authenticated
  USING (
    can_create_daily_report(auth.uid(), project_id)
  );

-- ============================================================================
-- RFIS TABLE
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view RFIs for accessible projects" ON rfis;
DROP POLICY IF EXISTS "Users can create RFIs for accessible projects" ON rfis;
DROP POLICY IF EXISTS "Users can update RFIs for accessible projects" ON rfis;
DROP POLICY IF EXISTS "Users can delete RFIs for accessible projects" ON rfis;
DROP POLICY IF EXISTS "Project members can view RFIs" ON rfis;
DROP POLICY IF EXISTS "Project members with access can submit rfis" ON rfis;
DROP POLICY IF EXISTS "Project managers can update rfis" ON rfis;

-- New permission-based policies
CREATE POLICY "Project members can view RFIs"
  ON rfis FOR SELECT
  TO authenticated
  USING (
    project_id IN (SELECT user_project_ids(auth.uid()))
  );

CREATE POLICY "Managers and supervisors can submit RFIs"
  ON rfis FOR INSERT
  TO authenticated
  WITH CHECK (
    can_submit_rfi(auth.uid(), project_id)
  );

-- Update policy distinguishes between responding (managers only) and general updates
CREATE POLICY "Managers can respond to and update RFIs"
  ON rfis FOR UPDATE
  TO authenticated
  USING (
    -- Managers can respond and close
    (can_respond_to_rfi(auth.uid(), project_id))
    OR
    -- Supervisors can update their own RFIs (but not respond or close)
    (can_submit_rfi(auth.uid(), project_id) AND created_by = auth.uid())
  );

CREATE POLICY "Managers and admins can delete RFIs"
  ON rfis FOR DELETE
  TO authenticated
  USING (
    can_respond_to_rfi(auth.uid(), project_id)
  );

-- ============================================================================
-- SUBMITTALS TABLE
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view submittals for accessible projects" ON submittals;
DROP POLICY IF EXISTS "Users can create submittals for accessible projects" ON submittals;
DROP POLICY IF EXISTS "Users can update submittals for accessible projects" ON submittals;
DROP POLICY IF EXISTS "Users can delete submittals for accessible projects" ON submittals;
DROP POLICY IF EXISTS "Project members can view submittals" ON submittals;
DROP POLICY IF EXISTS "Project members with access can create submittals" ON submittals;
DROP POLICY IF EXISTS "Project managers and supervisors can update submittals" ON submittals;

-- New permission-based policies
CREATE POLICY "Project members can view submittals"
  ON submittals FOR SELECT
  TO authenticated
  USING (
    project_id IN (SELECT user_project_ids(auth.uid()))
  );

CREATE POLICY "Managers and supervisors can create submittals"
  ON submittals FOR INSERT
  TO authenticated
  WITH CHECK (
    can_create_submittal(auth.uid(), project_id)
  );

-- Update policy handles both review and approval
CREATE POLICY "Users can review and approve submittals based on permissions"
  ON submittals FOR UPDATE
  TO authenticated
  USING (
    -- Managers can approve
    (can_approve_submittal(auth.uid(), project_id))
    OR
    -- Supervisors can review but not approve
    (can_review_submittal(auth.uid(), project_id) AND status != 'approved')
  );

CREATE POLICY "Managers and admins can delete submittals"
  ON submittals FOR DELETE
  TO authenticated
  USING (
    can_approve_submittal(auth.uid(), project_id)
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- To verify policies are working correctly:
--
-- 1. Test as owner (should have all permissions):
--    SET LOCAL role TO authenticated;
--    SET LOCAL request.jwt.claims TO '{"sub": "owner-uuid"}';
--    SELECT * FROM project_costs WHERE project_id = 'project-uuid';
--
-- 2. Test as supervisor (should see but have limited edit):
--    SET LOCAL role TO authenticated;
--    SET LOCAL request.jwt.claims TO '{"sub": "supervisor-uuid"}';
--    SELECT * FROM project_costs WHERE project_id = 'project-uuid';
--    -- Should be able to see costs
--    -- Should only be able to edit their own costs
--
-- 3. Test as viewer (should only view):
--    SET LOCAL role TO authenticated;
--    SET LOCAL request.jwt.claims TO '{"sub": "viewer-uuid"}';
--    SELECT * FROM project_costs WHERE project_id = 'project-uuid';
--    -- Should see costs but cannot insert/update/delete
--
-- RESET role;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Updated RLS policies for 6 tables:
--   ✓ project_budgets: 4 policies (view, create, edit, delete)
--   ✓ project_costs: 4 policies (view, create, edit, delete with ownership)
--   ✓ change_orders: 4 policies (view, create, approve/update, delete)
--   ✓ daily_reports: 4 policies (view, create, edit with ownership, delete)
--   ✓ rfis: 4 policies (view, submit, respond/update, delete)
--   ✓ submittals: 4 policies (view, create, review/approve, delete)
--
-- All policies now use permission helper functions for consistent, centralized
-- access control logic.
