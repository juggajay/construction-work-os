# Capability: Project Team Listing

## Overview
Enable users to view the current team members assigned to a project, including their roles and audit information.

---

## ADDED Requirements

### REQ-TL-001: Query Project Team Members
The system SHALL provide an interface to retrieve all team members for a given project.

**Cross-references:**
- Extends `auth.md` - Uses authenticated user context
- Extends `tenancy.md` - Enforces project-level access control

#### Scenario: Owner views project team
```
GIVEN an authenticated user who is an organization owner
AND a project with ID "proj-123" exists in their organization
AND the project has 3 team members:
  - Alice (manager, granted by Owner on 2025-01-15)
  - Bob (supervisor, granted by Admin on 2025-01-20)
  - Carol (viewer, granted by Owner on 2025-01-22)
WHEN they request the team list for project "proj-123"
THEN the system SHALL return all 3 team members
AND each member SHALL include:
  - User profile (id, email, full name, avatar)
  - Project access details (id, role, trade if applicable)
  - Audit information (granted_by user, granted_at timestamp)
```

#### Scenario: Project manager views their team
```
GIVEN an authenticated user with "manager" role on project "proj-456"
AND the user is NOT an organization owner or admin
WHEN they request the team list for project "proj-456"
THEN the system SHALL return all team members on that project
AND the data SHALL be read-only (no edit capabilities exposed)
```

#### Scenario: Unauthorized user cannot view team
```
GIVEN an authenticated user who has NO access to project "proj-789"
WHEN they attempt to request the team list for project "proj-789"
THEN the system SHALL return an empty list or 403 Forbidden error
AND the RLS policies SHALL prevent data leakage
```

---

### REQ-TL-002: Display Team Member Profiles
The system SHALL display user profile information for each team member.

**Cross-references:**
- Uses `profiles` table from initial schema
- Integrates with existing avatar/display name patterns

#### Scenario: Team list shows complete member profiles
```
GIVEN a project team with member "alice@example.com"
AND Alice's profile has:
  - full_name: "Alice Johnson"
  - avatar_url: "https://storage.example/avatars/alice.jpg"
WHEN the team list is rendered
THEN Alice's entry SHALL display:
  - Full name "Alice Johnson"
  - Email "alice@example.com"
  - Avatar image from the URL
  - Role badge "Manager"
```

---

### REQ-TL-003: Show Role Assignments
The system SHALL clearly indicate each team member's role on the project.

**Cross-references:**
- Uses `project_role` enum: 'manager' | 'supervisor' | 'viewer'

#### Scenario: Team list displays role badges
```
GIVEN a project with team members having different roles:
  - Manager: Full project permissions
  - Supervisor: Field-level access, can upload invoices
  - Viewer: Read-only access
WHEN the team list is displayed
THEN each member SHALL have a visual role indicator
AND the role SHALL be one of: "Manager", "Supervisor", or "Viewer"
```

---

### REQ-TL-004: Display Audit Trail Information
The system SHALL show who granted access and when for compliance purposes.

**Cross-references:**
- Uses `granted_by` and `granted_at` fields from `project_access` table

#### Scenario: Audit info displayed for each member
```
GIVEN team member Bob was added to project "proj-123"
AND Bob was granted "supervisor" role by Admin "admin@example.com" on 2025-01-20 at 14:30 UTC
WHEN viewing the team list
THEN Bob's entry SHALL display or provide access to:
  - Granted by: "admin@example.com" or "Admin Name"
  - Granted at: "2025-01-20 14:30 UTC" (formatted appropriately)
```

#### Scenario: Tooltip or expandable section for audit details
```
GIVEN the UI needs to remain uncluttered
WHEN viewing the team list
THEN audit information (granted_by, granted_at) SHALL be accessible via:
  - Tooltip on hover, OR
  - Expandable details section, OR
  - Info icon with modal
```

---

### REQ-TL-005: Filter Out Soft-Deleted Members
The system SHALL exclude team members who have been removed (soft deleted).

**Cross-references:**
- Uses `deleted_at` field for soft delete pattern

#### Scenario: Removed members are hidden from active team list
```
GIVEN a project had 4 team members
AND member "Charlie" was removed on 2025-01-25 (deleted_at IS NOT NULL)
WHEN the team list is queried
THEN only 3 active members SHALL be returned
AND Charlie SHALL NOT appear in the list
```

---

### REQ-TL-006: Real-time Updates After Team Changes
The system SHALL refresh the team list after add/remove/update operations.

**Cross-references:**
- Integrates with React Query caching strategy
- Relates to team-mutations spec

#### Scenario: Team list updates after adding member
```
GIVEN an owner is viewing the project team page
AND the current team has 2 members
WHEN the owner adds a third member successfully
THEN the team list SHALL automatically refresh
AND the new member SHALL appear in the list without manual page reload
```

---

## Query Strategy

### Server Action Signature
```typescript
export async function getProjectTeam(projectId: string): Promise<ActionResponse<TeamMember[]>>
```

### SQL Query
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

### React Query Hook
```typescript
function useProjectTeam(projectId: string) {
  return useQuery({
    queryKey: ['project-team', projectId],
    queryFn: () => getProjectTeam(projectId),
    staleTime: 30_000, // 30 seconds
  })
}
```

---

## UI Components

### Primary Component
**Location:** `app/(dashboard)/[orgSlug]/projects/[projectId]/team/page.tsx`

### Supporting Components
1. **TeamMemberList** (`components/projects/team-member-list.tsx`)
   - Displays list of team members
   - Shows avatar, name, email, role badge
   - Conditionally shows edit controls for owners/admins

2. **TeamMemberRow** (`components/projects/team-member-row.tsx`)
   - Individual team member entry
   - Audit info tooltip
   - Role badge display
