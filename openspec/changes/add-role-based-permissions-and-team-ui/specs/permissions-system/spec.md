# Spec: Granular Permissions System

## Overview
Implement a role-based permissions system that defines what actions each role can perform on projects and project resources.

## ADDED Requirements

### Requirement: PERM-001 - Permission Helper Functions
**Priority:** HIGH | **Status:** Added

Create database functions to check user permissions for specific actions.

#### Scenario: Check budget edit permission for manager
**Given** Alice is a project manager on "Project A"
**When** `can_edit_budget(alice_id, project_a_id)` is called
**Then** it returns TRUE
**Because** managers can edit budgets

#### Scenario: Check budget edit permission for supervisor
**Given** Bob is a supervisor on "Project A"
**When** `can_edit_budget(bob_id, project_a_id)` is called
**Then** it returns FALSE
**Because** supervisors cannot edit budgets

#### Scenario: Check cost creation permission for supervisor
**Given** Carol is a supervisor on "Project B"
**When** `can_create_cost(carol_id, project_b_id)` is called
**Then** it returns TRUE
**Because** supervisors can create costs

#### Scenario: Check cost creation permission for viewer
**Given** Dan is a viewer on "Project B"
**When** `can_create_cost(dan_id, project_b_id)` is called
**Then** it returns FALSE
**Because** viewers have read-only access

#### Scenario: Owner has all permissions regardless of project assignment
**Given** Eve is an owner of the organization
**And** Eve has no project_access entry for "Project C"
**When** `can_edit_budget(eve_id, project_c_id)` is called
**Then** it returns TRUE
**Because** owners have organization-wide permissions

#### Scenario: Permission functions use security definer
**Given** any permission check function is called
**When** the function executes
**Then** it runs with elevated privileges (SECURITY DEFINER)
**And** users cannot bypass RLS by calling the function directly
**Because** the function still checks auth.uid()

---

### Requirement: PERM-002 - Budget Permissions
**Priority:** HIGH | **Status:** Added

Define who can view, edit, and allocate budgets.

#### Scenario: Managers can edit project budgets
**Given** Alice is a manager on "Project A"
**When** Alice attempts to update the budget
**Then** the operation succeeds
**And** the budget is updated in the database

#### Scenario: Supervisors can view but not edit budgets
**Given** Bob is a supervisor on "Project A"
**When** Bob views the budget page
**Then** he sees all budget details
**And** the "Edit Budget" button is hidden
**When** Bob attempts a direct API call to update budget
**Then** the server returns 403 Forbidden

#### Scenario: Viewers can view but not edit budgets
**Given** Carol is a viewer on "Project A"
**When** Carol views the budget page
**Then** she sees budget details
**And** sees no edit or allocation controls

#### Scenario: Budget allocation requires manager or admin role
**Given** Dan is a supervisor on "Project A"
**When** Dan attempts to allocate budget to a cost code
**Then** the server returns 403 Forbidden
**And** the allocation is not saved

---

### Requirement: PERM-003 - Cost Permissions
**Priority:** HIGH | **Status:** Added

Define who can create, edit, and delete project costs.

#### Scenario: Supervisors can create costs
**Given** Alice is a supervisor on "Project A"
**When** Alice creates a cost entry for $500
**Then** the cost is created successfully
**And** Alice is recorded as the creator

#### Scenario: Supervisors can edit their own costs
**Given** Bob is a supervisor who created Cost #123
**When** Bob attempts to edit Cost #123
**Then** the update succeeds
**And** the updated_at timestamp is updated

#### Scenario: Supervisors cannot edit others' costs
**Given** Carol is a supervisor
**And** Dan is another supervisor who created Cost #456
**When** Carol attempts to edit Cost #456
**Then** the server returns 403 Forbidden
**And** the cost remains unchanged

#### Scenario: Managers can edit any cost on their project
**Given** Eve is a manager on "Project A"
**And** Cost #123 was created by supervisor Alice
**When** Eve attempts to edit Cost #123
**Then** the update succeeds
**Because** managers have full cost control

#### Scenario: Viewers cannot create costs
**Given** Frank is a viewer on "Project A"
**When** Frank attempts to create a cost
**Then** the server returns 403 Forbidden
**And** no cost is created

#### Scenario: Supervisors can delete their own costs
**Given** Alice created Cost #123
**When** Alice attempts to delete Cost #123
**Then** the cost is soft-deleted
**And** deleted_at timestamp is set

---

### Requirement: PERM-004 - Change Order Permissions
**Priority:** HIGH | **Status:** Added

Define who can create, approve, and reject change orders.

#### Scenario: Supervisors can create change orders
**Given** Alice is a supervisor on "Project A"
**When** Alice creates a change order for $10,000
**Then** the change order is created with status "pending"
**And** Alice cannot self-approve it

#### Scenario: Only managers can approve change orders
**Given** Bob is a manager on "Project A"
**And** Change Order #123 is pending approval
**When** Bob approves the change order
**Then** the status changes to "approved"
**And** the budget is updated accordingly

#### Scenario: Supervisors cannot approve change orders
**Given** Carol is a supervisor on "Project A"
**And** Change Order #123 is pending approval
**When** Carol attempts to approve it
**Then** the server returns 403 Forbidden
**And** the change order remains pending

#### Scenario: Viewers can view but not create change orders
**Given** Dan is a viewer on "Project A"
**When** Dan views the change orders page
**Then** he sees all change orders with their statuses
**And** the "Create Change Order" button is hidden

#### Scenario: Managers can reject change orders
**Given** Eve is a manager on "Project A"
**And** Change Order #456 is pending approval
**When** Eve rejects the change order with reason "Exceeds budget"
**Then** the status changes to "rejected"
**And** the rejection reason is recorded

---

### Requirement: PERM-005 - Daily Reports Permissions
**Priority:** MEDIUM | **Status:** Added

Define who can create and edit daily reports.

#### Scenario: Supervisors can create daily reports
**Given** Alice is a supervisor on "Project A"
**When** Alice creates a daily report for today
**Then** the report is created successfully
**And** Alice is recorded as the author

#### Scenario: Supervisors can edit their own reports
**Given** Bob created Daily Report #123
**When** Bob edits the report within 24 hours
**Then** the update succeeds
**And** the updated content is saved

#### Scenario: Supervisors cannot edit others' reports
**Given** Carol is a supervisor
**And** Dan created Daily Report #456
**When** Carol attempts to edit the report
**Then** the server returns 403 Forbidden

#### Scenario: Managers can edit any daily report
**Given** Eve is a manager on "Project A"
**And** Daily Report #123 was created by supervisor Alice
**When** Eve edits the report
**Then** the update succeeds
**Because** managers have full project control

#### Scenario: Viewers cannot create daily reports
**Given** Frank is a viewer on "Project A"
**When** Frank attempts to create a daily report
**Then** the server returns 403 Forbidden

---

### Requirement: PERM-006 - RFI Permissions
**Priority:** MEDIUM | **Status:** Added

Define who can submit, respond to, and close RFIs.

#### Scenario: Supervisors can submit RFIs
**Given** Alice is a supervisor on "Project A"
**When** Alice submits an RFI asking "What are the concrete specs?"
**Then** the RFI is created with status "open"
**And** Alice is recorded as the submitter

#### Scenario: Only managers can respond to RFIs
**Given** Bob is a manager on "Project A"
**And** RFI #123 is open
**When** Bob responds with "See spec sheet A-102"
**Then** the response is recorded
**And** the RFI status can be updated to "responded"

#### Scenario: Supervisors cannot respond to RFIs
**Given** Carol is a supervisor on "Project A"
**And** RFI #123 is open
**When** Carol attempts to respond
**Then** the server returns 403 Forbidden
**Because** only managers/admins can provide official responses

#### Scenario: Managers can close RFIs
**Given** Dan is a manager on "Project A"
**And** RFI #123 has been responded to
**When** Dan closes the RFI
**Then** the status changes to "closed"
**And** the closed_at timestamp is recorded

#### Scenario: Viewers can view RFIs but not submit
**Given** Eve is a viewer on "Project A"
**When** Eve views the RFI list
**Then** she sees all RFIs with their statuses
**And** the "Submit RFI" button is hidden

---

### Requirement: PERM-007 - Submittal Permissions
**Priority:** MEDIUM | **Status:** Added

Define who can create, review, and approve submittals.

#### Scenario: Supervisors can create submittals
**Given** Alice is a supervisor on "Project A"
**When** Alice creates a submittal for "Steel Beam Specs"
**Then** the submittal is created with status "pending_review"

#### Scenario: Supervisors can review submittals
**Given** Bob is a supervisor on "Project A"
**And** Submittal #123 is pending review
**When** Bob reviews the submittal and marks it "reviewed"
**Then** the status changes to "pending_approval"
**And** Bob's review notes are recorded

#### Scenario: Only managers can approve submittals
**Given** Carol is a manager on "Project A"
**And** Submittal #123 is pending approval
**When** Carol approves the submittal
**Then** the status changes to "approved"
**And** the approval timestamp is recorded

#### Scenario: Supervisors cannot approve submittals
**Given** Dan is a supervisor on "Project A"
**And** Submittal #123 is pending approval
**When** Dan attempts to approve it
**Then** the server returns 403 Forbidden
**Because** only managers/admins can give final approval

#### Scenario: Viewers cannot create submittals
**Given** Eve is a viewer on "Project A"
**When** Eve attempts to create a submittal
**Then** the server returns 403 Forbidden

---

### Requirement: PERM-008 - Team Management Permissions
**Priority:** HIGH | **Status:** Added

Define who can view and manage project teams.

#### Scenario: All project members can view team
**Given** Alice is a viewer on "Project A"
**When** Alice navigates to the team page
**Then** she sees all team members with their roles
**And** she cannot edit or remove members

#### Scenario: Only org admins/owners can manage team
**Given** Bob is a manager on "Project A"
**And** Bob is not an org admin or owner
**When** Bob views the team page
**Then** he sees team members
**And** the "Add Member" button is hidden
**And** he cannot change roles or remove members

#### Scenario: Org admins can add team members
**Given** Carol is an org admin
**When** Carol adds Dan to "Project A" as a supervisor
**Then** Dan is added to the project_access table
**And** Dan can now access the project

#### Scenario: Org admins can change team member roles
**Given** Eve is an org admin
**And** Frank is currently a viewer on "Project A"
**When** Eve changes Frank's role to supervisor
**Then** Frank's permissions are updated
**And** Frank can now create costs and reports

#### Scenario: Org admins can remove team members
**Given** George is an org owner
**And** Alice is a supervisor on "Project A"
**When** George removes Alice from the project
**Then** Alice loses access to "Project A"
**And** Alice can no longer view or work on it

---

### Requirement: PERM-009 - Project Management Permissions
**Priority:** HIGH | **Status:** Added

Define who can edit and delete projects.

#### Scenario: Managers can edit their project details
**Given** Alice is a manager on "Project A"
**When** Alice updates the project name to "Project A - Phase 2"
**Then** the update succeeds
**And** the project name is changed

#### Scenario: Supervisors cannot edit project details
**Given** Bob is a supervisor on "Project A"
**When** Bob attempts to update project details
**Then** the server returns 403 Forbidden

#### Scenario: Only org admins can delete projects
**Given** Carol is a manager on "Project A"
**When** Carol attempts to delete the project
**Then** the server returns 403 Forbidden
**Because** only org admins/owners can delete projects

#### Scenario: Org owners can delete any project
**Given** Dan is an org owner
**When** Dan deletes "Project B"
**Then** the project is soft-deleted (deleted_at timestamp set)
**And** all team members lose access to it

---

### Requirement: PERM-010 - Permission Caching and Performance
**Priority:** MEDIUM | **Status:** Added

Permission checks must be performant and cacheable.

#### Scenario: Permission checks complete within 50ms
**Given** a user makes a permission check request
**When** `hasPermission()` is called
**Then** the database query completes in under 50ms
**And** uses indexed queries

#### Scenario: Client caches permission results for 5 minutes
**Given** Alice checks if she can edit budgets on "Project A"
**When** the result is returned
**Then** the client caches the result for 5 minutes
**And** subsequent checks within 5 minutes use cached value
**And** do not make additional API calls

#### Scenario: Batch permission checks reduce round trips
**Given** a page needs to check 5 different permissions
**When** the page loads
**Then** all 5 permissions are checked in a single API call
**And** results are returned as a batch

---

### Requirement: PERM-011 - Permission Enforcement Layers
**Priority:** HIGH | **Status:** Added

Permissions must be enforced at multiple layers for security.

#### Scenario: RLS policies enforce database-level permissions
**Given** Alice is a viewer on "Project A"
**When** Alice attempts a direct SQL INSERT on project_costs
**Then** the RLS policy blocks the insert
**And** returns a permissions error

#### Scenario: Server actions validate permissions before execution
**Given** Bob is a supervisor
**When** Bob calls the `approveChangeOrder()` server action
**Then** the action checks permissions first
**And** throws ForbiddenError before attempting database write

#### Scenario: UI hides unauthorized actions
**Given** Carol is a viewer on "Project A"
**When** Carol views the budgets page
**Then** edit and delete buttons are not rendered
**Because** the PermissionGate component hides them

#### Scenario: API routes validate permissions
**Given** Dan is a supervisor
**When** Dan makes a POST to `/api/projects/123/change-orders/456/approve`
**Then** the route handler checks permissions
**And** returns 403 if unauthorized

---

## MODIFIED Requirements

### Requirement: PERM-012 - RLS Policy Updates for Permissions
**Priority:** HIGH | **Status:** Modified

Existing RLS policies must be updated to use permission helper functions.

#### Scenario: project_costs INSERT policy uses permission function
**Given** the project_costs table has an INSERT RLS policy
**When** a user attempts to insert a cost
**Then** the policy calls `can_create_cost(user_id, project_id)`
**And** allows insert only if function returns TRUE

#### Scenario: project_budgets UPDATE policy uses permission function
**Given** the project_budgets table has an UPDATE RLS policy
**When** a user attempts to update a budget
**Then** the policy calls `can_edit_budget(user_id, project_id)`
**And** allows update only if function returns TRUE

#### Scenario: change_orders approval uses permission function
**Given** a change order's approved_by field is being set
**When** the UPDATE occurs
**Then** the policy calls `can_approve_change_order(user_id, project_id)`
**And** allows the status change only if authorized

---

## Implementation Notes

### Permission Functions to Create

```sql
-- Budget permissions
CREATE FUNCTION can_edit_budget(user_uuid UUID, check_project_id UUID) RETURNS BOOLEAN
CREATE FUNCTION can_view_budget(user_uuid UUID, check_project_id UUID) RETURNS BOOLEAN

-- Cost permissions
CREATE FUNCTION can_create_cost(user_uuid UUID, check_project_id UUID) RETURNS BOOLEAN
CREATE FUNCTION can_edit_cost(user_uuid UUID, check_project_id UUID, cost_id UUID) RETURNS BOOLEAN
CREATE FUNCTION can_delete_cost(user_uuid UUID, check_project_id UUID, cost_id UUID) RETURNS BOOLEAN

-- Change order permissions
CREATE FUNCTION can_create_change_order(user_uuid UUID, check_project_id UUID) RETURNS BOOLEAN
CREATE FUNCTION can_approve_change_order(user_uuid UUID, check_project_id UUID) RETURNS BOOLEAN

-- Daily report permissions
CREATE FUNCTION can_create_daily_report(user_uuid UUID, check_project_id UUID) RETURNS BOOLEAN
CREATE FUNCTION can_edit_daily_report(user_uuid UUID, check_project_id UUID, report_id UUID) RETURNS BOOLEAN

-- RFI permissions
CREATE FUNCTION can_submit_rfi(user_uuid UUID, check_project_id UUID) RETURNS BOOLEAN
CREATE FUNCTION can_respond_to_rfi(user_uuid UUID, check_project_id UUID) RETURNS BOOLEAN
CREATE FUNCTION can_close_rfi(user_uuid UUID, check_project_id UUID) RETURNS BOOLEAN

-- Submittal permissions
CREATE FUNCTION can_create_submittal(user_uuid UUID, check_project_id UUID) RETURNS BOOLEAN
CREATE FUNCTION can_review_submittal(user_uuid UUID, check_project_id UUID) RETURNS BOOLEAN
CREATE FUNCTION can_approve_submittal(user_uuid UUID, check_project_id UUID) RETURNS BOOLEAN

-- Team permissions
CREATE FUNCTION can_manage_team(user_uuid UUID, check_project_id UUID) RETURNS BOOLEAN

-- Project permissions
CREATE FUNCTION can_edit_project(user_uuid UUID, check_project_id UUID) RETURNS BOOLEAN
CREATE FUNCTION can_delete_project(user_uuid UUID, check_project_id UUID) RETURNS BOOLEAN
```

### Application Layer

**Utilities:**
- `lib/permissions/index.ts` - Permission checking utilities
- `lib/permissions/constants.ts` - Permission enum and types
- `hooks/use-permission.ts` - React hook for permission checks
- `components/permissions/permission-gate.tsx` - Conditional rendering component

**API Routes:**
- `app/api/permissions/check/route.ts` - Single permission check
- `app/api/permissions/route.ts` - Batch permission check

### Server Action Updates

Update all mutation server actions to include permission checks:

```typescript
import { assertPermission } from '@/lib/permissions'

export async function createCost(data: CreateCostInput) {
  const user = await getCurrentUser()

  // Check permission before proceeding
  await assertPermission({
    permission: 'create_cost',
    projectId: data.projectId,
    userId: user.id,
  })

  // Existing logic...
}
```

### RLS Policy Updates

**Tables requiring RLS updates:**
- `project_budgets` - Use permission functions
- `project_costs` - Use permission functions + owner check for edits
- `change_orders` - Use permission functions for approval
- `daily_reports` - Use permission functions + owner check
- `rfis` - Use permission functions
- `submittals` - Use permission functions

## Permissions Matrix Reference

See `design.md` for complete permissions matrix showing all role capabilities.

## Testing Requirements

### Unit Tests
- Test each permission function with all role combinations
- Test permission caching behavior
- Test batch permission checks

### Integration Tests
- Test RLS policy enforcement
- Test server action permission validation
- Test API route authorization

### E2E Tests
- Test UI permission gates
- Test unauthorized action attempts
- Test role transitions (e.g., supervisor → manager)

## Related Specs
- `role-based-visibility` - Defines which projects users can see
- `project-team-ui` - UI for managing roles that control permissions
