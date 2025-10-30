-- Fix project_budgets RLS policies to allow organization members
-- This addresses the issue where project creators without project_access records
-- cannot create or update budget allocations

-- Drop existing policies
DROP POLICY IF EXISTS "Managers can create budgets" ON project_budgets;
DROP POLICY IF EXISTS "Managers can update budgets" ON project_budgets;
DROP POLICY IF EXISTS "Managers can delete budgets" ON project_budgets;

-- Recreate policies with organization membership fallback
CREATE POLICY "Managers can create budgets"
  ON project_budgets FOR INSERT
  WITH CHECK (
    -- Check project_access first
    project_id IN (
      SELECT project_id FROM project_access
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'supervisor')
      AND deleted_at IS NULL
    )
    OR
    -- Fallback: Check if user is org member for this project
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN organization_members om ON om.org_id = p.org_id
      WHERE om.user_id = auth.uid()
      AND om.deleted_at IS NULL
      AND p.deleted_at IS NULL
    )
  );

CREATE POLICY "Managers can update budgets"
  ON project_budgets FOR UPDATE
  USING (
    -- Check project_access first
    project_id IN (
      SELECT project_id FROM project_access
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'supervisor')
      AND deleted_at IS NULL
    )
    OR
    -- Fallback: Check if user is org member for this project
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN organization_members om ON om.org_id = p.org_id
      WHERE om.user_id = auth.uid()
      AND om.deleted_at IS NULL
      AND p.deleted_at IS NULL
    )
  );

CREATE POLICY "Managers can delete budgets"
  ON project_budgets FOR DELETE
  USING (
    -- Check project_access first
    project_id IN (
      SELECT project_id FROM project_access
      WHERE user_id = auth.uid()
      AND role IN ('manager')
      AND deleted_at IS NULL
    )
    OR
    -- Fallback: Check if user is org owner for this project
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN organization_members om ON om.org_id = p.org_id
      WHERE om.user_id = auth.uid()
      AND om.role = 'owner'
      AND om.deleted_at IS NULL
      AND p.deleted_at IS NULL
    )
  );

-- Comment
COMMENT ON POLICY "Managers can create budgets" ON project_budgets IS
  'Allows users with manager/supervisor role in project_access OR organization members to create budget allocations';

COMMENT ON POLICY "Managers can update budgets" ON project_budgets IS
  'Allows users with manager/supervisor role in project_access OR organization members to update budget allocations';

COMMENT ON POLICY "Managers can delete budgets" ON project_budgets IS
  'Allows users with manager role in project_access OR organization owners to delete budget allocations';
