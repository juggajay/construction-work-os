-- Enable RLS on project_access if not already enabled
ALTER TABLE project_access ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent migration)
DROP POLICY IF EXISTS "Owners and admins can manage project team" ON project_access;
DROP POLICY IF EXISTS "Project members can view team" ON project_access;

-- Policy: Allow owners/admins to manage project teams (INSERT, UPDATE, DELETE)
CREATE POLICY "Owners and admins can manage project team"
ON project_access
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    INNER JOIN projects p ON p.org_id = om.org_id
    WHERE p.id = project_access.project_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
  )
);

-- Policy: Allow project members to view team roster (SELECT only)
CREATE POLICY "Project members can view team"
ON project_access
FOR SELECT
TO authenticated
USING (
  project_id IN (
    SELECT project_id FROM project_access
    WHERE user_id = auth.uid() AND deleted_at IS NULL
  )
);
