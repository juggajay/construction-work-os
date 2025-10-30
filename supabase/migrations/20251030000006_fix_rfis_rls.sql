-- Fix rfis RLS policies to allow organization members
-- This addresses the issue where project creators without project_access records
-- cannot create or manage RFIs

-- First, update the is_project_manager function to include org membership fallback
CREATE OR REPLACE FUNCTION is_project_manager(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Check project_access first
    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role = 'manager'
      AND pa.deleted_at IS NULL
  ) OR EXISTS (
    -- Fallback: Check if user is org member for this project
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.deleted_at IS NULL
      AND p.deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Drop existing RFI policies
DROP POLICY IF EXISTS "Project managers can create RFIs" ON rfis;
DROP POLICY IF EXISTS "Creators and assignees can update RFIs" ON rfis;
DROP POLICY IF EXISTS "Admins can delete RFIs" ON rfis;

-- Recreate policies with organization membership fallback
CREATE POLICY "Project managers can create RFIs"
  ON rfis FOR INSERT
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

CREATE POLICY "Creators and assignees can update RFIs"
  ON rfis FOR UPDATE
  USING (
    deleted_at IS NULL
    AND (
      created_by = auth.uid() OR
      assigned_to_id = auth.uid() OR
      -- Check project_access
      project_id IN (
        SELECT project_id FROM project_access
        WHERE user_id = auth.uid()
        AND role = 'manager'
        AND deleted_at IS NULL
      ) OR
      -- Fallback: Check if user is org member for this project
      project_id IN (
        SELECT p.id FROM projects p
        INNER JOIN organization_members om ON om.org_id = p.org_id
        WHERE om.user_id = auth.uid()
        AND om.deleted_at IS NULL
        AND p.deleted_at IS NULL
      )
    )
  )
  WITH CHECK (
    created_by = auth.uid() OR
    assigned_to_id = auth.uid() OR
    -- Check project_access
    project_id IN (
      SELECT project_id FROM project_access
      WHERE user_id = auth.uid()
      AND role = 'manager'
      AND deleted_at IS NULL
    ) OR
    -- Fallback: Check if user is org member for this project
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN organization_members om ON om.org_id = p.org_id
      WHERE om.user_id = auth.uid()
      AND om.deleted_at IS NULL
      AND p.deleted_at IS NULL
    )
  );

CREATE POLICY "Admins can delete RFIs"
  ON rfis FOR DELETE
  USING (
    -- Check project_access first
    project_id IN (
      SELECT project_id FROM project_access
      WHERE user_id = auth.uid()
      AND role = 'manager'
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

-- Comments
COMMENT ON FUNCTION is_project_manager(UUID, UUID) IS
  'Checks if user is project manager via project_access OR is an organization member for the project';

COMMENT ON POLICY "Project managers can create RFIs" ON rfis IS
  'Allows users with manager/supervisor role in project_access OR organization members to create RFIs';

COMMENT ON POLICY "Creators and assignees can update RFIs" ON rfis IS
  'Allows RFI creators, assignees, project managers via project_access OR organization members to update RFIs';

COMMENT ON POLICY "Admins can delete RFIs" ON rfis IS
  'Allows users with manager role in project_access OR organization owners to delete RFIs';
