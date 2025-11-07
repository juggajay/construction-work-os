# Design: Role-Based Permissions and Project Team UI

## Overview
This document details the technical architecture for implementing role-based permissions, project visibility restrictions, and project team management UI.

## Architecture Components

### 1. Database Layer (RLS Policies & Helper Functions)

#### 1.1 Modified `user_project_ids()` Function
**Purpose:** Restrict project visibility based on role

**Current Implementation:**
```sql
CREATE OR REPLACE FUNCTION user_project_ids(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE(project_id UUID) AS $$
  -- ALL org members see ALL org projects (PROBLEM)
  SELECT DISTINCT p.id
  FROM projects p
  INNER JOIN organization_members om ON om.org_id = p.org_id
  WHERE om.user_id = user_uuid
    AND om.deleted_at IS NULL
    AND p.deleted_at IS NULL

  UNION

  -- Projects via direct project access
  SELECT pa.project_id
  FROM project_access pa
  WHERE pa.user_id = user_uuid
    AND pa.deleted_at IS NULL
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

**Proposed Implementation:**
```sql
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

**Impact Analysis:**
- ✅ Owners/admins: No change (see all projects)
- ✅ Project managers: Only see assigned projects
- ✅ Supervisors: Only see assigned projects
- ✅ Viewers: Only see assigned projects
- ⚠️ Org members with no role: See no projects (must be explicitly assigned)

#### 1.2 New Permission Helper Functions
**Purpose:** Centralized permission checking for common operations

```sql
-- Check if user can edit project budgets
CREATE OR REPLACE FUNCTION can_edit_budget(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Org owners/admins can edit any project budget
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL

    UNION

    -- Project managers can edit their project budgets
    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role = 'manager'
      AND pa.deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user can create costs
CREATE OR REPLACE FUNCTION can_create_cost(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Org owners/admins can create costs
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL

    UNION

    -- Project managers and supervisors can create costs
    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role IN ('manager', 'supervisor')
      AND pa.deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user can approve change orders
CREATE OR REPLACE FUNCTION can_approve_change_order(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Only org owners/admins and project managers can approve
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL

    UNION

    SELECT 1
    FROM project_access pa
    WHERE pa.project_id = check_project_id
      AND pa.user_id = user_uuid
      AND pa.role = 'manager'
      AND pa.deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user can manage project team
CREATE OR REPLACE FUNCTION can_manage_team(user_uuid UUID, check_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    -- Only org owners/admins can manage project teams
    SELECT 1
    FROM projects p
    INNER JOIN organization_members om ON om.org_id = p.org_id
    WHERE p.id = check_project_id
      AND om.user_id = user_uuid
      AND om.role IN ('owner', 'admin')
      AND om.deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

**Additional Permission Functions Needed:**
- `can_edit_project()` - Update project details
- `can_delete_project()` - Soft delete projects
- `can_create_daily_report()` - Create daily reports
- `can_submit_rfi()` - Submit RFIs
- `can_respond_to_rfi()` - Respond to RFIs
- `can_create_submittal()` - Create submittals
- `can_approve_submittal()` - Approve submittals

#### 1.3 Updated RLS Policies
**Purpose:** Enforce permission helpers at the database level

**Example: project_costs table**
```sql
-- Replace generic policy with permission-based policy
DROP POLICY IF EXISTS "Users can create costs for accessible projects" ON project_costs;

CREATE POLICY "Users can create costs based on permissions"
ON project_costs FOR INSERT
TO authenticated
WITH CHECK (
  can_create_cost(auth.uid(), project_id)
);

-- View costs: any project member
CREATE POLICY "Project members can view costs"
ON project_costs FOR SELECT
TO authenticated
USING (
  project_id IN (SELECT user_project_ids(auth.uid()))
);

-- Edit costs: managers and supervisors
CREATE POLICY "Managers and supervisors can edit costs"
ON project_costs FOR UPDATE
TO authenticated
USING (
  can_create_cost(auth.uid(), project_id)  -- Same permission as create
);
```

**Tables Requiring Updated RLS:**
- `project_budgets` - Use `can_edit_budget()`
- `project_costs` - Use `can_create_cost()`
- `change_orders` - Use `can_approve_change_order()` for approval
- `daily_reports` - Use `can_create_daily_report()`
- `rfis` - Use `can_submit_rfi()` and `can_respond_to_rfi()`
- `submittals` - Use `can_create_submittal()` and `can_approve_submittal()`

### 2. Application Layer (Server Actions & Utilities)

#### 2.1 Permission Utility Module
**Location:** `lib/permissions/index.ts`

```typescript
import { createClient } from '@/lib/supabase/server'

export type Permission =
  | 'view_project'
  | 'edit_project'
  | 'delete_project'
  | 'view_budget'
  | 'edit_budget'
  | 'view_costs'
  | 'create_cost'
  | 'edit_cost'
  | 'delete_cost'
  | 'view_change_orders'
  | 'create_change_order'
  | 'approve_change_order'
  | 'view_daily_reports'
  | 'create_daily_report'
  | 'view_rfis'
  | 'submit_rfi'
  | 'respond_to_rfi'
  | 'view_submittals'
  | 'create_submittal'
  | 'approve_submittal'
  | 'view_team'
  | 'manage_team'

export type PermissionCheck = {
  permission: Permission
  projectId: string
  userId?: string
}

/**
 * Check if user has permission for a specific action
 */
export async function hasPermission(
  check: PermissionCheck
): Promise<boolean> {
  const supabase = await createClient()
  const userId = check.userId || (await supabase.auth.getUser()).data.user?.id

  if (!userId) return false

  // Map permission to RPC function
  const rpcMapping: Record<Permission, string> = {
    edit_budget: 'can_edit_budget',
    create_cost: 'can_create_cost',
    approve_change_order: 'can_approve_change_order',
    manage_team: 'can_manage_team',
    // ... more mappings
  }

  const rpcFunction = rpcMapping[check.permission]
  if (!rpcFunction) {
    console.error(`No RPC function for permission: ${check.permission}`)
    return false
  }

  const { data, error } = await supabase.rpc(rpcFunction, {
    user_uuid: userId,
    check_project_id: check.projectId,
  })

  if (error) {
    console.error('Permission check error:', error)
    return false
  }

  return data === true
}

/**
 * Assert user has permission or throw
 */
export async function assertPermission(
  check: PermissionCheck
): Promise<void> {
  const allowed = await hasPermission(check)
  if (!allowed) {
    throw new ForbiddenError(
      `You don't have permission to ${check.permission} on this project`
    )
  }
}

/**
 * Get all permissions for user on a project
 */
export async function getUserPermissions(
  projectId: string,
  userId?: string
): Promise<Set<Permission>> {
  const permissions = new Set<Permission>()

  // Check each permission
  const checks: Permission[] = [
    'view_project',
    'edit_project',
    'edit_budget',
    'create_cost',
    'approve_change_order',
    'manage_team',
    // ... all permissions
  ]

  await Promise.all(
    checks.map(async (permission) => {
      const allowed = await hasPermission({ permission, projectId, userId })
      if (allowed) permissions.add(permission)
    })
  )

  return permissions
}
```

#### 2.2 Server Action Updates
**Pattern:** Add permission checks to all mutation actions

**Example: `lib/actions/costs/create-cost.ts`**
```typescript
export async function createCost(data: CreateCostInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new UnauthorizedError()

  // NEW: Permission check
  await assertPermission({
    permission: 'create_cost',
    projectId: data.projectId,
    userId: user.id,
  })

  // Existing logic continues...
  const { data: cost, error } = await supabase
    .from('project_costs')
    .insert({...data})
    .select()
    .single()

  // ...
}
```

**Actions Requiring Updates:**
- Budget actions: `update-budget-allocation.ts`
- Cost actions: `create-cost.ts`, `update-cost.ts`, `delete-cost.ts`
- Change order actions: `approve-change-order.ts`
- Daily report actions: `create-daily-report.ts`
- RFI actions: `create-rfi.ts`, `respond-to-rfi.ts`
- Submittal actions: `create-submittal.ts`, `approve-submittal.ts`
- Project actions: `update-project.ts`, `delete-project.ts`

### 3. UI Layer (Components & Permission Gates)

#### 3.1 Permission Gate Component
**Location:** `components/permissions/permission-gate.tsx`

```typescript
'use client'

import { usePermission } from '@/hooks/use-permission'
import type { Permission } from '@/lib/permissions'

interface PermissionGateProps {
  permission: Permission
  projectId: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Conditionally render children based on user permission
 */
export function PermissionGate({
  permission,
  projectId,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, isLoading } = usePermission(permission, projectId)

  if (isLoading) return null
  if (!hasPermission) return <>{fallback}</>

  return <>{children}</>
}
```

**Usage:**
```tsx
<PermissionGate permission="edit_budget" projectId={projectId}>
  <Button onClick={handleEditBudget}>Edit Budget</Button>
</PermissionGate>

<PermissionGate permission="manage_team" projectId={projectId}>
  <AddTeamMemberDialog projectId={projectId} />
</PermissionGate>
```

#### 3.2 Permission Hook
**Location:** `hooks/use-permission.ts`

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import type { Permission } from '@/lib/permissions'

export function usePermission(permission: Permission, projectId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['permission', permission, projectId],
    queryFn: async () => {
      const response = await fetch(
        `/api/permissions/check?permission=${permission}&projectId=${projectId}`
      )
      if (!response.ok) throw new Error('Permission check failed')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  return {
    hasPermission: data?.allowed === true,
    isLoading,
    error,
  }
}

export function usePermissions(projectId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['permissions', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/permissions?projectId=${projectId}`)
      if (!response.ok) throw new Error('Failed to fetch permissions')
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  return {
    permissions: new Set<Permission>(data?.permissions || []),
    isLoading,
    error,
    can: (permission: Permission) => data?.permissions?.includes(permission),
  }
}
```

#### 3.3 Permission API Routes
**Location:** `app/api/permissions/check/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { hasPermission } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const permission = searchParams.get('permission')
  const projectId = searchParams.get('projectId')

  if (!permission || !projectId) {
    return NextResponse.json(
      { error: 'Missing parameters' },
      { status: 400 }
    )
  }

  const allowed = await hasPermission({
    permission: permission as any,
    projectId,
  })

  return NextResponse.json({ allowed })
}
```

**Location:** `app/api/permissions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getUserPermissions } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json(
      { error: 'Missing projectId' },
      { status: 400 }
    )
  }

  const permissions = await getUserPermissions(projectId)

  return NextResponse.json({
    permissions: Array.from(permissions),
  })
}
```

### 4. Project Team UI Components

#### 4.1 File Structure
```
app/(dashboard)/[orgSlug]/projects/[projectId]/team/
  ├── page.tsx                      # Main team page
  └── _components/
      ├── team-member-list.tsx      # List container
      ├── team-member-row.tsx       # Individual member row
      ├── add-team-member-dialog.tsx # Add member dialog
      └── team-stats.tsx            # Team composition stats
```

#### 4.2 Component Architecture

**`page.tsx` - Main Team Page**
```typescript
export default async function ProjectTeamPage({
  params,
}: {
  params: { orgSlug: string; projectId: string }
}) {
  const { projectId } = params

  // Fetch project and team data
  const [project, teamMembers, availableMembers] = await Promise.all([
    getProject(projectId),
    getProjectTeam(projectId),
    getAvailableOrgMembers({ projectId, orgId: project.org_id }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Project Team</h1>
          <p className="text-muted-foreground">
            Manage team members and roles for {project.name}
          </p>
        </div>
        <PermissionGate permission="manage_team" projectId={projectId}>
          <AddTeamMemberDialog
            projectId={projectId}
            availableMembers={availableMembers}
          />
        </PermissionGate>
      </div>

      <TeamStats members={teamMembers} />

      <TeamMemberList
        members={teamMembers}
        projectId={projectId}
      />
    </div>
  )
}
```

**`team-member-list.tsx`**
```typescript
interface TeamMemberListProps {
  members: TeamMember[]
  projectId: string
}

export function TeamMemberList({ members, projectId }: TeamMemberListProps) {
  const { permissions } = usePermissions(projectId)
  const canManage = permissions.has('manage_team')

  // Group by role
  const byRole = groupBy(members, (m) => m.role)

  return (
    <div className="space-y-6">
      {(['manager', 'supervisor', 'viewer'] as const).map((role) => (
        <div key={role}>
          <h3 className="text-lg font-semibold mb-3 capitalize">
            {role}s ({byRole[role]?.length || 0})
          </h3>
          <div className="border rounded-lg divide-y">
            {byRole[role]?.map((member) => (
              <TeamMemberRow
                key={member.id}
                member={member}
                canManage={canManage}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

**`team-member-row.tsx`**
```typescript
interface TeamMemberRowProps {
  member: TeamMember
  canManage: boolean
}

export function TeamMemberRow({ member, canManage }: TeamMemberRowProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleRoleChange = async (newRole: ProjectRole) => {
    setIsUpdating(true)
    const result = await updateTeamMemberRole({
      projectAccessId: member.id,
      newRole,
    })
    if (result.success) {
      toast.success('Role updated')
    } else {
      toast.error(result.error)
    }
    setIsUpdating(false)
  }

  const handleRemove = async () => {
    const result = await removeTeamMember(member.id)
    if (result.success) {
      toast.success('Team member removed')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="flex items-center gap-4 p-4">
      <Avatar>
        <AvatarImage src={member.user.avatarUrl} />
        <AvatarFallback>{getInitials(member.user.fullName)}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <p className="font-medium">{member.user.fullName || member.user.email}</p>
        <p className="text-sm text-muted-foreground">{member.user.email}</p>
      </div>

      {canManage ? (
        <>
          <Select
            value={member.role}
            onValueChange={handleRoleChange}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="supervisor">Supervisor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={isUpdating}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <Badge variant="secondary">{member.role}</Badge>
      )}

      {member.grantedByUser && (
        <p className="text-xs text-muted-foreground">
          Added by {member.grantedByUser.fullName} on{' '}
          {formatDate(member.grantedAt)}
        </p>
      )}
    </div>
  )
}
```

**`add-team-member-dialog.tsx`**
```typescript
export function AddTeamMemberDialog({
  projectId,
  availableMembers,
}: {
  projectId: string
  availableMembers: OrgMember[]
}) {
  const [open, setOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [role, setRole] = useState<ProjectRole>('viewer')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    const result = await addTeamMember({
      projectId,
      userId: selectedUser,
      role,
    })

    if (result.success) {
      toast.success('Team member added')
      setOpen(false)
      setSelectedUser('')
      setRole('viewer')
    } else {
      toast.error(result.error)
    }
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Select an organization member and assign them a role on this project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Member</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select a member..." />
              </SelectTrigger>
              <SelectContent>
                {availableMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.fullName || member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as ProjectRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">
                  <div>
                    <p className="font-medium">Manager</p>
                    <p className="text-xs text-muted-foreground">
                      Full project control
                    </p>
                  </div>
                </SelectItem>
                <SelectItem value="supervisor">
                  <div>
                    <p className="font-medium">Supervisor</p>
                    <p className="text-xs text-muted-foreground">
                      Field operations
                    </p>
                  </div>
                </SelectItem>
                <SelectItem value="viewer">
                  <div>
                    <p className="font-medium">Viewer</p>
                    <p className="text-xs text-muted-foreground">
                      Read-only access
                    </p>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedUser || isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## Permissions Matrix

| Resource | Owner | Admin | Manager | Supervisor | Viewer |
|----------|-------|-------|---------|------------|--------|
| **Projects** |
| View | All | All | Assigned | Assigned | Assigned |
| Create | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Budgets** |
| View | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit | ✅ | ✅ | ✅ | ❌ | ❌ |
| Allocate | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Costs** |
| View | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit | ✅ | ✅ | ✅ | Own only | ❌ |
| Delete | ✅ | ✅ | ✅ | Own only | ❌ |
| **Change Orders** |
| View | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ✅ | ✅ | ❌ |
| Approve | ✅ | ✅ | ✅ | ❌ | ❌ |
| Reject | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Daily Reports** |
| View | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit | ✅ | ✅ | ✅ | Own only | ❌ |
| **RFIs** |
| View | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit | ✅ | ✅ | ✅ | ✅ | ❌ |
| Respond | ✅ | ✅ | ✅ | ❌ | ❌ |
| Close | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Submittals** |
| View | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create | ✅ | ✅ | ✅ | ✅ | ❌ |
| Review | ✅ | ✅ | ✅ | ✅ | ❌ |
| Approve | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Team** |
| View | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage | ✅ | ✅ | ❌ | ❌ | ❌ |

## Migration Strategy

### Phase 1: Preparation
1. Create feature flag `ENABLE_RBAC_PERMISSIONS`
2. Deploy new RLS functions (in addition to existing ones)
3. Create migration script to assign all current org members to all projects

### Phase 2: Migration Execution
```sql
-- Migration: Assign all org members to all org projects as 'viewer'
-- Owners/admins get 'manager' role
INSERT INTO project_access (project_id, user_id, role, granted_by, granted_at)
SELECT
  p.id as project_id,
  om.user_id,
  CASE
    WHEN om.role IN ('owner', 'admin') THEN 'manager'::project_role
    ELSE 'viewer'::project_role
  END as role,
  om.user_id as granted_by,  -- Self-granted during migration
  NOW() as granted_at
FROM projects p
CROSS JOIN organization_members om
WHERE om.org_id = p.org_id
  AND om.deleted_at IS NULL
  AND om.joined_at IS NOT NULL
  AND p.deleted_at IS NULL
  AND NOT EXISTS (
    -- Skip if already has project access
    SELECT 1 FROM project_access pa
    WHERE pa.project_id = p.id
      AND pa.user_id = om.user_id
      AND pa.deleted_at IS NULL
  );
```

### Phase 3: Rollout
1. Enable feature flag in staging
2. Verify no access issues
3. Enable in production
4. Monitor for 24-48 hours
5. Owners/admins manually adjust roles and remove unnecessary access

### Phase 4: Cleanup
1. Remove old `user_project_ids()` function
2. Update RLS policies to use new permission functions
3. Remove feature flag

## Performance Considerations

### Database Indexes
```sql
-- Optimize project_access lookups
CREATE INDEX idx_project_access_user_project ON project_access(user_id, project_id)
WHERE deleted_at IS NULL;

CREATE INDEX idx_project_access_project_role ON project_access(project_id, role)
WHERE deleted_at IS NULL;

-- Optimize organization_members lookups
CREATE INDEX idx_org_members_user_role ON organization_members(user_id, role)
WHERE deleted_at IS NULL;
```

### Caching Strategy
1. **Client-side:** React Query caches permission checks for 5 minutes
2. **Server-side:** Consider Redis cache for permission results
3. **Database:** `SECURITY DEFINER` functions are cached per transaction

### Query Optimization
- Use `EXISTS` instead of `JOIN` + `COUNT` for permission checks
- Batch permission checks when loading pages
- Prefetch permissions alongside data queries

## Testing Strategy

### Unit Tests
```typescript
describe('hasPermission', () => {
  it('allows owners to edit any project budget', async () => {
    const owner = await createTestUser({ orgRole: 'owner' })
    const project = await createTestProject({ orgId: owner.orgId })

    const allowed = await hasPermission({
      permission: 'edit_budget',
      projectId: project.id,
      userId: owner.id,
    })

    expect(allowed).toBe(true)
  })

  it('prevents viewers from editing budgets', async () => {
    const viewer = await createTestUser({ orgRole: 'member' })
    const project = await createTestProject()
    await assignToProject(viewer.id, project.id, 'viewer')

    const allowed = await hasPermission({
      permission: 'edit_budget',
      projectId: project.id,
      userId: viewer.id,
    })

    expect(allowed).toBe(false)
  })
})
```

### Integration Tests
```typescript
describe('Project visibility', () => {
  it('project managers only see assigned projects', async () => {
    const manager = await createTestUser({ orgRole: 'member' })
    const projectA = await createTestProject()
    const projectB = await createTestProject()

    await assignToProject(manager.id, projectA.id, 'manager')

    const projects = await getProjects(manager.id)

    expect(projects).toHaveLength(1)
    expect(projects[0].id).toBe(projectA.id)
  })
})
```

### E2E Tests
```typescript
test('manager can create costs but not approve change orders', async ({ page }) => {
  await login(page, 'manager@example.com')
  await page.goto('/org/acme/projects/abc')

  // Can create cost
  await expect(page.getByText('Add Cost')).toBeVisible()
  await page.click('button:has-text("Add Cost")')
  // ... fill form and submit

  // Cannot approve change order
  await page.goto('/org/acme/projects/abc/change-orders/123')
  await expect(page.getByText('Approve')).not.toBeVisible()
})
```

## Security Considerations

1. **Defense in Depth:** Enforce permissions at multiple layers (RLS, server actions, UI)
2. **Fail Closed:** Default to denying access if permission check fails
3. **Audit Logging:** Log all permission grants/revokes
4. **Regular Review:** Periodic access audits for sensitive projects
5. **Principle of Least Privilege:** Start with minimal access, grant as needed

## Rollback Plan

If critical issues arise:

1. **Disable feature flag** `ENABLE_RBAC_PERMISSIONS=false`
2. **Revert `user_project_ids()` function** to original implementation
3. **Restore old RLS policies** from backup
4. **Communicate to users** about temporary regression
5. **Fix issues in staging** before re-enabling

Critical rollback triggers:
- Users locked out of projects
- Performance degradation >500ms
- Data access violations detected
- Multiple permission denial false positives
