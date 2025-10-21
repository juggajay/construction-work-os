-- Initial Schema for Construction Work OS
-- This migration creates the foundational multi-tenant structure

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Organization-level roles
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member');

-- Project-level roles
CREATE TYPE project_role AS ENUM ('manager', 'supervisor', 'viewer');

-- Project status
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'archived');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT slug_length CHECK (length(slug) >= 3 AND length(slug) <= 30)
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  number TEXT,
  address TEXT,
  status project_status NOT NULL DEFAULT 'planning',
  budget DECIMAL(15, 2),
  start_date DATE,
  end_date DATE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT project_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT phone_format CHECK (phone IS NULL OR phone ~ '^\+?[1-9]\d{1,14}$')
);

-- Organization members table
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(org_id, user_id)
);

-- Project access table
CREATE TABLE project_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role project_role NOT NULL DEFAULT 'viewer',
  trade TEXT,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(project_id, user_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Organizations
CREATE INDEX idx_organizations_slug ON organizations(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_created_at ON organizations(created_at DESC);

-- Projects
CREATE INDEX idx_projects_org_id ON projects(org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_status ON projects(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_org_status ON projects(org_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_number ON projects(org_id, number) WHERE deleted_at IS NULL;

-- Organization members
CREATE INDEX idx_org_members_org_id ON organization_members(org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_members_user_id ON organization_members(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_org_members_org_user ON organization_members(org_id, user_id) WHERE deleted_at IS NULL;

-- Project access
CREATE INDEX idx_project_access_project_id ON project_access(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_access_user_id ON project_access(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_access_project_user ON project_access(project_id, user_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamps
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER project_access_updated_at
  BEFORE UPDATE ON project_access
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE organizations IS 'Organizations (construction firms) that own projects';
COMMENT ON TABLE projects IS 'Construction projects owned by organizations';
COMMENT ON TABLE profiles IS 'Extended user profile information';
COMMENT ON TABLE organization_members IS 'User membership in organizations with roles';
COMMENT ON TABLE project_access IS 'User access to specific projects with roles';

COMMENT ON COLUMN organizations.slug IS 'URL-friendly unique identifier for the organization';
COMMENT ON COLUMN organizations.settings IS 'Organization-specific settings (JSONB)';
COMMENT ON COLUMN projects.number IS 'Project number (can be auto-generated or custom)';
COMMENT ON COLUMN projects.settings IS 'Project-specific settings and custom fields (JSONB)';
COMMENT ON COLUMN project_access.trade IS 'Trade/specialty for subcontractors (e.g., electrical, HVAC)';
