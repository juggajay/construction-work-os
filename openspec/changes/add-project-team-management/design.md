# Design: Project Team Management

## Architecture Overview

This feature builds upon the existing `project_access` table to provide a complete UI and API layer for managing project teams. The architecture follows the existing patterns in the codebase: Server Actions for mutations, React Query for data fetching, RLS for security, and audit logging for compliance.

## System Components

### 1. Database Layer (Existing - No Schema Changes)

**Tables Used:**
- `project_access` - Stores user-to-project role assignments
- `organization_members` - Source of users who can be added to projects
- `profiles` - User display information (name, email)

**No schema migrations needed** - all required fields already exist:
```sql
CREATE TABLE project_access (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role project_role NOT NULL,  -- 'manager' | 'supervisor' | 'viewer'
  trade TEXT,
  granted_by UUID,  -- Who added this user
  granted_at TIMESTAMPTZ,  -- When they were added
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  UNIQUE(project_id, user_id)
);
```

### 2. Server Actions (New)

**Location:** `lib/actions/projects/team-management.ts`

```typescript
// List all team members for a project
export async function getProjectTeam(projectId: string): Promise<ActionResponse<TeamMember[]>>

// Add a user to the project team
export async function addTeamMember(params: {
  projectId: string
  userId: string
  role: ProjectRole
  trade?: string
}): Promise<ActionResponse<{ id: string }>>

// Update a team member's role
export async function updateTeamMemberRole(params: {
  projectAccessId: string
  newRole: ProjectRole
}): Promise<ActionResponse<void>>

// Remove a team member from the project
export async function removeTeamMember(projectAccessId: string): Promise<ActionResponse<void>>

// Get available org members who can be added (not already on project)
export async function getAvailableOrgMembers(params: {
  orgId: string
  projectId: string
}): Promise<ActionResponse<OrgMember[]>>
```

**Security:**
- All actions verify caller is org owner/admin
- `granted_by` automatically set to `auth.uid()`
- `granted_at` automatically set to `now()`
- Prevent removing last manager from project
- RLS policies enforce project access checks

### 3. RLS Policies (New)

**Location:** New migration file

```sql
-- Allow owners/admins to manage project teams
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

-- Allow anyone with project access to view the team
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

### 4. UI Components (New)

**Project Team Page**
- **Location:** `app/(dashboard)/[orgSlug]/projects/[projectId]/team/page.tsx`
- **Purpose:** Main team management interface
- **Access:** Owners/admins can edit; project members can view

**Components:**
1. **TeamMemberList** (`components/projects/team-member-list.tsx`)
   - Shows current team members with roles
   - Avatar, name, email, role badge
   - Remove button (owners/admins only)
   - Role dropdown (owners/admins only)

2. **AddTeamMemberDialog** (`components/projects/add-team-member-dialog.tsx`)
   - Select from available org members
   - Choose role (manager/supervisor/viewer)
   - Optional trade field
   - Submit to add

3. **TeamMemberRow** (`components/projects/team-member-row.tsx`)
   - Single team member display
   - Inline role editing
   - Remove confirmation
   - Audit info tooltip (granted by, granted at)

### 5. Data Flow

#### Adding a Team Member
```
User clicks "Add Member"
→ Dialog opens with org member dropdown
→ User selects member + role
→ Form submits to addTeamMember() server action
→ Server validates:
  - Caller is owner/admin
  - Target user is org member
  - User not already on project
→ Insert into project_access with granted_by = auth.uid()
→ Return success
→ UI optimistically updates
→ React Query refetches team list
```

#### Removing a Team Member
```
User clicks remove icon
→ Confirmation dialog
→ User confirms
→ removeTeamMember() server action called
→ Server validates:
  - Caller is owner/admin
  - Not removing last manager
→ Soft delete (set deleted_at)
→ Return success
→ UI optimistically removes member
→ React Query refetches
```

#### Updating a Role
```
User changes role dropdown
→ updateTeamMemberRole() called
→ Server validates:
  - Caller is owner/admin
  - Not demoting last manager
→ UPDATE project_access SET role = new_role
→ Return success
→ UI optimistically updates
→ React Query refetches
```

## Data Models

### TeamMember (Frontend Type)
```typescript
interface TeamMember {
  id: string  // project_access.id
  userId: string
  projectId: string
  role: 'manager' | 'supervisor' | 'viewer'
  trade: string | null
  grantedBy: string | null
  grantedAt: string | null
  user: {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
  }
  grantedByUser: {
    fullName: string | null
  } | null
}
```

### OrgMember (For Selection)
```typescript
interface OrgMember {
  id: string  // user_id
  email: string
  fullName: string | null
  avatarUrl: string | null
  orgRole: 'owner' | 'admin' | 'member'
}
```

## Query Strategy

### Fetching Project Team
```typescript
// React Query hook
function useProjectTeam(projectId: string) {
  return useQuery({
    queryKey: ['project-team', projectId],
    queryFn: () => getProjectTeam(projectId),
    staleTime: 30_000, // 30 seconds
  })
}
```

**SQL Query:**
```sql
SELECT
  pa.id,
  pa.user_id,
  pa.project_id,
  pa.role,
  pa.trade,
  pa.granted_by,
  pa.granted_at,
  p.id as "user.id",
  p.email as "user.email",
  p.full_name as "user.fullName",
  p.avatar_url as "user.avatarUrl",
  gp.full_name as "grantedByUser.fullName"
FROM project_access pa
INNER JOIN profiles p ON p.id = pa.user_id
LEFT JOIN profiles gp ON gp.id = pa.granted_by
WHERE pa.project_id = $1
  AND pa.deleted_at IS NULL
ORDER BY pa.created_at ASC
```

### Fetching Available Org Members
```typescript
function useAvailableOrgMembers(orgId: string, projectId: string) {
  return useQuery({
    queryKey: ['available-org-members', orgId, projectId],
    queryFn: () => getAvailableOrgMembers({ orgId, projectId }),
    enabled: !!orgId && !!projectId,
  })
}
```

**SQL Query:**
```sql
SELECT
  om.user_id as id,
  p.email,
  p.full_name as "fullName",
  p.avatar_url as "avatarUrl",
  om.role as "orgRole"
FROM organization_members om
INNER JOIN profiles p ON p.id = om.user_id
WHERE om.org_id = $1
  AND om.deleted_at IS NULL
  AND om.user_id NOT IN (
    SELECT user_id
    FROM project_access
    WHERE project_id = $2 AND deleted_at IS NULL
  )
ORDER BY p.full_name ASC NULLS LAST, p.email ASC
```

## Security Considerations

### Authentication
- All endpoints require authenticated user (`auth.uid()`)
- RLS policies prevent unauthorized access

### Authorization
- Only org owners/admins can add/remove/update team
- Project members can view team (read-only)
- RLS policies enforce this at database level

### Audit Trail
- `granted_by` captures who added the user
- `granted_at` captures when
- Soft deletes preserve historical access for compliance

### Input Validation
- Project ID must be valid UUID
- User ID must be valid UUID and org member
- Role must be valid enum value
- Prevent removing last manager

## Error Handling

### Common Error Cases
1. **Not authorized**: User is not owner/admin
   - Response: 403 Forbidden
   - Message: "Only organization owners and admins can manage project teams"

2. **User not in org**: Trying to add non-member
   - Response: 400 Bad Request
   - Message: "User must be an organization member before being added to projects"

3. **User already on project**: Duplicate addition
   - Response: 409 Conflict
   - Message: "User is already a member of this project"

4. **Removing last manager**: Prevents orphaned project
   - Response: 400 Bad Request
   - Message: "Cannot remove the last project manager. Assign another manager first."

5. **Project not found**: Invalid project ID
   - Response: 404 Not Found
   - Message: "Project not found"

## Performance Considerations

### Indexes (Already Exist)
- `idx_project_access_project_id` - Fast lookup by project
- `idx_project_access_user_id` - Fast lookup by user
- `idx_project_access_project_user` - Fast uniqueness check

### Optimization Strategies
1. **Pagination**: If project teams exceed 50 members, implement pagination
2. **Caching**: React Query caches for 30 seconds
3. **Optimistic Updates**: UI updates immediately, rollback on error
4. **Debounced Search**: When filtering available members

## Testing Strategy

### Unit Tests
- Server action validation logic
- Role change business rules (prevent removing last manager)
- Input sanitization

### Integration Tests
- Add team member flow
- Update role flow
- Remove team member flow
- RLS policy enforcement

### E2E Tests (Playwright)
1. Owner adds project manager to project
2. Manager views team (read-only)
3. Owner changes member role from viewer to supervisor
4. Owner removes team member
5. System prevents removing last manager

## Rollout Plan

### Phase 1: Backend (Day 1-2)
- Implement server actions
- Add RLS policies
- Write unit tests

### Phase 2: UI (Day 2-3)
- Build team list component
- Build add member dialog
- Build role editing
- Wire up React Query

### Phase 3: Testing (Day 3-4)
- E2E tests
- Manual QA
- Performance testing with large teams

### Phase 4: Documentation (Day 4)
- Update user docs
- Add inline help text
- Record demo video

## Future Enhancements

### v2 Features (Not in Scope)
- Email notifications on team changes
- Bulk operations (add/remove multiple members)
- Team templates/presets
- Project managers can add supervisors/viewers
- Activity feed for team changes
- Export team roster to CSV
- Integration with external directories (LDAP/AD)

## Questions for Review

1. ✅ **Confirmed:** Only owners/admins can manage teams, not project managers
2. ✅ **Confirmed:** Soft delete on removal (preserve audit trail)
3. ✅ **Confirmed:** Prevent removing last manager
4. ⚠️ **Needs Decision:** Should we send email notifications when added/removed from project?
   - **Recommendation:** Defer to separate notification feature
5. ⚠️ **Needs Decision:** Max team size per project?
   - **Recommendation:** Start with no limit, add pagination if needed
