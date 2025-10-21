-- Row Level Security (RLS) Policies
-- This migration enables RLS and creates policies for multi-tenant data isolation

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_access ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS (SECURITY DEFINER for performance)
-- ============================================================================

-- Get all organization IDs the current user has access to
CREATE OR REPLACE FUNCTION user_org_ids(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE(org_id UUID) AS $$
  SELECT DISTINCT om.org_id
  FROM organization_members om
  WHERE om.user_id = user_uuid
    AND om.deleted_at IS NULL
    AND om.joined_at IS NOT NULL
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Get all project IDs the current user has access to (via org or direct access)
CREATE OR REPLACE FUNCTION user_project_ids(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE(project_id UUID) AS $$
  -- Projects via organization membership
  SELECT DISTINCT p.id
  FROM projects p
  INNER JOIN organization_members om ON om.org_id = p.org_id
  WHERE om.user_id = user_uuid
    AND om.deleted_at IS NULL
    AND om.joined_at IS NOT NULL
    AND p.deleted_at IS NULL

  UNION

  -- Projects via direct project access
  SELECT pa.project_id
  FROM project_access pa
  WHERE pa.user_id = user_uuid
    AND pa.deleted_at IS NULL
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user is org owner or admin
CREATE OR REPLACE FUNCTION is_org_admin(user_uuid UUID, check_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.org_id = check_org_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
      AND om.joined_at IS NOT NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user is project manager
CREATE OR REPLACE FUNCTION is_project_manager(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role = 'manager'
      AND pa.deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES: ORGANIZATIONS
-- ============================================================================

-- Users can view organizations they belong to
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    id IN (SELECT user_org_ids(auth.uid()))
    AND deleted_at IS NULL
  );

-- Org owners can update their organization
CREATE POLICY "Org owners/admins can update organization"
  ON organizations FOR UPDATE
  USING (
    is_org_admin(auth.uid(), id)
    AND deleted_at IS NULL
  );

-- Authenticated users can create organizations (becomes owner)
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only org owners can delete (soft delete)
CREATE POLICY "Org owners can delete organization"
  ON organizations FOR DELETE
  USING (
    is_org_admin(auth.uid(), id)
    AND EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.org_id = id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
  );

-- ============================================================================
-- RLS POLICIES: PROJECTS
-- ============================================================================

-- Users can view projects they have access to
CREATE POLICY "Users can view accessible projects"
  ON projects FOR SELECT
  USING (
    id IN (SELECT user_project_ids(auth.uid()))
    AND deleted_at IS NULL
  );

-- Org admins can create projects in their organization
CREATE POLICY "Org admins can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    is_org_admin(auth.uid(), org_id)
  );

-- Org admins or project managers can update projects
CREATE POLICY "Org admins and project managers can update projects"
  ON projects FOR UPDATE
  USING (
    (is_org_admin(auth.uid(), org_id) OR is_project_manager(auth.uid(), id))
    AND deleted_at IS NULL
  );

-- Org admins can delete projects
CREATE POLICY "Org admins can delete projects"
  ON projects FOR DELETE
  USING (
    is_org_admin(auth.uid(), org_id)
  );

-- ============================================================================
-- RLS POLICIES: PROFILES
-- ============================================================================

-- Users can view all profiles (for mentions, assignments, etc.)
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- RLS POLICIES: ORGANIZATION_MEMBERS
-- ============================================================================

-- Users can view members of organizations they belong to
CREATE POLICY "Users can view org members"
  ON organization_members FOR SELECT
  USING (
    org_id IN (SELECT user_org_ids(auth.uid()))
    AND deleted_at IS NULL
  );

-- Org admins can invite members
CREATE POLICY "Org admins can invite members"
  ON organization_members FOR INSERT
  WITH CHECK (
    is_org_admin(auth.uid(), org_id)
  );

-- Org admins can update member roles
CREATE POLICY "Org admins can update members"
  ON organization_members FOR UPDATE
  USING (
    is_org_admin(auth.uid(), org_id)
    AND deleted_at IS NULL
  );

-- Org admins can remove members (except owners can only be removed by other owners)
CREATE POLICY "Org admins can remove members"
  ON organization_members FOR DELETE
  USING (
    is_org_admin(auth.uid(), org_id)
    AND (
      role != 'owner'
      OR EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.org_id = organization_members.org_id
          AND om.user_id = auth.uid()
          AND om.role = 'owner'
      )
    )
  );

-- ============================================================================
-- RLS POLICIES: PROJECT_ACCESS
-- ============================================================================

-- Users can view project access for projects they can see
CREATE POLICY "Users can view project access"
  ON project_access FOR SELECT
  USING (
    project_id IN (SELECT user_project_ids(auth.uid()))
    AND deleted_at IS NULL
  );

-- Project managers can grant access
CREATE POLICY "Project managers can grant access"
  ON project_access FOR INSERT
  WITH CHECK (
    is_project_manager(auth.uid(), project_id)
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id
        AND is_org_admin(auth.uid(), p.org_id)
    )
  );

-- Project managers can update access
CREATE POLICY "Project managers can update access"
  ON project_access FOR UPDATE
  USING (
    (is_project_manager(auth.uid(), project_id)
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id
        AND is_org_admin(auth.uid(), p.org_id)
    ))
    AND deleted_at IS NULL
  );

-- Project managers can revoke access
CREATE POLICY "Project managers can revoke access"
  ON project_access FOR DELETE
  USING (
    is_project_manager(auth.uid(), project_id)
    OR EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id
        AND is_org_admin(auth.uid(), p.org_id)
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION user_org_ids IS 'Returns all organization IDs the user has access to';
COMMENT ON FUNCTION user_project_ids IS 'Returns all project IDs the user has access to (via org or direct)';
COMMENT ON FUNCTION is_org_admin IS 'Checks if user is owner or admin of an organization';
COMMENT ON FUNCTION is_project_manager IS 'Checks if user is a manager of a project';
