# Spec: Project Team Management UI

## Overview
Build user interface components for managing project team membership at the project level, allowing org admins/owners to add, remove, and update team member roles.

## ADDED Requirements

### Requirement: PTU-001 - Project Team Page
**Priority:** HIGH | **Status:** Added

A dedicated page for viewing and managing the project team.

#### Scenario: Navigate to project team page
**Given** Alice is a manager on "Project A"
**When** Alice navigates to `/org/acme/projects/project-a/team`
**Then** she sees the project team page
**And** sees a list of all team members with their roles

#### Scenario: Team page shows member details
**Given** Bob views the team page for "Project A"
**When** the page loads
**Then** each team member shows:
- Avatar (or initials fallback)
- Full name or email
- Current role badge (manager/supervisor/viewer)
- Date added to project
- Who granted access

#### Scenario: Team page is mobile responsive
**Given** Carol accesses the team page on a mobile device
**When** the page loads
**Then** team members display in a single column
**And** all controls are easily tappable
**And** no horizontal scrolling is required

#### Scenario: Empty state when project has no team
**Given** "Project Z" has no team members assigned
**When** an org admin views the team page
**Then** they see an empty state illustration
**And** see a message "No team members assigned yet"
**And** see an "Add Team Member" button

---

### Requirement: PTU-002 - Team Navigation Link
**Priority:** HIGH | **Status:** Added

Add navigation link to access project team from project context.

#### Scenario: Team tab appears in project navigation
**Given** Alice views any project page
**When** she looks at the project navigation tabs
**Then** she sees tabs: Overview, Budget, Costs, Team, etc.
**And** the Team tab is positioned after Costs

#### Scenario: Team tab shows active state
**Given** Bob is on the project team page
**When** he views the navigation
**Then** the Team tab is highlighted as active
**And** uses the active tab styling

#### Scenario: Clicking team tab navigates to team page
**Given** Carol is on the project overview page
**When** she clicks the "Team" tab
**Then** she navigates to `/[orgSlug]/projects/[projectId]/team`
**And** the page loads without a full refresh (client-side navigation)

---

### Requirement: PTU-003 - Add Team Member Dialog
**Priority:** HIGH | **Status:** Added

Dialog for adding organization members to the project.

#### Scenario: Org admin can open add member dialog
**Given** Alice is an org admin viewing the team page
**When** Alice clicks the "Add Member" button
**Then** a dialog opens titled "Add Team Member"
**And** the dialog contains member and role selection fields

#### Scenario: Dialog shows available org members only
**Given** the add member dialog is open
**And** there are 10 org members
**And** 3 are already on the project
**When** Bob opens the member dropdown
**Then** he sees only 7 members (those not yet on project)
**And** current team members are excluded from the list

#### Scenario: Select member and role to add
**Given** Carol opens the add member dialog
**When** she selects "Dan" from the member dropdown
**And** she selects "Supervisor" as the role
**And** she clicks "Add Member"
**Then** Dan is added to the project as a supervisor
**And** the dialog closes
**And** the team list refreshes to show Dan

#### Scenario: Role selector shows descriptions
**Given** the add member dialog is open
**When** Eve opens the role dropdown
**Then** she sees three options:
- Manager: "Full project control"
- Supervisor: "Field operations"
- Viewer: "Read-only access"

#### Scenario: Add member validation
**Given** the add member dialog is open
**When** Alice clicks "Add Member" without selecting a user
**Then** the form shows validation error "Please select a member"
**And** the dialog remains open

#### Scenario: Add member shows loading state
**Given** Bob selects a member and role
**When** he clicks "Add Member"
**Then** the button shows "Adding..." text
**And** the button is disabled
**And** a spinner icon appears
**Until** the operation completes

#### Scenario: Add member handles errors gracefully
**Given** Carol attempts to add a member
**When** the API returns an error
**Then** a toast notification shows the error message
**And** the dialog remains open for retry
**And** the form fields retain their values

---

### Requirement: PTU-004 - Team Member List Display
**Priority:** MEDIUM | **Status:** Added

Organized display of team members grouped by role.

#### Scenario: Team members grouped by role
**Given** "Project A" has 2 managers, 5 supervisors, and 3 viewers
**When** Alice views the team page
**Then** she sees three sections:
- "Managers (2)"
- "Supervisors (5)"
- "Viewers (3)"
**And** each section shows its members

#### Scenario: Role sections show counts
**Given** "Project B" has 1 manager and 0 supervisors
**When** Bob views the team page
**Then** he sees "Managers (1)" with 1 member listed
**And** sees "Supervisors (0)" as an empty section
**Or** the Supervisors section is hidden

#### Scenario: Team members show audit info
**Given** Carol views a team member in the list
**Then** she sees when they were added (e.g., "Added 2 days ago")
**And** sees who granted access (e.g., "Added by Alice Johnson")

---

### Requirement: PTU-005 - Role Management
**Priority:** HIGH | **Status:** Added

Ability to change team member roles inline.

#### Scenario: Org admin can change member roles
**Given** Alice is an org admin
**And** Bob is currently a supervisor on "Project A"
**When** Alice clicks Bob's role dropdown
**And** selects "Manager"
**Then** Bob's role is updated to manager
**And** a toast shows "Role updated to Manager"
**And** Bob's permissions change immediately

#### Scenario: Non-admins see read-only role badges
**Given** Carol is a manager (not org admin)
**And** Carol views the team page
**Then** she sees team member roles as badges (not dropdowns)
**And** cannot change anyone's role

#### Scenario: Role change prevents removing last manager
**Given** Alice is the only manager on "Project A"
**When** an admin attempts to change Alice to supervisor
**Then** the system shows an error: "Cannot remove the last manager"
**And** Alice remains a manager

#### Scenario: Role change shows loading state
**Given** an admin changes Bob's role
**When** the update is in progress
**Then** the role dropdown is disabled
**And** a small spinner appears
**Until** the update completes

---

### Requirement: PTU-006 - Remove Team Member
**Priority:** HIGH | **Status:** Added

Ability to remove team members from projects.

#### Scenario: Org admin can remove team members
**Given** Alice is an org admin viewing the team page
**And** Bob is a viewer on "Project A"
**When** Alice clicks the remove icon next to Bob
**Then** a confirmation dialog appears: "Remove Bob from this project?"
**When** Alice confirms
**Then** Bob is removed from the project
**And** Bob loses access to "Project A"
**And** a toast shows "Bob removed from project"

#### Scenario: Cannot remove last project manager
**Given** Carol is the only manager on "Project A"
**When** an admin attempts to remove Carol
**Then** an error message appears: "Cannot remove the last manager"
**And** Carol remains on the project

#### Scenario: Non-admins cannot remove members
**Given** Dan is a manager (not org admin)
**When** Dan views the team page
**Then** he sees no remove buttons next to team members
**And** cannot remove anyone

#### Scenario: Remove member confirmation shows details
**Given** an admin clicks remove next to Alice
**When** the confirmation dialog appears
**Then** it shows:
- "Remove Alice Johnson?"
- "They will lose access to this project"
- Cancel and Remove buttons
**And** the Remove button is styled as destructive (red)

---

### Requirement: PTU-007 - Permission-Based UI
**Priority:** HIGH | **Status:** Added

UI elements appear/hide based on user permissions.

#### Scenario: Org admins see management controls
**Given** Alice is an org admin viewing the team page
**Then** she sees the "Add Member" button
**And** sees role dropdowns for each member
**And** sees remove icons for each member

#### Scenario: Managers see read-only team
**Given** Bob is a manager (not org admin) viewing the team page
**Then** he sees team member list
**And** roles are shown as badges (not dropdowns)
**And** he sees no "Add Member" button
**And** he sees no remove icons

#### Scenario: Supervisors and viewers see read-only team
**Given** Carol is a supervisor on "Project A"
**When** Carol views the team page
**Then** she sees all team members and their roles
**And** all controls are read-only
**And** no management actions are available

#### Scenario: Permission gates prevent unauthorized actions
**Given** Dan is a manager who manually crafts an API request
**When** Dan attempts to add a member via direct API call
**Then** the server returns 403 Forbidden
**Because** only org admins can manage teams

---

### Requirement: PTU-008 - Team Statistics
**Priority:** LOW | **Status:** Added

Summary statistics about team composition.

#### Scenario: Team stats show role distribution
**Given** "Project A" has 2 managers, 5 supervisors, 3 viewers
**When** Alice views the team page
**Then** she sees a stats card showing:
- "10 Total Members"
- "2 Managers"
- "5 Supervisors"
- "3 Viewers"

#### Scenario: Stats update when team changes
**Given** the team stats show "5 Total Members"
**When** an admin adds a new supervisor
**Then** the stats update to "6 Total Members"
**And** "Supervisors" count increments
**Without** requiring a page refresh

---

### Requirement: PTU-009 - Real-Time Updates
**Priority:** MEDIUM | **Status:** Added

Team list reflects changes immediately without manual refresh.

#### Scenario: Adding member updates list immediately
**Given** Alice is viewing the team page
**When** Alice adds Bob as a supervisor
**Then** Bob appears in the Supervisors section immediately
**And** no page refresh is required

#### Scenario: Changing role updates UI immediately
**Given** Carol views the team page
**And** an admin changes Dan from viewer to supervisor
**Then** Dan moves from Viewers section to Supervisors section
**And** the counts update automatically

#### Scenario: Removing member updates list immediately
**Given** Alice views the team page
**When** an admin removes Bob from the project
**Then** Bob disappears from the list immediately
**And** the team count decrements

---

### Requirement: PTU-010 - Project Team Link from Overview
**Priority** MEDIUM | **Status:** Added

Quick access to team management from project overview.

#### Scenario: Project overview shows team member count
**Given** Alice views the project overview page
**When** the metrics load
**Then** she sees a "Team" metric card showing "10 members"

#### Scenario: Clicking team metric navigates to team page
**Given** Bob views the project overview
**And** sees "Team: 5 members"
**When** Bob clicks the team metric
**Then** he navigates to the team page
**And** sees the full team list

---

### Requirement: PTU-011 - Loading and Error States
**Priority:** MEDIUM | **Status:** Added

Graceful handling of loading and error conditions.

#### Scenario: Team page shows loading skeleton
**Given** Alice navigates to the team page
**When** data is being fetched
**Then** she sees skeleton loaders for:
- Team member rows
- Stats cards
- Section headers
**Until** the data loads

#### Scenario: Error state when team cannot load
**Given** Bob navigates to the team page
**When** the API returns an error
**Then** he sees an error message: "Failed to load team members"
**And** sees a "Retry" button
**When** Bob clicks Retry
**Then** the data fetch is attempted again

#### Scenario: Network error shows user-friendly message
**Given** Carol has no internet connection
**When** she tries to load the team page
**Then** she sees "Unable to connect. Check your internet connection."
**And** the page doesn't show broken UI elements

---

### Requirement: PTU-012 - Accessibility
**Priority:** MEDIUM | **Status:** Added

Team UI must be fully accessible.

#### Scenario: Keyboard navigation works
**Given** Alice uses only keyboard
**When** she tabs through the team page
**Then** she can focus on:
- Add Member button
- Each role dropdown
- Each remove button
**And** can activate them with Enter or Space

#### Scenario: Screen reader announces team members
**Given** Bob uses a screen reader
**When** he navigates the team list
**Then** each member is announced with:
- Name
- Role
- Added date
**And** action buttons have descriptive labels

#### Scenario: Focus management in dialogs
**Given** the add member dialog is opened
**Then** focus moves to the first input field
**When** the dialog closes
**Then** focus returns to the trigger button

#### Scenario: Color is not the only indicator
**Given** role badges use colors (manager=blue, supervisor=green, viewer=gray)
**Then** they also include text labels
**And** use distinct icons or patterns
**So** colorblind users can distinguish them

---

## MODIFIED Requirements

### Requirement: PTU-013 - Project Navigation Enhancement
**Priority:** MEDIUM | **Status:** Modified

Add team navigation to existing project layout.

#### Scenario: Team tab added to project nav
**Given** the project layout component exists
**When** rendering the navigation tabs
**Then** a "Team" tab is added to the tab list
**And** positioned after "Costs" and before "Settings"

#### Scenario: Team route is configured
**Given** Next.js app router is used
**When** routing is configured
**Then** `/[orgSlug]/projects/[projectId]/team` resolves to team page
**And** uses the project layout wrapper

---

## Implementation Notes

### File Structure

```
app/(dashboard)/[orgSlug]/projects/[projectId]/team/
  ├── page.tsx                          # Server component - main page
  └── _components/
      ├── team-header.tsx               # Page header with Add button
      ├── team-stats.tsx                # Statistics cards
      ├── team-member-list.tsx          # List container (groups by role)
      ├── team-member-row.tsx           # Individual member row
      ├── add-team-member-dialog.tsx    # Add member dialog
      └── remove-member-dialog.tsx      # Confirmation dialog

components/team/                        # Shared team components
  └── role-badge.tsx                    # Role badge component

lib/actions/projects/
  └── team-management.ts                # Server actions (already exist)
```

### Key Components

**TeamMemberList:**
- Groups members by role
- Handles empty states
- Uses React Query for real-time updates

**AddTeamMemberDialog:**
- Combobox/Select for member selection
- Radio group or Select for role
- Form validation with Zod
- Optimistic updates

**TeamMemberRow:**
- Avatar with fallback to initials
- Role badge (read-only) or Select (if can manage)
- Remove button (if can manage)
- Audit trail timestamp

**PermissionGate:**
- Wraps management controls
- Checks `can_manage_team` permission
- Hides UI for unauthorized users

### Data Fetching

```typescript
// Server-side data fetching in page.tsx
export default async function TeamPage({ params }) {
  const { projectId } = params

  const [project, team, available] = await Promise.all([
    getProject(projectId),
    getProjectTeam(projectId),
    getAvailableOrgMembers({ projectId, orgId: project.org_id }),
  ])

  return <TeamPageClient project={project} initialTeam={team} available={available} />
}
```

### Server Actions Used

All actions already exist in `lib/actions/projects/team-management.ts`:
- `getProjectTeam(projectId)` - Fetch team members
- `addTeamMember({ projectId, userId, role })` - Add member
- `updateTeamMemberRole({ projectAccessId, newRole })` - Change role
- `removeTeamMember(projectAccessId)` - Remove member
- `getAvailableOrgMembers({ orgId, projectId })` - Get candidates

### Styling

- Use Shadcn/ui components: Dialog, Select, Badge, Button, Avatar
- Tailwind CSS for layout and spacing
- Responsive breakpoints: mobile-first, stack on small screens
- Dark mode support via CSS variables

### Performance

- Server-side render initial data
- Client-side mutations with React Query
- Optimistic updates for instant feedback
- Debounced role changes (if typing delay)

## Testing Requirements

### Unit Tests
- TeamMemberRow role change logic
- AddTeamMemberDialog form validation
- Permission gate visibility logic

### Integration Tests
- Add member flow (select, submit, success)
- Remove member flow (click, confirm, success)
- Role change flow (select, confirm, update)
- Error handling (API failures, validation)

### E2E Tests
```typescript
test('org admin can add and remove team members', async ({ page }) => {
  await loginAsOrgAdmin(page)
  await page.goto('/org/acme/projects/abc/team')

  // Add member
  await page.click('button:has-text("Add Member")')
  await page.selectOption('[name="userId"]', 'user-123')
  await page.selectOption('[name="role"]', 'supervisor')
  await page.click('button:has-text("Add Member")')
  await expect(page.locator('text=Bob Smith')).toBeVisible()

  // Remove member
  await page.click('button[aria-label="Remove Bob Smith"]')
  await page.click('button:has-text("Remove")')
  await expect(page.locator('text=Bob Smith')).not.toBeVisible()
})

test('project manager cannot manage team', async ({ page }) => {
  await loginAsManager(page)
  await page.goto('/org/acme/projects/abc/team')

  // No management controls visible
  await expect(page.locator('button:has-text("Add Member")')).not.toBeVisible()
  await expect(page.locator('button[aria-label^="Remove"]')).not.toBeVisible()

  // Sees read-only badges
  await expect(page.locator('[data-role-badge]')).toBeVisible()
})
```

### Accessibility Tests
- Axe accessibility scan
- Keyboard-only navigation test
- Screen reader announcement test
- Focus trap in dialogs test

## Related Specs
- `role-based-visibility` - Determines who can view team page
- `permissions-system` - Determines who can manage team
