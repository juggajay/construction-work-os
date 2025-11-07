# Tasks: Add Role-Based Permissions and Project Team UI

## Overview
This document breaks down the implementation into ordered, verifiable tasks. Tasks are grouped by phase and can be worked on in parallel where noted.

---

## Phase 1: Database & RLS Layer (Foundation)

### Task 1.1: Create Permission Helper Functions Migration
**Estimate:** 2 hours | **Dependencies:** None | **Verification:** Unit tests pass

Create SQL migration file with all permission check functions:

1. Create file: `supabase/migrations/YYYYMMDD_create_permission_functions.sql`
2. Implement functions:
   - `can_edit_budget(user_uuid, check_project_id)`
   - `can_create_cost(user_uuid, check_project_id)`
   - `can_edit_cost(user_uuid, check_project_id, cost_id)` - checks ownership for supervisors
   - `can_delete_cost(user_uuid, check_project_id, cost_id)` - checks ownership for supervisors
   - `can_create_change_order(user_uuid, check_project_id)`
   - `can_approve_change_order(user_uuid, check_project_id)`
   - `can_create_daily_report(user_uuid, check_project_id)`
   - `can_edit_daily_report(user_uuid, check_project_id, report_id)` - checks ownership
   - `can_submit_rfi(user_uuid, check_project_id)`
   - `can_respond_to_rfi(user_uuid, check_project_id)`
   - `can_close_rfi(user_uuid, check_project_id)`
   - `can_create_submittal(user_uuid, check_project_id)`
   - `can_review_submittal(user_uuid, check_project_id)`
   - `can_approve_submittal(user_uuid, check_project_id)`
   - `can_manage_team(user_uuid, check_project_id)`
   - `can_edit_project(user_uuid, check_project_id)`
   - `can_delete_project(user_uuid, check_project_id)`
3. Each function uses `SECURITY DEFINER` for proper privilege handling
4. Test locally with `npm run db:reset`

**Verification:**
```sql
-- Test as different roles
SELECT can_edit_budget('owner-uuid', 'project-uuid');  -- Should return TRUE
SELECT can_edit_budget('viewer-uuid', 'project-uuid'); -- Should return FALSE
```

---

### Task 1.2: Update user_project_ids() Function
**Estimate:** 1 hour | **Dependencies:** None | **Verification:** Query tests pass

Modify project visibility logic:

1. Create file: `supabase/migrations/YYYYMMDD_update_user_project_ids_function.sql`
2. Drop existing function: `DROP FUNCTION IF EXISTS user_project_ids(UUID);`
3. Recreate with new logic:
   - Owners/admins: Return ALL org projects
   - Regular members: Return ONLY assigned projects
4. Test with various user roles
5. Verify performance with EXPLAIN ANALYZE

**Verification:**
```sql
-- Test as owner (should see all projects)
SELECT * FROM user_project_ids('owner-uuid');

-- Test as regular member (should see only assigned)
SELECT * FROM user_project_ids('member-uuid');
```

---

### Task 1.3: Add Performance Indexes
**Estimate:** 30 min | **Dependencies:** None | **Verification:** Index created

Create indexes for permission queries:

1. Create file: `supabase/migrations/YYYYMMDD_add_permission_indexes.sql`
2. Add indexes:
```sql
CREATE INDEX IF NOT EXISTS idx_project_access_user_not_deleted
  ON project_access(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_org_members_user_role_not_deleted
  ON organization_members(user_id, role)
  WHERE deleted_at IS NULL AND joined_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_project_access_project_role
  ON project_access(project_id, role) WHERE deleted_at IS NULL;
```

**Verification:** Check indexes exist with `\d+ project_access`

---

### Task 1.4: Update RLS Policies for Permissions
**Estimate:** 3 hours | **Dependencies:** Task 1.1 | **Verification:** RLS tests pass

Update RLS policies on tables to use permission functions:

1. Create file: `supabase/migrations/YYYYMMDD_update_rls_for_permissions.sql`
2. Update policies for:
   - `project_budgets`: Use `can_edit_budget()` for UPDATE
   - `project_costs`: Use `can_create_cost()` for INSERT, `can_edit_cost()` for UPDATE
   - `change_orders`: Use `can_approve_change_order()` for approval updates
   - `daily_reports`: Use `can_create_daily_report()` for INSERT
   - `rfis`: Use `can_submit_rfi()`, `can_respond_to_rfi()`
   - `submittals`: Use `can_approve_submittal()` for approval
3. Keep SELECT policies broad (any project member can view)
4. Test each policy with different roles

**Verification:** Attempt unauthorized operations and verify they're blocked

---

### Task 1.5: Create Migration Script for Existing Users
**Estimate:** 2 hours | **Dependencies:** None | **Verification:** Script tested locally

Create script to assign all org members to all projects:

1. Create file: `scripts/migrate-project-access.sql`
2. Script should:
   - Assign all org members to all projects in their org
   - Set owners/admins as "manager" role
   - Set regular members as "viewer" role
   - Skip if project_access entry already exists
   - Log number of assignments created
3. Test on local database with sample data
4. Create rollback script

**Verification:** Run script locally, verify all members can access projects

---

## Phase 2: Application Permission Layer

### Task 2.1: Create Permission Utility Module
**Estimate:** 2 hours | **Dependencies:** Task 1.1 | **Verification:** Unit tests pass

Build application-level permission checking:

1. Create file: `lib/permissions/index.ts`
2. Implement:
   - `Permission` type enum
   - `hasPermission(check)` function - calls RPC
   - `assertPermission(check)` function - throws if denied
   - `getUserPermissions(projectId)` function - batch check
3. Create file: `lib/permissions/constants.ts` with permission constants
4. Write unit tests in `__tests__/lib/permissions.test.ts`

**Verification:** Run `npm test -- permissions`

---

### Task 2.2: Create Permission API Routes
**Estimate:** 1 hour | **Dependencies:** Task 2.1 | **Verification:** API tests pass

Build API endpoints for permission checks:

1. Create file: `app/api/permissions/check/route.ts`
   - GET endpoint: Check single permission
   - Params: `permission`, `projectId`
   - Returns: `{ allowed: boolean }`
2. Create file: `app/api/permissions/route.ts`
   - GET endpoint: Batch check all permissions
   - Params: `projectId`
   - Returns: `{ permissions: Permission[] }`
3. Add error handling and validation
4. Test with curl or Postman

**Verification:**
```bash
curl http://localhost:3000/api/permissions/check?permission=edit_budget&projectId=abc
```

---

### Task 2.3: Create Permission React Hook
**Estimate:** 1 hour | **Dependencies:** Task 2.2 | **Verification:** Component tests

Build React hooks for permission checks:

1. Create file: `hooks/use-permission.ts`
2. Implement:
   - `usePermission(permission, projectId)` - single check
   - `usePermissions(projectId)` - batch check
3. Use React Query for caching (5 min stale time)
4. Handle loading and error states
5. Write component tests

**Verification:** Test in Storybook or demo component

---

### Task 2.4: Create PermissionGate Component
**Estimate:** 1 hour | **Dependencies:** Task 2.3 | **Verification:** Storybook stories

Build conditional rendering component:

1. Create file: `components/permissions/permission-gate.tsx`
2. Props: `permission`, `projectId`, `children`, `fallback`
3. Uses `usePermission` hook
4. Shows children if allowed, fallback if not
5. Create Storybook stories demonstrating usage
6. Add TypeScript types

**Verification:** Storybook renders correctly with mock permissions

---

### Task 2.5: Update Server Actions with Permission Checks
**Estimate:** 3 hours | **Dependencies:** Task 2.1 | **Verification:** Integration tests

Add permission validation to server actions:

1. Update files (add `assertPermission` calls):
   - `lib/actions/budgets/update-budget-allocation.ts`
   - `lib/actions/costs/create-cost.ts`
   - `lib/actions/costs/update-cost.ts`
   - `lib/actions/costs/delete-cost.ts`
   - `lib/actions/change-orders/approve-change-order.ts`
   - `lib/actions/daily-reports/create-daily-report.ts`
   - And others as needed
2. Pattern: Check permission before existing logic
3. Write integration tests for each action
4. Verify unauthorized calls return 403

**Verification:** Run integration test suite

---

## Phase 3: Project Team UI Components

**Note:** Tasks 3.1-3.5 can be worked on in parallel after database layer is complete.

### Task 3.1: Create Team Page Route
**Estimate:** 1 hour | **Dependencies:** None | **Verification:** Page loads

Set up the team page:

1. Create file: `app/(dashboard)/[orgSlug]/projects/[projectId]/team/page.tsx`
2. Fetch data server-side:
   - `getProject(projectId)`
   - `getProjectTeam(projectId)`
   - `getAvailableOrgMembers({orgId, projectId})`
3. Pass to client component
4. Add metadata and page title
5. Test page loads without errors

**Verification:** Navigate to `/org/test/projects/123/team`

---

### Task 3.2: Add Team Navigation Tab
**Estimate:** 30 min | **Dependencies:** None | **Verification:** Tab visible

Add team to project navigation:

1. Update file: `app/(dashboard)/[orgSlug]/projects/[projectId]/layout.tsx`
2. Add "Team" tab to navigation array
3. Position after "Costs" tab
4. Add icon (Users icon from lucide-react)
5. Test navigation and active state

**Verification:** Tab appears and navigates correctly

---

### Task 3.3: Create TeamMemberRow Component
**Estimate:** 2 hours | **Dependencies:** Task 2.4 | **Verification:** Storybook

Build individual team member row:

1. Create file: `app/(dashboard)/[orgSlug]/projects/[projectId]/team/_components/team-member-row.tsx`
2. Display:
   - Avatar (with fallback to initials)
   - Name and email
   - Role badge OR role select (based on permissions)
   - Remove button (if authorized)
   - Audit info (added date, granted by)
3. Handle role change with optimistic update
4. Handle remove with confirmation
5. Create Storybook stories (authorized and unauthorized states)

**Verification:** Storybook renders all states correctly

---

### Task 3.4: Create TeamMemberList Component
**Estimate:** 2 hours | **Dependencies:** Task 3.3 | **Verification:** Component renders

Build team list container:

1. Create file: `app/(dashboard)/[orgSlug]/projects/[projectId]/team/_components/team-member-list.tsx`
2. Group members by role (managers, supervisors, viewers)
3. Show section headers with counts
4. Render TeamMemberRow for each member
5. Handle empty states
6. Use React Query for data management
7. Test with various team sizes

**Verification:** Renders correctly with different team compositions

---

### Task 3.5: Create AddTeamMemberDialog Component
**Estimate:** 3 hours | **Dependencies:** Task 2.4 | **Verification:** Dialog works end-to-end

Build add member dialog:

1. Create file: `app/(dashboard)/[orgSlug]/projects/[projectId]/team/_components/add-team-member-dialog.tsx`
2. Form fields:
   - Member select (combobox with search)
   - Role select (with descriptions)
3. Validation with Zod schema
4. Submit with optimistic update
5. Error handling and toast notifications
6. Loading states
7. Close dialog on success
8. Write E2E test for full flow

**Verification:** Can successfully add members

---

### Task 3.6: Create TeamStats Component
**Estimate:** 1 hour | **Dependencies:** None | **Verification:** Stats display correctly

Build team statistics display:

1. Create file: `app/(dashboard)/[orgSlug]/projects/[projectId]/team/_components/team-stats.tsx`
2. Show:
   - Total members
   - Count by role
3. Style as stat cards
4. Update automatically when team changes
5. Responsive layout

**Verification:** Counts match actual team composition

---

### Task 3.7: Create TeamHeader Component
**Estimate:** 1 hour | **Dependencies:** Task 3.5 | **Verification:** Header renders

Build page header with actions:

1. Create file: `app/(dashboard)/[orgSlug]/projects/[projectId]/team/_components/team-header.tsx`
2. Display:
   - Page title "Project Team"
   - Description
   - Add Member button (with PermissionGate)
3. Responsive layout

**Verification:** Header displays correctly on all screen sizes

---

### Task 3.8: Integrate Components into Team Page
**Estimate:** 1 hour | **Dependencies:** Tasks 3.1-3.7 | **Verification:** Full page works

Compose the final page:

1. Update `team/page.tsx`
2. Add all components:
   - TeamHeader
   - TeamStats
   - TeamMemberList
3. Handle loading states
4. Handle error states
5. Test full user flow

**Verification:** Complete team management workflow works

---

### Task 3.9: Add Team Link to Project Overview
**Estimate:** 30 min | **Dependencies:** None | **Verification:** Link works

Add quick access from project overview:

1. Update project overview page metrics
2. Add "Team" metric card showing member count
3. Make card clickable to navigate to team page
4. Test navigation

**Verification:** Click team metric, navigate to team page

---

## Phase 4: Testing & Documentation

### Task 4.1: Write Unit Tests
**Estimate:** 4 hours | **Dependencies:** All implementation tasks | **Verification:** Tests pass

Create comprehensive unit tests:

1. Test permission utility functions
2. Test permission hooks
3. Test PermissionGate component
4. Test TeamMemberRow interactions
5. Test AddTeamMemberDialog validation
6. Aim for >80% coverage

**Verification:** Run `npm test` and check coverage report

---

### Task 4.2: Write Integration Tests
**Estimate:** 3 hours | **Dependencies:** All implementation tasks | **Verification:** Tests pass

Test end-to-end flows:

1. Test permission enforcement at API level
2. Test server action authorization
3. Test RLS policy enforcement
4. Test team management API flows

**Verification:** Run `npm run test:integration`

---

### Task 4.3: Write E2E Tests
**Estimate:** 4 hours | **Dependencies:** All implementation tasks | **Verification:** Tests pass

Test full user journeys:

1. Test org admin adding team member
2. Test org admin changing roles
3. Test org admin removing member
4. Test manager viewing team (read-only)
5. Test supervisor trying unauthorized actions
6. Test project visibility for different roles
7. Use Playwright or similar

**Verification:** Run `npm run test:e2e`

---

### Task 4.4: Test Accessibility
**Estimate:** 2 hours | **Dependencies:** Task 3.8 | **Verification:** Axe scan passes

Ensure accessibility compliance:

1. Run axe-core scan on team pages
2. Fix any violations
3. Test keyboard navigation
4. Test with screen reader
5. Verify focus management in dialogs
6. Check color contrast

**Verification:** Zero axe violations, keyboard navigation works

---

### Task 4.5: Update Documentation
**Estimate:** 2 hours | **Dependencies:** All implementation tasks | **Verification:** Docs complete

Document the new features:

1. Update `README.md` with permissions overview
2. Create permissions matrix doc (role → capabilities table)
3. Document migration procedure
4. Add JSDoc comments to key functions
5. Update API documentation

**Verification:** Docs are clear and complete

---

## Phase 5: Migration & Deployment

### Task 5.1: Test Migration Locally
**Estimate:** 1 hour | **Dependencies:** Task 1.5 | **Verification:** Migration successful

Verify migration works:

1. Create fresh local database with sample data
2. Run migration script
3. Verify all members have project access
4. Test project visibility for each role
5. Test rollback script

**Verification:** All users can access appropriate projects

---

### Task 5.2: Deploy to Staging
**Estimate:** 2 hours | **Dependencies:** All tasks | **Verification:** Staging works

Deploy to staging environment:

1. Apply database migrations
2. Run migration script
3. Deploy application code
4. Smoke test key features:
   - Permission checks
   - Team management
   - Project visibility
5. Fix any staging-specific issues

**Verification:** Full E2E test suite passes in staging

---

### Task 5.3: Monitor and Address Issues
**Estimate:** Ongoing | **Dependencies:** Task 5.2 | **Verification:** No critical bugs

Post-deployment monitoring:

1. Monitor error logs for permission errors
2. Check performance metrics
3. Gather user feedback
4. Address any reported issues
5. Iterate based on usage patterns

**Verification:** Error rates remain low, no access complaints

---

## Task Summary

**Total Estimated Time:** 35-45 hours

**Phase Breakdown:**
- Phase 1 (Database): 8-10 hours
- Phase 2 (Permissions): 8-10 hours
- Phase 3 (UI): 10-12 hours
- Phase 4 (Testing): 13-15 hours
- Phase 5 (Deployment): 3-4 hours

**Parallelization Opportunities:**
- Phase 2 and Phase 3 can partially overlap (start UI after database is done)
- Within Phase 3, tasks 3.1-3.7 can be split among developers

**Critical Path:**
1. Database layer (Phase 1) must complete first
2. Permission utilities (Phase 2) needed for UI permission gates
3. UI components (Phase 3) depend on permission system
4. Testing (Phase 4) validates everything
5. Deployment (Phase 5) brings it to production

---

## Testing Checkpoints

After each phase, run these verification steps:

**After Phase 1:**
```sql
-- Test permission functions
SELECT can_edit_budget('test-user', 'test-project');

-- Test project visibility
SELECT * FROM user_project_ids('test-user');
```

**After Phase 2:**
```typescript
// Test permission utilities
const allowed = await hasPermission({
  permission: 'edit_budget',
  projectId: 'test-project',
});
console.log({ allowed });
```

**After Phase 3:**
- Navigate to team page
- Add a member
- Change a role
- Remove a member

**After Phase 4:**
```bash
npm test              # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e      # E2E tests
```

**After Phase 5:**
- Verify all features in production
- Monitor for 24-48 hours
- Gather user feedback
