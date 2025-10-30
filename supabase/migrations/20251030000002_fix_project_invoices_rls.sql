-- Fix project_invoices RLS policies to allow organization members
-- This addresses the issue where project creators without project_access records
-- cannot upload or manage invoices

-- Drop existing policies
DROP POLICY IF EXISTS "Managers can upload invoices" ON project_invoices;
DROP POLICY IF EXISTS "Managers can update invoices" ON project_invoices;
DROP POLICY IF EXISTS "Managers can delete invoices" ON project_invoices;

-- Recreate policies with organization membership fallback
CREATE POLICY "Managers can upload invoices"
  ON project_invoices FOR INSERT
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

CREATE POLICY "Managers can update invoices"
  ON project_invoices FOR UPDATE
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

CREATE POLICY "Managers can delete invoices"
  ON project_invoices FOR DELETE
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
COMMENT ON POLICY "Managers can upload invoices" ON project_invoices IS
  'Allows users with manager/supervisor role in project_access OR organization members to upload invoices';

COMMENT ON POLICY "Managers can update invoices" ON project_invoices IS
  'Allows users with manager/supervisor role in project_access OR organization members to update invoices';

COMMENT ON POLICY "Managers can delete invoices" ON project_invoices IS
  'Allows users with manager role in project_access OR organization owners to delete invoices';
