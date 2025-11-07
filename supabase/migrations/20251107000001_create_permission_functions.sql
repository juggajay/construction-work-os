-- Migration: Create Permission Helper Functions
-- Created: 2025-11-07
-- Purpose: Add 17 permission check functions for role-based access control

-- ============================================================================
-- PERMISSION HELPER FUNCTIONS
-- ============================================================================
-- These functions check if a user has permission to perform specific actions
-- on projects and project resources. All functions use SECURITY DEFINER for
-- proper privilege handling and check both org-level and project-level roles.

-- ============================================================================
-- BUDGET PERMISSIONS
-- ============================================================================

-- Check if user can edit project budgets
CREATE OR REPLACE FUNCTION can_edit_budget(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Org owners/admins can edit any project budget
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
      AND om.joined_at IS NOT NULL

    UNION

    -- Project managers can edit their project budgets
    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role = 'manager'
      AND pa.deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- COST PERMISSIONS
-- ============================================================================

-- Check if user can create costs
CREATE OR REPLACE FUNCTION can_create_cost(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Org owners/admins can create costs
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
      AND om.joined_at IS NOT NULL

    UNION

    -- Project managers and supervisors can create costs
    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role IN ('manager', 'supervisor')
      AND pa.deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user can edit a specific cost (includes ownership check for supervisors)
CREATE OR REPLACE FUNCTION can_edit_cost(user_uuid UUID, check_project_id UUID, cost_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Org owners/admins can edit any cost
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
      AND om.joined_at IS NOT NULL

    UNION

    -- Project managers can edit any cost on their project
    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role = 'manager'
      AND pa.deleted_at IS NULL

    UNION

    -- Supervisors can only edit their own costs
    SELECT 1
    FROM project_access pa
    INNER JOIN project_costs pc ON pc.id = cost_id
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role = 'supervisor'
      AND pa.deleted_at IS NULL
      AND pc.created_by = user_uuid  -- Ownership check
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user can delete a specific cost (includes ownership check for supervisors)
CREATE OR REPLACE FUNCTION can_delete_cost(user_uuid UUID, check_project_id UUID, cost_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Org owners/admins can delete any cost
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
      AND om.joined_at IS NOT NULL

    UNION

    -- Project managers can delete any cost on their project
    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role = 'manager'
      AND pa.deleted_at IS NULL

    UNION

    -- Supervisors can only delete their own costs
    SELECT 1
    FROM project_access pa
    INNER JOIN project_costs pc ON pc.id = cost_id
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role = 'supervisor'
      AND pa.deleted_at IS NULL
      AND pc.created_by = user_uuid  -- Ownership check
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- CHANGE ORDER PERMISSIONS
-- ============================================================================

-- Check if user can create change orders
CREATE OR REPLACE FUNCTION can_create_change_order(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Org owners/admins can create change orders
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
      AND om.joined_at IS NOT NULL

    UNION

    -- Project managers and supervisors can create change orders
    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role IN ('manager', 'supervisor')
      AND pa.deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user can approve change orders
CREATE OR REPLACE FUNCTION can_approve_change_order(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Only org owners/admins and project managers can approve
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
      AND om.joined_at IS NOT NULL

    UNION

    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role = 'manager'
      AND pa.deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- DAILY REPORT PERMISSIONS
-- ============================================================================

-- Check if user can create daily reports
CREATE OR REPLACE FUNCTION can_create_daily_report(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Org owners/admins can create daily reports
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
      AND om.joined_at IS NOT NULL

    UNION

    -- Project managers and supervisors can create daily reports
    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role IN ('manager', 'supervisor')
      AND pa.deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user can edit a specific daily report (includes ownership check)
CREATE OR REPLACE FUNCTION can_edit_daily_report(user_uuid UUID, check_project_id UUID, report_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Org owners/admins can edit any daily report
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
      AND om.joined_at IS NOT NULL

    UNION

    -- Project managers can edit any daily report on their project
    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role = 'manager'
      AND pa.deleted_at IS NULL

    UNION

    -- Supervisors can only edit their own daily reports
    SELECT 1
    FROM project_access pa
    INNER JOIN daily_reports dr ON dr.id = report_id
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role = 'supervisor'
      AND pa.deleted_at IS NULL
      AND dr.created_by = user_uuid  -- Ownership check
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- RFI PERMISSIONS
-- ============================================================================

-- Check if user can submit RFIs
CREATE OR REPLACE FUNCTION can_submit_rfi(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Org owners/admins can submit RFIs
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
      AND om.joined_at IS NOT NULL

    UNION

    -- Project managers and supervisors can submit RFIs
    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role IN ('manager', 'supervisor')
      AND pa.deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user can respond to RFIs
CREATE OR REPLACE FUNCTION can_respond_to_rfi(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Only org owners/admins and project managers can respond to RFIs
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
      AND om.joined_at IS NOT NULL

    UNION

    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role = 'manager'
      AND pa.deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user can close RFIs
CREATE OR REPLACE FUNCTION can_close_rfi(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Only org owners/admins and project managers can close RFIs
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
      AND om.joined_at IS NOT NULL

    UNION

    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role = 'manager'
      AND pa.deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- SUBMITTAL PERMISSIONS
-- ============================================================================

-- Check if user can create submittals
CREATE OR REPLACE FUNCTION can_create_submittal(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Org owners/admins can create submittals
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
      AND om.joined_at IS NOT NULL

    UNION

    -- Project managers and supervisors can create submittals
    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role IN ('manager', 'supervisor')
      AND pa.deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user can review submittals
CREATE OR REPLACE FUNCTION can_review_submittal(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Org owners/admins can review submittals
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
      AND om.joined_at IS NOT NULL

    UNION

    -- Project managers and supervisors can review submittals
    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role IN ('manager', 'supervisor')
      AND pa.deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user can approve submittals
CREATE OR REPLACE FUNCTION can_approve_submittal(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Only org owners/admins and project managers can approve submittals
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
      AND om.joined_at IS NOT NULL

    UNION

    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role = 'manager'
      AND pa.deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- TEAM MANAGEMENT PERMISSIONS
-- ============================================================================

-- Check if user can manage project team
CREATE OR REPLACE FUNCTION can_manage_team(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Only org owners/admins can manage project teams
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
      AND om.joined_at IS NOT NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- PROJECT MANAGEMENT PERMISSIONS
-- ============================================================================

-- Check if user can edit project details
CREATE OR REPLACE FUNCTION can_edit_project(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Org owners/admins can edit any project
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
      AND om.joined_at IS NOT NULL

    UNION

    -- Project managers can edit their project
    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role = 'manager'
      AND pa.deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user can delete projects
CREATE OR REPLACE FUNCTION can_delete_project(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Only org owners/admins can delete projects
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
      AND om.joined_at IS NOT NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Created 17 permission check functions:
--   Budget: can_edit_budget
--   Costs: can_create_cost, can_edit_cost, can_delete_cost
--   Change Orders: can_create_change_order, can_approve_change_order
--   Daily Reports: can_create_daily_report, can_edit_daily_report
--   RFIs: can_submit_rfi, can_respond_to_rfi, can_close_rfi
--   Submittals: can_create_submittal, can_review_submittal, can_approve_submittal
--   Team: can_manage_team
--   Projects: can_edit_project, can_delete_project
