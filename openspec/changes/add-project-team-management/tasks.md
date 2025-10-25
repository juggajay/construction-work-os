# Implementation Tasks: Project Team Management

## Overview
This document provides an ordered breakdown of implementation tasks for the project team management feature. Tasks are organized into phases for backend, UI, and testing.

---

## Phase 1: Database & RLS Policies

### Task 1.1: Create RLS Migration File
**Estimate:** 30 minutes
**Dependencies:** None
**Capability:** team-authorization

**Steps:**
1. Create new migration file: `supabase/migrations/YYYYMMDDHHMMSS_add_project_team_management_rls.sql`
2. Add policy: "Owners and admins can manage project team" (FOR ALL)
3. Add policy: "Project members can view team" (FOR SELECT)
4. Include idempotent DROP POLICY IF EXISTS statements
5. Ensure policies reference `project_access`, `organization_members`, `projects` tables

**Acceptance Criteria:**
- [ ] Migration file created with both RLS policies
- [ ] Policies use correct auth.uid() and role checks
- [ ] Migration is idempotent (can be run multiple times)

---

### Task 1.2: Apply Migration to Database
**Estimate:** 15 minutes
**Dependencies:** Task 1.1
**Capability:** team-authorization

**Steps:**
1. Test migration locally: `npm run db:reset`
2. Verify RLS policies created: `npm run db:psql` → `\d+ project_access`
3. Push to production via Supabase CLI or dashboard

**Acceptance Criteria:**
- [ ] Migration applied successfully to local database
- [ ] RLS policies visible in database schema
- [ ] No errors during migration

---

### Task 1.3: Test RLS Policies
**Estimate:** 1 hour
**Dependencies:** Task 1.2
**Capability:** team-authorization

**Steps:**
1. Create test file: `lib/actions/projects/__tests__/team-management-rls.test.ts`
2. Test: Owner can INSERT into project_access
3. Test: Admin can INSERT into project_access
4. Test: Project manager CANNOT INSERT (blocked by RLS)
5. Test: Project member CAN SELECT from project_access
6. Test: Non-member CANNOT SELECT (returns empty)

**Acceptance Criteria:**
- [ ] All RLS policy tests pass
- [ ] Policies block unauthorized operations
- [ ] Policies allow authorized operations

---

## Phase 2: Server Actions (Backend)

### Task 2.1: Create Server Actions File
**Estimate:** 30 minutes
**Dependencies:** Task 1.2
**Capability:** team-listing, team-mutations

**Steps:**
1. Create file: `lib/actions/projects/team-management.ts`
2. Import Supabase client, types, ActionResponse pattern
3. Define TypeScript interfaces: TeamMember, OrgMember
4. Export stub functions: getProjectTeam, addTeamMember, updateTeamMemberRole, removeTeamMember, getAvailableOrgMembers

**Acceptance Criteria:**
- [ ] File created with proper imports
- [ ] TypeScript types defined
- [ ] Function signatures match design.md specifications

---

### Task 2.2: Implement getProjectTeam()
**Estimate:** 45 minutes
**Dependencies:** Task 2.1
**Capability:** team-listing (REQ-TL-001)

**Steps:**
1. Validate projectId parameter (UUID format)
2. Create Supabase server client
3. Query project_access with joins to profiles (user + granted_by)
4. Filter: deleted_at IS NULL
5. Order by created_at ASC
6. Return ActionResponse<TeamMember[]>

**Acceptance Criteria:**
- [ ] Returns all active team members for project
- [ ] Includes user profiles and audit info (granted_by, granted_at)
- [ ] RLS policies enforce access control
- [ ] Error handling for invalid projectId

---

### Task 2.3: Implement addTeamMember()
**Estimate:** 1 hour
**Dependencies:** Task 2.1
**Capability:** team-mutations (REQ-TM-001)

**Steps:**
1. Validate params: projectId, userId (UUIDs), role (enum)
2. Check user is org member: Query organization_members
3. Check user not already on project: Query project_access
4. Check caller is owner/admin (or rely on RLS)
5. INSERT into project_access with granted_by = auth.uid(), granted_at = now()
6. Return ActionResponse with new project_access.id

**Acceptance Criteria:**
- [ ] Successfully adds org member to project
- [ ] Sets granted_by and granted_at automatically
- [ ] Returns 400 if user not in org
- [ ] Returns 409 if user already on project
- [ ] RLS blocks non-owners/admins

---

### Task 2.4: Implement updateTeamMemberRole()
**Estimate:** 45 minutes
**Dependencies:** Task 2.1
**Capability:** team-mutations (REQ-TM-002)

**Steps:**
1. Validate params: projectAccessId (UUID), newRole (enum)
2. Query existing project_access record
3. Check if target is last manager: Query count of managers on project
4. If last manager and changing to non-manager role, return 400
5. UPDATE project_access SET role = newRole WHERE id = projectAccessId
6. Return success

**Acceptance Criteria:**
- [ ] Successfully updates team member role
- [ ] Prevents changing last manager's role
- [ ] Returns 400 with clear message if blocked
- [ ] RLS enforces authorization

---

### Task 2.5: Implement removeTeamMember()
**Estimate:** 45 minutes
**Dependencies:** Task 2.1
**Capability:** team-mutations (REQ-TM-003)

**Steps:**
1. Validate projectAccessId (UUID)
2. Query project_access to get role and project_id
3. If role is "manager", check count of managers on project
4. If last manager, return 400 error
5. UPDATE project_access SET deleted_at = now() WHERE id = projectAccessId (soft delete)
6. Return success

**Acceptance Criteria:**
- [ ] Successfully soft-deletes team member
- [ ] Prevents removing last manager
- [ ] Preserves audit trail (granted_by, granted_at remain)
- [ ] RLS enforces authorization

---

### Task 2.6: Implement getAvailableOrgMembers()
**Estimate:** 45 minutes
**Dependencies:** Task 2.1
**Capability:** team-mutations (REQ-TM-004)

**Steps:**
1. Validate params: orgId, projectId (UUIDs)
2. Query organization_members WHERE org_id = orgId AND deleted_at IS NULL
3. Exclude users already in project_access for projectId (WHERE deleted_at IS NULL)
4. Join with profiles to get email, full_name, avatar_url
5. Order by full_name ASC NULLS LAST, email ASC
6. Return ActionResponse<OrgMember[]>

**Acceptance Criteria:**
- [ ] Returns org members not currently on project
- [ ] Includes user profiles and org role
- [ ] Excludes soft-deleted org members
- [ ] Allows re-adding previously removed members

---

### Task 2.7: Write Server Action Unit Tests
**Estimate:** 2 hours
**Dependencies:** Tasks 2.2-2.6
**Capability:** team-listing, team-mutations

**Steps:**
1. Create test file: `lib/actions/projects/__tests__/team-management.test.ts`
2. Test getProjectTeam: returns active members only
3. Test addTeamMember: success case, duplicate error, non-member error
4. Test updateTeamMemberRole: success, last manager prevention
5. Test removeTeamMember: success, last manager prevention, soft delete
6. Test getAvailableOrgMembers: excludes current members

**Acceptance Criteria:**
- [ ] All server action tests pass
- [ ] Edge cases covered (last manager, duplicates, etc.)
- [ ] Error messages validated

---

## Phase 3: UI Components

### Task 3.1: Create Project Team Page
**Estimate:** 30 minutes
**Dependencies:** Task 2.2 (getProjectTeam)
**Capability:** team-listing

**Steps:**
1. Create file: `app/(dashboard)/[orgSlug]/projects/[projectId]/team/page.tsx`
2. Fetch project team using getProjectTeam server action
3. Fetch current user's org role to determine if owner/admin
4. Render TeamMemberList component
5. Show "Add Member" button if user is owner/admin

**Acceptance Criteria:**
- [ ] Page renders at /[orgSlug]/projects/[projectId]/team
- [ ] Displays team members list
- [ ] Shows add button only for owners/admins
- [ ] Loading state while fetching data

---

### Task 3.2: Create TeamMemberList Component
**Estimate:** 1 hour
**Dependencies:** Task 3.1
**Capability:** team-listing (REQ-TL-002, REQ-TL-003)

**Steps:**
1. Create file: `components/projects/team-member-list.tsx`
2. Accept props: teamMembers[], isOwnerOrAdmin boolean
3. Render list of TeamMemberRow components
4. Show empty state if no members
5. Pass isOwnerOrAdmin to each row for edit controls

**Acceptance Criteria:**
- [ ] Displays all team members
- [ ] Shows avatar, name, email, role for each member
- [ ] Conditionally shows edit controls based on isOwnerOrAdmin
- [ ] Empty state message when no members

---

### Task 3.3: Create TeamMemberRow Component
**Estimate:** 1.5 hours
**Dependencies:** Task 3.2
**Capability:** team-listing (REQ-TL-004), team-mutations

**Steps:**
1. Create file: `components/projects/team-member-row.tsx`
2. Display: Avatar, full name, email, role badge
3. Add tooltip/popover for audit info (granted by, granted at)
4. If isOwnerOrAdmin: Show role dropdown (manager/supervisor/viewer)
5. If isOwnerOrAdmin: Show remove button with confirmation dialog
6. Wire up role change → updateTeamMemberRole()
7. Wire up remove → removeTeamMember()

**Acceptance Criteria:**
- [ ] Displays member info with avatar and role badge
- [ ] Audit info accessible via tooltip/popover
- [ ] Role dropdown functional (owners/admins only)
- [ ] Remove button with confirmation (owners/admins only)
- [ ] Optimistic updates on role change

---

### Task 3.4: Create AddTeamMemberDialog Component
**Estimate:** 2 hours
**Dependencies:** Task 2.6 (getAvailableOrgMembers)
**Capability:** team-mutations (REQ-TM-001)

**Steps:**
1. Create file: `components/projects/add-team-member-dialog.tsx`
2. Trigger: Dialog/modal opens from "Add Member" button
3. Fetch available org members: getAvailableOrgMembers()
4. Form fields:
   - User select/dropdown (searchable)
   - Role select (manager/supervisor/viewer)
   - Trade input (optional)
5. Submit → addTeamMember()
6. On success: Close dialog, refetch team list
7. On error: Show error message

**Acceptance Criteria:**
- [ ] Dialog opens and closes properly
- [ ] Shows available org members (not already on project)
- [ ] Role selection required
- [ ] Trade field optional
- [ ] Success: Adds member and closes dialog
- [ ] Error: Displays error message in dialog

---

### Task 3.5: Integrate React Query for Data Fetching
**Estimate:** 1 hour
**Dependencies:** Tasks 3.1-3.4
**Capability:** team-listing (REQ-TL-006)

**Steps:**
1. Create React Query hook: `hooks/use-project-team.ts`
2. Define useProjectTeam(projectId) with queryKey ['project-team', projectId]
3. Define useAvailableOrgMembers(orgId, projectId) with queryKey
4. Set staleTime: 30 seconds
5. Implement optimistic updates for mutations
6. Invalidate queries on add/update/remove success

**Acceptance Criteria:**
- [ ] React Query hooks created and functional
- [ ] Queries cached for 30 seconds
- [ ] Mutations trigger refetch
- [ ] Optimistic updates work correctly

---

### Task 3.6: Add Navigation Link to Team Page
**Estimate:** 15 minutes
**Dependencies:** Task 3.1
**Capability:** team-listing

**Steps:**
1. Find project navigation component (likely in project layout or sidebar)
2. Add "Team" link to /[orgSlug]/projects/[projectId]/team
3. Add icon (e.g., Users icon)
4. Ensure link is visible to all project members

**Acceptance Criteria:**
- [ ] "Team" link visible in project navigation
- [ ] Clicking link navigates to team page
- [ ] Link styled consistently with other nav items

---

## Phase 4: Testing & Validation

### Task 4.1: E2E Test - Owner Adds Team Member
**Estimate:** 1 hour
**Dependencies:** All Phase 3 tasks
**Capability:** team-mutations

**Steps:**
1. Create Playwright test: `e2e/project-team-management.spec.ts`
2. Setup: Create org, owner, project, available member
3. Login as owner
4. Navigate to project team page
5. Click "Add Member" button
6. Select user and role, submit
7. Assert: New member appears in team list

**Acceptance Criteria:**
- [ ] Test passes end-to-end
- [ ] New member successfully added
- [ ] UI updates immediately

---

### Task 4.2: E2E Test - Owner Updates Member Role
**Estimate:** 45 minutes
**Dependencies:** Task 4.1
**Capability:** team-mutations

**Steps:**
1. Setup: Project with member having role "viewer"
2. Login as owner
3. Navigate to team page
4. Change member role to "supervisor" via dropdown
5. Assert: Role badge updates to "Supervisor"

**Acceptance Criteria:**
- [ ] Role update succeeds
- [ ] UI reflects new role immediately
- [ ] Database updated correctly

---

### Task 4.3: E2E Test - Owner Removes Team Member
**Estimate:** 45 minutes
**Dependencies:** Task 4.1
**Capability:** team-mutations

**Steps:**
1. Setup: Project with 2 managers and 1 viewer
2. Login as owner
3. Navigate to team page
4. Click remove button for viewer
5. Confirm removal in dialog
6. Assert: Member removed from list

**Acceptance Criteria:**
- [ ] Member successfully removed
- [ ] UI updates immediately
- [ ] Soft delete applied (deleted_at set)

---

### Task 4.4: E2E Test - Cannot Remove Last Manager
**Estimate:** 30 minutes
**Dependencies:** Task 4.1
**Capability:** team-mutations

**Steps:**
1. Setup: Project with only 1 manager
2. Login as owner
3. Navigate to team page
4. Attempt to remove the only manager
5. Assert: Error message displayed
6. Assert: Manager still in team list

**Acceptance Criteria:**
- [ ] Removal blocked with clear error message
- [ ] Manager remains on project
- [ ] UI handles error gracefully

---

### Task 4.5: E2E Test - Non-Owner Views Team (Read-Only)
**Estimate:** 30 minutes
**Dependencies:** Task 4.1
**Capability:** team-listing

**Steps:**
1. Setup: Project with manager (not owner/admin in org)
2. Login as manager
3. Navigate to team page
4. Assert: Team list displayed
5. Assert: No "Add Member" button
6. Assert: No role dropdowns or remove buttons

**Acceptance Criteria:**
- [ ] Manager can view team list
- [ ] No edit controls visible
- [ ] Read-only experience confirmed

---

### Task 4.6: Manual QA Checklist
**Estimate:** 1 hour
**Dependencies:** All Phase 3 tasks
**Capability:** All

**Checklist:**
- [ ] Add team member flow works end-to-end
- [ ] Update role flow works end-to-end
- [ ] Remove team member flow works end-to-end
- [ ] Last manager protection works
- [ ] Duplicate member error handled
- [ ] Non-org member error handled
- [ ] Audit info displayed correctly
- [ ] Optimistic updates work without flickering
- [ ] Error messages are clear and actionable
- [ ] Mobile responsive layout
- [ ] Accessibility: Keyboard navigation works
- [ ] Accessibility: Screen reader labels present

---

## Phase 5: Documentation & Cleanup

### Task 5.1: Update User Documentation
**Estimate:** 30 minutes
**Dependencies:** All implementation complete
**Capability:** All

**Steps:**
1. Create or update: `docs/features/project-team-management.md`
2. Document: How to add team members
3. Document: How to update roles
4. Document: How to remove members
5. Document: Role differences (manager/supervisor/viewer)
6. Add screenshots or GIFs if applicable

**Acceptance Criteria:**
- [ ] Documentation complete and accurate
- [ ] Screenshots/visuals included
- [ ] Clear step-by-step instructions

---

### Task 5.2: Add Inline Help Text
**Estimate:** 30 minutes
**Dependencies:** All Phase 3 tasks
**Capability:** All

**Steps:**
1. Add tooltip to role badges explaining permissions
2. Add help text to "Add Member" dialog explaining roles
3. Add explanation near trade field (optional, for supervisors)
4. Add info icon next to "Team" nav link explaining feature

**Acceptance Criteria:**
- [ ] Help text added in key locations
- [ ] Explanations are clear and concise
- [ ] UI not cluttered by help text

---

### Task 5.3: Performance Testing with Large Teams
**Estimate:** 1 hour
**Dependencies:** All implementation complete
**Capability:** team-listing, team-authorization

**Steps:**
1. Create test project with 50+ team members (script or manual)
2. Measure page load time for team list
3. Measure RLS policy evaluation time (EXPLAIN ANALYZE)
4. Ensure page load < 500ms
5. Ensure policy evaluation < 50ms
6. If slow, consider pagination or optimization

**Acceptance Criteria:**
- [ ] Team list loads in < 500ms with 50 members
- [ ] RLS policies evaluated in < 50ms
- [ ] No performance degradation

---

### Task 5.4: Archive OpenSpec Change
**Estimate:** 15 minutes
**Dependencies:** All tasks complete
**Capability:** All

**Steps:**
1. Run: `/openspec:archive add-project-team-management`
2. Confirm all success criteria met in proposal.md
3. Update project.md with new capability references
4. Move change to `openspec/changes/deployed/`

**Acceptance Criteria:**
- [ ] Change archived successfully
- [ ] project.md updated
- [ ] Deployed directory contains change

---

## Summary

**Total Estimated Time:** ~20-25 hours

**Phase Breakdown:**
- Phase 1 (Database): ~2.5 hours
- Phase 2 (Server Actions): ~6.5 hours
- Phase 3 (UI): ~7 hours
- Phase 4 (Testing): ~4.5 hours
- Phase 5 (Documentation): ~2.5 hours

**Critical Path:**
1. Task 1.1-1.2: RLS policies (required for everything)
2. Task 2.1-2.6: Server actions (required for UI)
3. Task 3.1-3.5: UI implementation
4. Task 4.1-4.5: E2E tests

**Risk Areas:**
- RLS policy performance with large orgs (Task 5.3)
- Last manager validation edge cases (Tasks 2.4, 2.5, 4.4)
- Optimistic updates complexity (Task 3.5)
