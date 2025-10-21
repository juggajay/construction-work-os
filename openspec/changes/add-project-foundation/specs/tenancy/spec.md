# Tenancy Capability

## ADDED Requirements

### Requirement: Organization Creation
The system SHALL allow authenticated users to create organizations.

#### Scenario: First-time user creates organization
- **WHEN** a user with no org memberships completes email confirmation
- **THEN** the system prompts the user to create an organization
- **AND** requires organization name (3-50 characters) and slug (3-30 lowercase alphanumeric, hyphens)
- **AND** validates the slug is globally unique (not reserved, not taken)
- **AND** creates the organization with the user as owner role

#### Scenario: Organization slug conflict
- **WHEN** a user attempts to create an organization with a slug already taken
- **THEN** the system returns "This slug is already in use"
- **AND** suggests available alternatives (append random suffix or incrementing number)

#### Scenario: Reserved slug protection
- **WHEN** a user attempts to create an organization with a reserved slug (e.g., `admin`, `api`, `docs`, `app`, `www`)
- **THEN** the system returns "This slug is reserved for system use"
- **AND** does not create the organization

### Requirement: Organization Membership
The system SHALL manage user membership in organizations with role-based permissions.

#### Scenario: Owner creates organization
- **WHEN** a user creates an organization
- **THEN** the system automatically adds the user to `organization_members` with role `owner`
- **AND** grants the user full permissions (invite members, manage projects, org settings)

#### Scenario: Admin invites new member
- **WHEN** an org admin or owner invites a user by email with role `member`
- **THEN** the system creates a pending `organization_members` row with `invited_by` and `invited_at`
- **AND** sends an invitation email with acceptance link (valid 7 days)

#### Scenario: Invited user accepts invitation
- **WHEN** a user clicks a valid invitation link
- **THEN** the system marks the membership as `joined_at = now()`
- **AND** grants the user access to the organization's projects (via RLS)
- **AND** redirects to the org dashboard

#### Scenario: User declines or ignores invitation
- **WHEN** an invitation expires after 7 days without acceptance
- **THEN** the system soft-deletes the pending membership row (`deleted_at = now()`)
- **AND** notifies the inviting admin via email

### Requirement: Organization Roles
The system SHALL enforce three organization-level roles: owner, admin, member.

#### Scenario: Owner permissions
- **WHEN** a user with `owner` role accesses org settings
- **THEN** the user can change org name, slug, settings, billing
- **AND** can invite/remove members, promote/demote admins
- **AND** can transfer ownership to another owner/admin
- **AND** can delete the organization

#### Scenario: Admin permissions
- **WHEN** a user with `admin` role accesses org settings
- **THEN** the user can invite/remove members (except owners)
- **AND** can create/edit/delete projects
- **AND** cannot change org billing or delete the organization

#### Scenario: Member permissions
- **WHEN** a user with `member` role accesses the org
- **THEN** the user can view projects they have explicit project-level access to
- **AND** cannot invite other members or change org settings

### Requirement: Project Creation
The system SHALL allow org admins and owners to create projects within their organization.

#### Scenario: Admin creates project with basic info
- **WHEN** an org admin/owner submits a project creation form with name, number, address, start date
- **THEN** the system creates a project record with status `planning`
- **AND** links the project to the organization via `org_id`
- **AND** grants the creator `manager` role on the project in `project_access`
- **AND** generates a unique project URL: `/[orgSlug]/projects/[projectId]`

#### Scenario: Project number auto-increment
- **WHEN** an admin creates a project without specifying a project number
- **THEN** the system auto-generates a number using the org's format (default: `P-00001`, `P-00002`, ...)
- **AND** ensures uniqueness within the organization

#### Scenario: Project with budget and cost codes
- **WHEN** an admin creates a project and specifies a budget amount
- **THEN** the system stores the budget in the `projects.budget` field
- **AND** initializes cost code tracking (linked to CSI MasterFormat by default)
- **AND** allows future variance tracking (budget vs actual)

### Requirement: Project Access Control
The system SHALL enforce project-level roles: manager, supervisor, viewer.

#### Scenario: Project manager grants access to subcontractor
- **WHEN** a project manager invites a user with role `viewer` and trade `electrical`
- **THEN** the system creates a `project_access` row with `granted_by` and `granted_at`
- **AND** sends an email notification to the invited user
- **AND** grants RLS-enforced read access to that project only (not other org projects)

#### Scenario: Supervisor role permissions
- **WHEN** a user with `supervisor` role accesses a project
- **THEN** the user can create/edit RFIs, submittals, daily reports, photos
- **AND** can view all project documents and drawings
- **AND** cannot change project settings, budget, or grant access to others

#### Scenario: Viewer role permissions
- **WHEN** a user with `viewer` role (e.g., architect) accesses a project
- **THEN** the user can view RFIs, submittals, drawings, daily reports (read-only)
- **AND** cannot create or edit any records
- **AND** cannot view financial data (budget, cost codes, change order amounts)

### Requirement: Multi-Tenant Data Isolation (RLS)
The system SHALL enforce data isolation at the database level via Row-Level Security.

#### Scenario: User queries projects table
- **WHEN** an authenticated user executes `SELECT * FROM projects`
- **THEN** the RLS policy returns only projects where:
  - User is a member of the project's organization, OR
  - User has explicit project-level access via `project_access`
- **AND** does not return projects from other organizations

#### Scenario: User attempts unauthorized project update
- **WHEN** a user with `viewer` role attempts `UPDATE projects SET budget = 1000000`
- **THEN** the RLS policy rejects the update (no rows affected)
- **AND** logs the unauthorized attempt in `audit_logs`

#### Scenario: Org owner sees all org projects (implicit access)
- **WHEN** a user with `owner` role in an organization queries projects
- **THEN** the RLS policy returns all projects in that organization
- **AND** does not require explicit `project_access` rows (implicit via org membership)

### Requirement: Organization Switcher
The system SHALL allow users in multiple organizations to switch context.

#### Scenario: User switches active organization
- **WHEN** a user clicks the org switcher and selects a different organization
- **THEN** the system updates the URL to `/[newOrgSlug]/...`
- **AND** updates the UI to show projects and data scoped to the new org
- **AND** stores the last active org in user preferences (cookie or database)

#### Scenario: User with single org auto-navigates
- **WHEN** a user logs in and belongs to only one organization
- **THEN** the system automatically redirects to that org's dashboard
- **AND** skips the org selection screen

### Requirement: Project Switcher
The system SHALL allow users to quickly switch between projects within an organization.

#### Scenario: User switches active project
- **WHEN** a user selects a project from the project switcher dropdown
- **THEN** the system updates the URL to `/[orgSlug]/projects/[projectId]`
- **AND** loads the project dashboard with recent activity
- **AND** updates the project context in the navigation header

#### Scenario: Recent projects list
- **WHEN** a user opens the project switcher
- **THEN** the system displays the 5 most recently accessed projects (sorted by last_accessed_at)
- **AND** provides a "View all projects" link to the full project list

### Requirement: Audit Logging for Tenancy Changes
The system SHALL log all organization and project membership changes.

#### Scenario: Member added to organization
- **WHEN** an admin invites a user to an organization
- **THEN** the system logs the event to `audit_logs` with:
  - `table_name = 'organization_members'`
  - `action = 'INSERT'`
  - `new_values` (JSON with user_id, org_id, role, invited_by)
  - `user_id` (the inviting admin), `ip_address`, `user_agent`, `timestamp`

#### Scenario: Project access revoked
- **WHEN** a project manager removes a user's access to a project
- **THEN** the system soft-deletes the `project_access` row (`deleted_at = now()`)
- **AND** logs the deletion to `audit_logs` with:
  - `action = 'DELETE'`
  - `old_values` (JSON with user_id, project_id, role, trade)
  - `user_id` (the manager who revoked), `timestamp`

### Requirement: Soft Deletes for Compliance
The system SHALL use soft deletes (not hard deletes) for all tenancy records.

#### Scenario: Organization soft delete
- **WHEN** an owner deletes an organization
- **THEN** the system sets `organizations.deleted_at = now()`
- **AND** hides the organization from UI and API responses (WHERE deleted_at IS NULL)
- **AND** retains the data for 90 days (compliance/recovery period)
- **AND** hard deletes after 90 days via scheduled job

#### Scenario: Project soft delete
- **WHEN** an admin deletes a project
- **THEN** the system sets `projects.deleted_at = now()`
- **AND** orphans all child records (RFIs, submittals, etc.) with `project_id` intact
- **AND** retains the project for 90 days before hard delete

### Requirement: Organization Settings
The system SHALL allow customization of org-level settings.

#### Scenario: Custom project number format
- **WHEN** an owner configures `project_number_format = '2025-{seq:3}'` in org settings
- **THEN** new projects use the format `2025-001`, `2025-002`, etc.
- **AND** validates the format includes a `{seq:N}` placeholder

#### Scenario: Default cost code structure
- **WHEN** an admin sets the default cost code structure to CSI MasterFormat (16-division)
- **THEN** new projects inherit this cost code structure
- **AND** projects can override with custom cost codes if needed

#### Scenario: Time zone configuration
- **WHEN** an owner sets the organization time zone to `America/New_York`
- **THEN** all timestamps in the UI display in that time zone
- **AND** audit logs store UTC timestamps for consistency

### Requirement: Data Retention Policies
The system SHALL enforce data retention policies for compliance.

#### Scenario: Audit log retention (10 years)
- **WHEN** an audit log entry reaches 10 years old
- **THEN** the system moves the entry to cold storage (S3 Glacier)
- **AND** soft-deletes the entry from the active `audit_logs` table
- **AND** provides an export API for legal discovery requests

#### Scenario: Soft-deleted project recovery
- **WHEN** an admin requests recovery of a soft-deleted project within 90 days
- **THEN** the system clears the `deleted_at` timestamp
- **AND** restores the project and all child records to active state
- **AND** logs the recovery action in `audit_logs`
