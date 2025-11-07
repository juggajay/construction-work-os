# Spec: Role-Based Project Visibility

## Overview
Modify the project visibility system to ensure that non-admin users only see projects they're explicitly assigned to, rather than all projects in their organization.

## MODIFIED Requirements

### Requirement: RBV-001 - Project Visibility by Role
**Priority:** HIGH | **Status:** Modified

Organization members see projects based on their role:
- **Owners and admins**: See ALL projects in the organization
- **Regular members**: Only see projects they're assigned to via `project_access`

**Current Behavior:**
All organization members see all projects in the organization.

**New Behavior:**
Regular members (non-owner/admin) only see projects where they have an entry in the `project_access` table.

#### Scenario: Owner views all organization projects
**Given** Alice is an owner of "Acme Construction"
**And** there are 10 projects in the organization
**And** Alice is only assigned to 2 of those projects
**When** Alice navigates to the projects list
**Then** she sees all 10 projects
**And** she can click into any project to view details

#### Scenario: Project manager only sees assigned projects
**Given** Bob is a regular member (not owner/admin) of "Acme Construction"
**And** Bob is assigned as manager to "Project A" via project_access
**And** Bob is assigned as manager to "Project B" via project_access
**And** there are 8 other projects in the organization
**When** Bob navigates to the projects list
**Then** he sees only 2 projects: "Project A" and "Project B"
**And** he cannot access other projects even if he has their URLs

#### Scenario: Supervisor sees multiple assigned projects
**Given** Carol is a regular member of "Acme Construction"
**And** Carol is assigned as supervisor to "Project X", "Project Y", and "Project Z"
**And** there are 5 other projects in the organization
**When** Carol navigates to the projects list
**Then** she sees only 3 projects: "Project X", "Project Y", and "Project Z"
**And** the projects are sorted alphabetically

#### Scenario: Unassigned member sees no projects
**Given** Dan is a regular member of "Acme Construction"
**And** Dan has no entries in the project_access table
**When** Dan navigates to the projects list
**Then** he sees an empty state message "You are not assigned to any projects"
**And** he sees a message to contact the administrator

#### Scenario: Admin views all projects despite no project_access entries
**Given** Eve is an admin of "Acme Construction"
**And** Eve has no entries in the project_access table
**And** there are 5 projects in the organization
**When** Eve navigates to the projects list
**Then** she sees all 5 projects
**Because** admins have organization-wide visibility

#### Scenario: Attempting to access unassigned project returns 403
**Given** Bob is a regular member assigned only to "Project A"
**And** "Project B" exists in the same organization
**When** Bob attempts to navigate to `/projects/project-b-id`
**Then** he receives a 403 Forbidden error
**And** he sees a message "You don't have access to this project"

---

### Requirement: RBV-002 - user_project_ids() Function Update
**Priority:** HIGH | **Status:** Modified

The `user_project_ids()` helper function must return project IDs based on role-based visibility rules.

#### Scenario: Function returns all projects for owners
**Given** a user is an owner of an organization
**And** the organization has 10 projects
**When** `user_project_ids(user_id)` is called
**Then** it returns 10 project IDs
**And** includes projects where the user has no project_access entry

#### Scenario: Function returns assigned projects for regular members
**Given** a user is a regular member (not owner/admin)
**And** the user is assigned to 3 projects via project_access
**And** the organization has 10 total projects
**When** `user_project_ids(user_id)` is called
**Then** it returns 3 project IDs
**And** includes only projects with project_access entries

#### Scenario: Function uses role check from organization_members
**Given** a user's role in organization_members is 'admin'
**When** `user_project_ids(user_id)` is called
**Then** the function checks organization_members.role IN ('owner', 'admin')
**And** returns all organization projects if true

#### Scenario: Function performance with large datasets
**Given** an organization has 1,000 projects
**And** a user is assigned to 50 projects
**When** `user_project_ids(user_id)` is called
**Then** it completes in less than 100ms
**And** uses indexed queries on organization_members and project_access

---

### Requirement: RBV-003 - RLS Policy Updates
**Priority:** HIGH | **Status:** Modified

Row-level security policies on the `projects` table must enforce role-based visibility.

#### Scenario: RLS allows owners to SELECT all projects
**Given** a user is an owner of an organization
**And** a SELECT query is executed on the projects table
**When** Postgres evaluates the RLS policy
**Then** the policy allows rows for all projects in the organization
**And** uses the updated user_project_ids() function

#### Scenario: RLS restricts regular members to assigned projects
**Given** a user is a regular member assigned to Project A only
**And** a SELECT query is executed on the projects table
**When** Postgres evaluates the RLS policy
**Then** the policy only allows rows for Project A
**And** blocks rows for other organization projects

#### Scenario: RLS prevents unassigned project access
**Given** a user is a regular member with no project assignments
**And** a SELECT query attempts to fetch Project B
**When** Postgres evaluates the RLS policy
**Then** the policy returns zero rows
**And** the application receives no data for Project B

---

## ADDED Requirements

### Requirement: RBV-004 - Project List Filtering
**Priority:** MEDIUM | **Status:** Added

Project list queries automatically filter based on user visibility.

#### Scenario: Projects list shows filtered results
**Given** Bob is a regular member assigned to 2 projects
**And** the org has 10 total projects
**When** Bob loads the projects list page
**Then** the query returns only 2 projects
**And** no client-side filtering is required
**Because** RLS handles filtering at the database level

#### Scenario: Project count badge shows visible projects only
**Given** Carol is assigned to 3 projects
**And** the organization has 15 total projects
**When** Carol views the dashboard
**Then** the "Projects" count badge shows "3"
**And** not the total organization count of 15

---

### Requirement: RBV-005 - Migration Path
**Priority:** HIGH | **Status:** Added

Existing users must transition smoothly to role-based visibility without losing access.

#### Scenario: Migration assigns all members to all projects initially
**Given** the system is being upgraded to role-based visibility
**And** user Bob is a regular member in the organization
**And** Bob previously could see all 10 projects
**When** the migration runs
**Then** Bob receives project_access entries for all 10 projects
**And** his role is set to 'viewer' by default
**And** admins/owners get 'manager' role by default

#### Scenario: Owners can remove unnecessary access post-migration
**Given** the migration has completed
**And** Bob was assigned to all 10 projects
**And** Bob actually only works on 2 projects
**When** an owner removes Bob from the other 8 projects
**Then** Bob's visibility is restricted to 2 projects
**And** Bob can no longer see or access the other 8 projects

---

### Requirement: RBV-006 - Empty State Handling
**Priority:** MEDIUM | **Status:** Added

Users with no project assignments see helpful empty states.

#### Scenario: Unassigned member sees empty state
**Given** Alice is a new member with no project assignments
**When** Alice navigates to the projects list
**Then** she sees an empty state illustration
**And** sees the message "You are not assigned to any projects yet"
**And** sees a suggestion "Contact your administrator to request project access"

#### Scenario: Empty state does not appear for owners/admins
**Given** Bob is an owner with no project_access entries
**And** the organization has no projects yet
**When** Bob navigates to the projects list
**Then** he sees the standard empty state "No projects found"
**And** sees a "Create Project" button
**Because** owners can create projects

---

## Implementation Notes

### Database Changes

**File:** `supabase/migrations/YYYYMMDD_update_user_project_ids_function.sql`

```sql
-- Drop and recreate the function with new logic
CREATE OR REPLACE FUNCTION user_project_ids(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE(project_id UUID) AS $$
  -- Owners and admins see ALL org projects
  SELECT DISTINCT p.id
  FROM projects p
  INNER JOIN organization_members om ON om.org_id = p.org_id
  WHERE om.user_id = user_uuid
    AND om.role IN ('owner', 'admin')  -- KEY CHANGE
    AND om.deleted_at IS NULL
    AND om.joined_at IS NOT NULL
    AND p.deleted_at IS NULL

  UNION

  -- Other members ONLY see projects they're explicitly assigned to
  SELECT pa.project_id
  FROM project_access pa
  WHERE pa.user_id = user_uuid
    AND pa.deleted_at IS NULL
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

### Indexes

```sql
-- Optimize project_access lookups
CREATE INDEX IF NOT EXISTS idx_project_access_user_not_deleted
ON project_access(user_id)
WHERE deleted_at IS NULL;

-- Optimize organization_members role lookups
CREATE INDEX IF NOT EXISTS idx_org_members_user_role_not_deleted
ON organization_members(user_id, role)
WHERE deleted_at IS NULL AND joined_at IS NOT NULL;
```

### Migration Script

**File:** `scripts/migrate-project-visibility.sql`

```sql
-- Assign all org members to all projects with appropriate roles
INSERT INTO project_access (project_id, user_id, role, granted_by, granted_at)
SELECT
  p.id as project_id,
  om.user_id,
  CASE
    WHEN om.role IN ('owner', 'admin') THEN 'manager'
    ELSE 'viewer'
  END::project_role as role,
  om.user_id as granted_by,
  NOW() as granted_at
FROM projects p
CROSS JOIN organization_members om
WHERE om.org_id = p.org_id
  AND om.deleted_at IS NULL
  AND om.joined_at IS NOT NULL
  AND p.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM project_access pa
    WHERE pa.project_id = p.id
      AND pa.user_id = om.user_id
      AND pa.deleted_at IS NULL
  );
```

## Testing Requirements

### Unit Tests
- Test `user_project_ids()` with different roles
- Test RLS policies with various user scenarios
- Test migration script with sample data

### Integration Tests
- Test project list API with different user roles
- Test direct project access attempts (403 scenarios)
- Test project counts and badges

### E2E Tests
- Test full user journey for each role
- Test empty states for unassigned users
- Test post-migration access patterns

## Related Specs
- `permissions-system` - Defines what users can DO within visible projects
- `project-team-ui` - UI for managing project assignments
