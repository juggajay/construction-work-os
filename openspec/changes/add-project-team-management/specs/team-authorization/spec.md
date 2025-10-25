# Capability: Project Team Authorization

## Overview
Enforce database-level access control for project team management operations using Row-Level Security (RLS) policies, ensuring only authorized users can view and modify project teams.

---

## ADDED Requirements

### REQ-TA-001: RLS Policy for Team Management
The system SHALL implement RLS policies that allow only organization owners and admins to manage project teams.

**Cross-references:**
- Extends `auth.md` - Uses auth.uid() for user identification
- Extends `tenancy.md` - Enforces organization-level access control
- Depends on `organization_members` table and roles

#### Scenario: Owner can manage project team
```
GIVEN user "owner@example.com" (user_id: "user-123") is an organization owner
AND the organization has project "proj-456"
AND the authenticated session has auth.uid() = "user-123"
WHEN a query attempts to INSERT/UPDATE/DELETE on project_access for project "proj-456"
THEN the RLS policy SHALL evaluate to TRUE
AND the operation SHALL be permitted
```

#### Scenario: Admin can manage project team
```
GIVEN user "admin@example.com" is an organization admin (not owner)
AND the organization has project "proj-789"
WHEN the admin attempts to add a team member to project "proj-789"
THEN the RLS policy SHALL permit the operation
AND the policy SHALL verify admin's role via organization_members table
```

#### Scenario: Project manager cannot manage team (blocked by RLS)
```
GIVEN user "manager@example.com" has role "manager" on project "proj-123"
AND manager@example.com is NOT an owner or admin in the organization
WHEN they attempt to INSERT a new project_access record for project "proj-123"
THEN the RLS policy SHALL evaluate to FALSE
AND the database SHALL reject the operation
AND NO server-level checks are bypassed
```

---

### REQ-TA-002: RLS Policy for Viewing Team Members
The system SHALL allow any user with project access to view the project team roster.

**Cross-references:**
- Uses `project_access` table for access verification
- Supports read-only views for non-owners

#### Scenario: Project member can view team
```
GIVEN user "viewer@example.com" has role "viewer" on project "proj-456"
AND the project has 5 team members
WHEN viewer@example.com queries project_access for project "proj-456"
THEN the RLS SELECT policy SHALL evaluate to TRUE
AND all 5 team members SHALL be returned
```

#### Scenario: User with no project access cannot view team
```
GIVEN user "external@example.com" has NO project_access record for project "proj-789"
WHEN they attempt to SELECT from project_access WHERE project_id = "proj-789"
THEN the RLS policy SHALL evaluate to FALSE
AND zero rows SHALL be returned
AND no team member information SHALL be leaked
```

---

### REQ-TA-003: Policy Verification via Organization Membership
The system SHALL verify the user's organization role by joining with organization_members table.

**Cross-references:**
- Queries `organization_members` table
- Checks role IN ('owner', 'admin')
- Verifies deleted_at IS NULL

#### Scenario: Policy checks org membership and role
```
GIVEN a user attempts to modify project_access for project "proj-123"
WHEN the RLS policy is evaluated
THEN it SHALL execute a query like:
  SELECT 1 FROM organization_members om
  INNER JOIN projects p ON p.org_id = om.org_id
  WHERE p.id = project_access.project_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
    AND om.deleted_at IS NULL
AND only if this returns a row SHALL the policy pass
```

#### Scenario: Soft-deleted org members are denied
```
GIVEN user "former-admin@example.com" was an admin but was removed from the org (deleted_at IS NOT NULL)
WHEN they attempt to manage a project team
THEN the RLS policy SHALL evaluate to FALSE (due to deleted_at check)
AND the operation SHALL be denied
```

---

### REQ-TA-004: Cross-Organization Access Prevention
The system SHALL prevent users from managing teams of projects outside their organization.

**Cross-references:**
- Enforces organization boundaries
- Uses projects.org_id for verification

#### Scenario: Owner of Org A cannot manage Org B's projects
```
GIVEN user "owner-a@example.com" is owner of Organization A
AND project "proj-999" belongs to Organization B
WHEN owner-a@example.com attempts to add a team member to project "proj-999"
THEN the RLS policy SHALL evaluate to FALSE (no matching org membership)
AND the operation SHALL be rejected at the database level
```

---

### REQ-TA-005: Policy Performance Optimization
The system SHALL use efficient RLS policies that leverage existing indexes.

**Cross-references:**
- Depends on existing indexes:
  - `idx_project_access_project_id`
  - `idx_project_access_user_id`
  - `idx_organization_members_org_id_user_id`

#### Scenario: Policy execution is performant
```
GIVEN a user attempts a team management operation
WHEN the RLS policy is evaluated
THEN the database SHALL use indexes for:
  - project_id lookups on project_access
  - org_id + user_id lookups on organization_members
  - project_id lookups on projects table
AND the policy evaluation SHALL complete in < 50ms
```

---

## ADDED Database Objects

### RLS Policy: Owners and Admins Can Manage Project Team

**Policy Name:** `Owners and admins can manage project team`

**Operation:** `FOR ALL` (INSERT, UPDATE, DELETE)

**Target Role:** `authenticated`

**Policy Definition:**
```sql
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
```

**Rationale:**
- Enforces organization-level authorization
- Prevents project managers from escalating privileges
- Blocks cross-organization access attempts
- Respects soft deletes on org membership

---

### RLS Policy: Project Members Can View Team

**Policy Name:** `Project members can view team`

**Operation:** `FOR SELECT`

**Target Role:** `authenticated`

**Policy Definition:**
```sql
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
```

**Rationale:**
- Allows read-only access for all project members
- Enables managers/supervisors/viewers to see their teammates
- Does not grant modification privileges
- Filters out soft-deleted access records

---

## Migration File

**Location:** `supabase/migrations/YYYYMMDDHHMMSS_add_project_team_management_rls.sql`

```sql
-- Enable RLS on project_access if not already enabled
ALTER TABLE project_access ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent migration)
DROP POLICY IF EXISTS "Owners and admins can manage project team" ON project_access;
DROP POLICY IF EXISTS "Project members can view team" ON project_access;

-- Policy: Allow owners/admins to manage project teams
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

-- Policy: Allow project members to view team roster
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
```

---

## Security Validation Scenarios

### Scenario: Attempt to bypass server action validation
```
GIVEN a malicious user crafts a direct database query
AND they attempt to INSERT into project_access for a project they don't own
WHEN the query reaches the database
THEN the RLS policy SHALL block the operation
AND the database SHALL return an empty result or error
AND no data SHALL be modified
```

### Scenario: SQL injection attempt via project_id
```
GIVEN a malicious user provides projectId = "'; DROP TABLE project_access; --"
WHEN the server action validates and sanitizes the input
THEN parameterized queries SHALL prevent SQL injection
AND the RLS policies SHALL use bound parameters ($1, $2, etc.)
AND no unauthorized database operations SHALL occur
```

### Scenario: Session hijacking attempt
```
GIVEN an attacker obtains a session token for a regular member
WHEN they attempt to use that token to modify project_access
THEN auth.uid() SHALL return the member's user_id (not owner)
AND the RLS policy SHALL evaluate to FALSE for management operations
AND the attack SHALL fail at the database level
```

---

## Testing Requirements

### Unit Tests: RLS Policy Logic
```typescript
describe('Project Team RLS Policies', () => {
  test('Owner can insert team member', async () => {
    // Setup: Create org, owner, project
    // Action: INSERT into project_access as owner
    // Assert: Operation succeeds
  })

  test('Project manager cannot insert team member', async () => {
    // Setup: Create project with manager (not owner/admin)
    // Action: Attempt INSERT as manager
    // Assert: Operation fails with RLS violation
  })

  test('Project member can SELECT team', async () => {
    // Setup: Create project with multiple members
    // Action: SELECT from project_access as viewer
    // Assert: All members returned
  })

  test('Non-member cannot SELECT team', async () => {
    // Setup: Create project
    // Action: SELECT from project_access as unrelated user
    // Assert: Zero rows returned
  })
})
```

### Integration Tests: End-to-End Authorization
```typescript
describe('Team Management Authorization', () => {
  test('Admin adds member via server action with RLS', async () => {
    // Setup: Login as admin
    // Action: Call addTeamMember()
    // Assert: Server action + RLS both pass
  })

  test('Manager blocked from adding member', async () => {
    // Setup: Login as project manager
    // Action: Call addTeamMember()
    // Assert: Returns 403 Forbidden
  })
})
```

---

## Performance Benchmarks

### Expected Policy Evaluation Times
- **Simple SELECT (own projects):** < 10ms
- **Management operation verification (owner check):** < 50ms
- **Available members query (with exclusion):** < 100ms

### Index Usage Verification
```sql
EXPLAIN ANALYZE
SELECT * FROM project_access
WHERE project_id = 'uuid-here'
  AND deleted_at IS NULL;

-- Should use: idx_project_access_project_id
```

---

## Rollback Strategy

If RLS policies cause performance issues or block legitimate operations:

1. **Immediate mitigation:**
   ```sql
   ALTER TABLE project_access DISABLE ROW LEVEL SECURITY;
   ```

2. **Investigate policy efficiency:**
   - Check query plans with EXPLAIN ANALYZE
   - Verify index usage
   - Monitor policy evaluation time

3. **Apply fix:**
   - Optimize policy query
   - Add missing indexes
   - Simplify EXISTS clauses if needed

4. **Re-enable RLS:**
   ```sql
   ALTER TABLE project_access ENABLE ROW LEVEL SECURITY;
   ```
