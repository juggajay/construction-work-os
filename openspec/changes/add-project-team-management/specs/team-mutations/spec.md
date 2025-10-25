# Capability: Project Team Mutations

## Overview
Enable organization owners and administrators to add, update, and remove team members from projects with proper validation and audit logging.

---

## ADDED Requirements

### REQ-TM-001: Add Team Member to Project
The system SHALL allow authorized users to add organization members to a project with a specified role.

**Cross-references:**
- Extends `auth.md` - Requires authenticated owner/admin
- Extends `tenancy.md` - Project must belong to user's organization
- Uses `project_access` table from initial schema

#### Scenario: Owner adds manager to project
```
GIVEN an authenticated user who is an organization owner
AND their organization has member "alice@example.com" (user_id: "user-123")
AND project "proj-456" exists in their organization
AND Alice is NOT currently on the project team
WHEN the owner adds Alice to project "proj-456" with role "manager"
THEN the system SHALL:
  - Insert a new record in `project_access` table
  - Set user_id = "user-123"
  - Set project_id = "proj-456"
  - Set role = "manager"
  - Set granted_by = auth.uid() (the owner's ID)
  - Set granted_at = now()
  - Return success with the new project_access.id
```

#### Scenario: Add supervisor with trade specialty
```
GIVEN an owner is adding a team member
AND they select role "supervisor"
AND they specify trade = "Electrical"
WHEN the member is added
THEN the system SHALL store the trade field
AND the trade SHALL be queryable for filtering/reporting
```

#### Scenario: Cannot add user who is not an org member
```
GIVEN an owner attempts to add user "external@example.com" to a project
AND that user is NOT a member of the organization
WHEN the add operation is submitted
THEN the system SHALL return error 400 Bad Request
AND the message SHALL be "User must be an organization member before being added to projects"
```

#### Scenario: Cannot add user already on project
```
GIVEN user "bob@example.com" is already a team member on project "proj-789"
WHEN an owner attempts to add Bob to project "proj-789" again
THEN the system SHALL return error 409 Conflict
AND the message SHALL be "User is already a member of this project"
```

---

### REQ-TM-002: Update Team Member Role
The system SHALL allow authorized users to change a team member's role on a project.

**Cross-references:**
- Extends `auth.md` - Requires authenticated owner/admin
- Uses `project_role` enum transitions

#### Scenario: Change supervisor to manager
```
GIVEN project "proj-123" has team member Alice with role "supervisor"
AND the authenticated user is an organization owner
WHEN they update Alice's role to "manager"
THEN the system SHALL:
  - UPDATE project_access SET role = 'manager'
  - WHERE id = <Alice's project_access.id>
  - Return success
```

#### Scenario: Cannot change role of last manager
```
GIVEN project "proj-456" has only ONE member with role "manager"
AND that manager is "alice@example.com"
WHEN an owner attempts to change Alice's role to "supervisor" or "viewer"
THEN the system SHALL return error 400 Bad Request
AND the message SHALL be "Cannot remove the last project manager. Assign another manager first."
```

---

### REQ-TM-003: Remove Team Member from Project
The system SHALL allow authorized users to remove team members from projects using soft delete.

**Cross-references:**
- Uses soft delete pattern (deleted_at timestamp)
- Preserves audit trail for compliance

#### Scenario: Owner removes team member
```
GIVEN project "proj-789" has team member "bob@example.com"
AND Bob's project_access.id = "access-123"
AND the authenticated user is an organization admin
WHEN they remove Bob from the project
THEN the system SHALL:
  - UPDATE project_access SET deleted_at = now()
  - WHERE id = "access-123"
  - Preserve the original granted_by and granted_at for audit
  - Return success
```

#### Scenario: Cannot remove last manager
```
GIVEN project "proj-456" has exactly ONE team member with role "manager"
WHEN an owner attempts to remove that manager
THEN the system SHALL return error 400 Bad Request
AND the message SHALL be "Cannot remove the last project manager. Assign another manager first."
```

#### Scenario: Soft delete preserves audit trail
```
GIVEN a team member "Charlie" was added on 2025-01-15 by Owner
AND Charlie is removed on 2025-02-01
WHEN querying project_access for audit purposes (including deleted)
THEN Charlie's record SHALL still exist with:
  - granted_by = Owner's user_id
  - granted_at = 2025-01-15 timestamp
  - deleted_at = 2025-02-01 timestamp
```

---

### REQ-TM-004: Fetch Available Organization Members
The system SHALL provide a list of organization members who can be added to a project (not already on the team).

**Cross-references:**
- Queries `organization_members` table
- Filters out users already in `project_access`

#### Scenario: List available members for project
```
GIVEN an organization with 10 members
AND a project that currently has 3 team members
WHEN an owner requests available members for that project
THEN the system SHALL return 7 members (10 - 3)
AND each member SHALL include:
  - User ID, email, full name, avatar
  - Organization role (owner/admin/member)
```

#### Scenario: Exclude soft-deleted project access
```
GIVEN user "Dave" was previously on project "proj-123" but was removed (deleted_at IS NOT NULL)
WHEN an owner requests available members for project "proj-123"
THEN Dave SHALL appear in the available members list
AND Dave CAN be re-added to the project (creating a new project_access record)
```

---

### REQ-TM-005: Authorization for Mutations
The system SHALL restrict team management operations to organization owners and administrators only.

**Cross-references:**
- Extends `auth.md` - Authorization checks
- Relates to team-authorization spec for RLS policies

#### Scenario: Project manager cannot add team members
```
GIVEN user "manager@example.com" has role "manager" on project "proj-123"
AND manager@example.com is NOT an owner or admin in the organization
WHEN they attempt to add a new team member to project "proj-123"
THEN the system SHALL return error 403 Forbidden
AND the message SHALL be "Only organization owners and admins can manage project teams"
```

#### Scenario: Owner can manage any project in their org
```
GIVEN user "owner@example.com" is an organization owner
AND the organization has project "proj-456"
AND the owner is NOT currently a team member on project "proj-456"
WHEN the owner adds a team member to project "proj-456"
THEN the system SHALL allow the operation (owners manage org-wide)
```

---

### REQ-TM-006: Audit Logging for All Mutations
The system SHALL automatically record who performed each team management operation and when.

**Cross-references:**
- Uses `granted_by` and `granted_at` fields
- Supports compliance and audit requirements

#### Scenario: Add operation captures audit info
```
GIVEN owner "owner@example.com" (user_id: "user-owner-1") adds a team member
WHEN the new project_access record is created
THEN the system SHALL automatically set:
  - granted_by = "user-owner-1" (from auth.uid())
  - granted_at = current_timestamp
AND these fields SHALL NOT be user-editable
```

---

### REQ-TM-007: Optimistic UI Updates
The system SHALL update the UI immediately and revert on error for better user experience.

**Cross-references:**
- Uses React Query mutation patterns
- Integrates with team-listing capability

#### Scenario: Optimistic add with rollback on error
```
GIVEN an owner is viewing the project team page
AND they add a new member via the dialog
WHEN the server action is called
THEN the UI SHALL:
  - Immediately show the new member in the list (optimistic update)
  - Show a loading/pending indicator
  - On success: Refetch to confirm server state
  - On error: Remove the optimistic entry and show error message
```

---

## Server Actions

### Add Team Member
```typescript
export async function addTeamMember(params: {
  projectId: string
  userId: string
  role: ProjectRole
  trade?: string
}): Promise<ActionResponse<{ id: string }>>
```

**Validation:**
- projectId must be valid UUID
- userId must be valid UUID and org member
- role must be 'manager' | 'supervisor' | 'viewer'
- User must not already be on project (unless previously soft-deleted)

### Update Team Member Role
```typescript
export async function updateTeamMemberRole(params: {
  projectAccessId: string
  newRole: ProjectRole
}): Promise<ActionResponse<void>>
```

**Validation:**
- projectAccessId must exist and not be soft-deleted
- newRole must be valid enum value
- Cannot change last manager's role

### Remove Team Member
```typescript
export async function removeTeamMember(
  projectAccessId: string
): Promise<ActionResponse<void>>
```

**Validation:**
- projectAccessId must exist and not be soft-deleted
- Cannot remove last manager

### Get Available Org Members
```typescript
export async function getAvailableOrgMembers(params: {
  orgId: string
  projectId: string
}): Promise<ActionResponse<OrgMember[]>>
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

---

## UI Components

### AddTeamMemberDialog
**Location:** `components/projects/add-team-member-dialog.tsx`

**Features:**
- Dropdown/select for available org members
- Role selection (manager/supervisor/viewer)
- Optional trade field
- Submit button with loading state
- Error display

### TeamMemberRow (Edit Controls)
**Location:** `components/projects/team-member-row.tsx`

**Features:**
- Role dropdown (owners/admins only)
- Remove button with confirmation dialog
- Disabled state for last manager

---

## Error Messages

| Error Case | HTTP Status | Message |
|------------|-------------|---------|
| Not authorized | 403 | "Only organization owners and admins can manage project teams" |
| User not in org | 400 | "User must be an organization member before being added to projects" |
| Already on project | 409 | "User is already a member of this project" |
| Remove last manager | 400 | "Cannot remove the last project manager. Assign another manager first." |
| Project not found | 404 | "Project not found" |
| Invalid role | 400 | "Invalid role. Must be manager, supervisor, or viewer" |
