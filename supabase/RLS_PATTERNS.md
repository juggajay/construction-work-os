# Row-Level Security (RLS) Patterns

This document outlines the RLS policy patterns used in Construction Work OS. Use these patterns when adding RLS policies to new tables.

## Overview

All tables in the database have Row-Level Security (RLS) enabled. This provides database-level data isolation, ensuring users can only access data they're authorized to see.

## Core Principles

1. **Defense in Depth**: RLS is the last line of defense, even if application logic fails
2. **Deny by Default**: RLS is enabled on all tables, requiring explicit policies for access
3. **Helper Functions**: Use SECURITY DEFINER functions to avoid context propagation issues
4. **Performance**: RLS policies use efficient indexed lookups via helper functions

## Helper Functions

### `user_org_ids(user_uuid)`

Returns all organization IDs that a user has access to (via organization_members table).

```sql
CREATE OR REPLACE FUNCTION user_org_ids(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (org_id UUID)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT om.org_id
  FROM organization_members om
  WHERE om.user_id = user_uuid
    AND om.deleted_at IS NULL;
$$;
```

**When to use**: For tables that have an `org_id` column.

### `user_project_ids(user_uuid)`

Returns all project IDs that a user has access to (via org membership OR direct project access).

```sql
CREATE OR REPLACE FUNCTION user_project_ids(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (project_id UUID)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  -- Projects from orgs the user belongs to
  SELECT p.id AS project_id
  FROM projects p
  WHERE p.org_id IN (SELECT org_id FROM user_org_ids(user_uuid))
    AND p.deleted_at IS NULL

  UNION

  -- Projects with direct access grants
  SELECT pa.project_id
  FROM project_access pa
  WHERE pa.user_id = user_uuid
    AND pa.deleted_at IS NULL;
$$;
```

**When to use**: For tables that have a `project_id` column.

### `is_org_admin(user_uuid, check_org_id)`

Returns TRUE if user is an admin or owner of the specified organization.

```sql
CREATE OR REPLACE FUNCTION is_org_admin(user_uuid UUID, check_org_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.org_id = check_org_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
  );
$$;
```

**When to use**: For write operations on org-scoped tables that should be restricted to admins.

### `is_project_manager(user_uuid, check_project_id)`

Returns TRUE if user is a manager or supervisor of the specified project.

```sql
CREATE OR REPLACE FUNCTION is_project_manager(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role = 'manager'
      AND pa.deleted_at IS NULL
  );
$$;
```

**When to use**: For write operations on project-scoped tables that should be restricted to managers.

## RLS Policy Patterns

### Pattern 1: Organization-Scoped Tables

For tables that have an `org_id` column (e.g., `projects`, `documents`):

```sql
-- Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view records in orgs they belong to
CREATE POLICY "Users can view records in their orgs"
  ON your_table FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_org_ids()));

-- INSERT: Users can create records in orgs they belong to
CREATE POLICY "Users can create records in their orgs"
  ON your_table FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM user_org_ids()));

-- UPDATE: Only org admins can update records
CREATE POLICY "Org admins can update records"
  ON your_table FOR UPDATE
  USING (is_org_admin(auth.uid(), org_id))
  WITH CHECK (is_org_admin(auth.uid(), org_id));

-- DELETE: Only org admins can delete records (or use soft delete)
CREATE POLICY "Org admins can delete records"
  ON your_table FOR DELETE
  USING (is_org_admin(auth.uid(), org_id));
```

### Pattern 2: Project-Scoped Tables

For tables that have a `project_id` column (e.g., `rfis`, `submittals`):

```sql
-- Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view records in projects they have access to
CREATE POLICY "Users can view records in their projects"
  ON your_table FOR SELECT
  USING (project_id IN (SELECT project_id FROM user_project_ids()));

-- INSERT: Users can create records in projects they have access to
CREATE POLICY "Users can create records in their projects"
  ON your_table FOR INSERT
  WITH CHECK (project_id IN (SELECT project_id FROM user_project_ids()));

-- UPDATE: Project managers can update records
CREATE POLICY "Project managers can update records"
  ON your_table FOR UPDATE
  USING (is_project_manager(auth.uid(), project_id))
  WITH CHECK (is_project_manager(auth.uid(), project_id));

-- DELETE: Project managers can delete records (or use soft delete)
CREATE POLICY "Project managers can delete records"
  ON your_table FOR DELETE
  USING (is_project_manager(auth.uid(), project_id));
```

### Pattern 3: User-Scoped Tables

For tables that have a `user_id` column and are user-specific (e.g., `profiles`, `notifications`):

```sql
-- Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only view their own records
CREATE POLICY "Users can view own records"
  ON your_table FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can only create their own records
CREATE POLICY "Users can create own records"
  ON your_table FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can only update their own records
CREATE POLICY "Users can update own records"
  ON your_table FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can only delete their own records
CREATE POLICY "Users can delete own records"
  ON your_table FOR DELETE
  USING (user_id = auth.uid());
```

### Pattern 4: Junction Tables (Many-to-Many)

For junction tables like `organization_members` or `project_access`:

```sql
-- Enable RLS
ALTER TABLE your_junction_table ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view records in orgs/projects they belong to
CREATE POLICY "Users can view records in their context"
  ON your_junction_table FOR SELECT
  USING (
    -- Either the user is viewing their own membership...
    user_id = auth.uid()
    -- ...or they're viewing memberships in an org they belong to
    OR org_id IN (SELECT org_id FROM user_org_ids())
  );

-- INSERT: Only admins can add new members
CREATE POLICY "Admins can add members"
  ON your_junction_table FOR INSERT
  WITH CHECK (is_org_admin(auth.uid(), org_id));

-- UPDATE: Only admins can update memberships
CREATE POLICY "Admins can update members"
  ON your_junction_table FOR UPDATE
  USING (is_org_admin(auth.uid(), org_id))
  WITH CHECK (is_org_admin(auth.uid(), org_id));

-- DELETE: Only admins can remove members (except users can remove themselves)
CREATE POLICY "Admins can remove members or users can leave"
  ON your_junction_table FOR DELETE
  USING (
    is_org_admin(auth.uid(), org_id)
    OR user_id = auth.uid()
  );
```

### Pattern 5: Audit Logs (Read-Only)

For audit log tables that should be immutable:

```sql
-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only view audit logs for records they have access to
-- This is complex and may require custom logic per table being audited
CREATE POLICY "Users can view audit logs for accessible records"
  ON audit_logs FOR SELECT
  USING (
    -- Example: For organization records
    (table_name = 'organizations' AND record_id::uuid IN (SELECT org_id FROM user_org_ids()))
    OR
    -- Example: For project records
    (table_name = 'projects' AND record_id::uuid IN (SELECT project_id FROM user_project_ids()))
  );

-- No INSERT/UPDATE/DELETE policies - audit logs are managed via triggers only
```

## SECURITY DEFINER Pattern

### Why Use SECURITY DEFINER?

When using Server Actions in Next.js with Supabase, the auth context doesn't propagate correctly through the middleware chain. The solution is to use `SECURITY DEFINER` functions that:

1. Run with the privileges of the function owner (bypassing RLS)
2. Accept the user_id as a parameter (explicitly passed from Server Actions)
3. Enforce authorization logic inside the function

### Example: Creating an Organization

```sql
CREATE OR REPLACE FUNCTION create_organization_with_member(
  p_name TEXT,
  p_slug TEXT
)
RETURNS TABLE (
  organization_id UUID,
  organization_name TEXT,
  organization_slug TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user (this works even when RLS context is lost)
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create organization
  INSERT INTO organizations (name, slug)
  VALUES (p_name, p_slug)
  RETURNING id INTO v_org_id;

  -- Add creator as owner
  INSERT INTO organization_members (org_id, user_id, role, invited_by, joined_at)
  VALUES (v_org_id, v_user_id, 'owner', v_user_id, NOW());

  -- Return the created organization
  RETURN QUERY
  SELECT v_org_id, p_name, p_slug;
END;
$$;
```

### Server Action Usage

```typescript
export async function createOrganization(data: CreateOrgInput): Promise<ActionResult<Organization>> {
  const supabase = await createClient()
  
  // Call SECURITY DEFINER function
  const { data: result, error } = await supabase.rpc('create_organization_with_member', {
    p_name: data.name,
    p_slug: data.slug,
  })
  
  if (error) return { success: false, error: error.message }
  
  return { success: true, data: result[0] }
}
```

## Testing RLS Policies

### SQL Integration Tests

Create SQL test files in `supabase/tests/` to verify RLS policies:

```sql
-- Create test users
INSERT INTO auth.users (id, email, ...) VALUES ('test-user-1', 'user1@test.com', ...);

-- Test: User should see only their orgs
SELECT COUNT(*) FROM organizations; -- Should return only orgs user belongs to

-- Test: User should NOT see other orgs
SELECT * FROM organizations WHERE slug = 'other-org'; -- Should return 0 rows

-- Test: Admin can create records
INSERT INTO projects (org_id, name) VALUES ('admin-org-id', 'Test Project'); -- Should succeed

-- Test: Non-admin cannot create records
INSERT INTO projects (org_id, name) VALUES ('other-org-id', 'Test Project'); -- Should fail
```

Run tests with: `npm run db:psql -f supabase/tests/rls-functions.test.sql`

### Unit Tests (Vitest)

Mock Supabase client and test RLS helper functions:

```typescript
describe('RLS Helper Functions', () => {
  it('user_org_ids returns accessible orgs', async () => {
    const { data } = await supabase.rpc('user_org_ids', { user_uuid: testUserId })
    expect(data).toEqual([{ org_id: 'org-1' }, { org_id: 'org-2' }])
  })
})
```

## Checklist for New Tables

When creating a new table with RLS:

- [ ] Enable RLS on the table (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] Determine scoping (org, project, user, or custom)
- [ ] Create SELECT policy using appropriate helper function
- [ ] Create INSERT policy (if users should be able to create records)
- [ ] Create UPDATE policy (usually restricted to admins/managers)
- [ ] Create DELETE policy (usually restricted to admins/managers, or use soft delete)
- [ ] Create SECURITY DEFINER function if using Server Actions
- [ ] Write SQL integration tests for the policies
- [ ] Test with different user roles (owner, admin, member, viewer)
- [ ] Verify policies work correctly with soft deletes (deleted_at IS NULL)

## Performance Considerations

1. **Index Helper Functions**: Ensure `org_id`, `user_id`, and `project_id` are indexed
2. **Avoid N+1 Queries**: Helper functions use efficient set-based queries
3. **Cache Helper Results**: Helper functions are marked `STABLE` for query planning optimization
4. **Monitor Query Plans**: Use `EXPLAIN ANALYZE` to verify RLS policies are efficient

## Common Pitfalls

1. **Forgetting to Enable RLS**: Always enable RLS on new tables
2. **Missing Soft Delete Checks**: Include `deleted_at IS NULL` in helper functions
3. **Overly Permissive Policies**: Default to restrictive policies, then relax as needed
4. **Not Testing Edge Cases**: Test with users who have no org/project access
5. **RPC Context Loss**: Use SECURITY DEFINER functions for Server Actions

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Postgres RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [SECURITY DEFINER Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)
