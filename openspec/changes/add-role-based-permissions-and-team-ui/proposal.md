# Proposal: Add Role-Based Permissions and Project Team UI

## Change ID
`add-role-based-permissions-and-team-ui`

## Status
**PROPOSED** | Created: 2025-11-07

## Summary
Implement role-based project visibility and granular permissions system to ensure team members only access their assigned projects with appropriate capabilities. Complete the project team management UI to enable owners/admins to manage project assignments and permissions.

## Problem Statement
Currently, the application has critical gaps in access control and team management:

### 1. **Overly Permissive Project Visibility**
The `user_project_ids()` helper function grants ALL organization members visibility to ALL projects in their organization, regardless of whether they're assigned to those projects. This violates the principle of least privilege.

**Current behavior:**
- A project manager assigned to Project A can see Projects B, C, and D
- Supervisors can view projects they're not working on
- No way to restrict sensitive project visibility

**Location:** `supabase/migrations/20250120000001_rls_policies.sql:29-47`

### 2. **No Granular Permissions System**
Roles exist (`owner`, `admin`, `member` at org level; `manager`, `supervisor`, `viewer` at project level) but there's no defined permissions model for what each role can actually do.

**Missing capabilities:**
- No permission matrix defining CRUD operations per role
- No enforcement of role-based capabilities (e.g., can supervisor create change orders?)
- No way to grant/revoke specific permissions beyond changing roles

### 3. **Missing Project Team UI**
While backend APIs exist for project team management, there's no user interface to:
- View project team members at the project level
- Add org members to projects with role assignment
- Update team member roles on projects
- Remove team members from projects
- Navigate to project team from project context

**Impact:**
- Project managers can't see or manage their teams
- Owners must use database tools to assign project access
- No audit visibility for team changes

## Proposed Solution
Implement a comprehensive role-based access control (RBAC) system with three integrated components:

### 1. **Role-Based Project Visibility**
Modify `user_project_ids()` to respect role-based visibility:
- **Owners/Admins:** See all projects in their organization (current behavior)
- **Project Members:** Only see projects they're explicitly assigned to via `project_access`

### 2. **Granular Permissions System**
Define and enforce a permissions model with capabilities for each role:

**Organization Roles:**
- `owner`: Full control of org and all projects
- `admin`: Manage projects, budgets, team assignments
- `member`: Must be assigned to specific projects

**Project Roles:**
- `manager`: Full project control (budgets, team, change orders, etc.)
- `supervisor`: Field operations (daily reports, costs, RFIs, submittals)
- `viewer`: Read-only access to project data

**Permission Categories:**
- Project: view, edit, delete
- Budget: view, edit, allocate
- Costs: view, create, edit, delete
- Change Orders: view, create, approve, reject
- Daily Reports: view, create, edit
- RFIs: view, create, respond, close
- Submittals: view, create, review, approve
- Team: view, manage (add/remove members)

### 3. **Project Team Management UI**
Build complete UI components for project-level team management:
- Project team page at `/[orgSlug]/projects/[projectId]/team`
- Team navigation tab in project layout
- Add team member dialog with role selection
- Team member list with role management
- Remove team member confirmation
- Audit trail display

## Scope

### In Scope
**Database & Backend:**
- Modify `user_project_ids()` function for role-based visibility
- Add permissions helper functions (e.g., `can_user_edit_budget()`)
- Update RLS policies to enforce granular permissions
- Create permission validation utilities for server actions

**UI Components:**
- Project team page (`/projects/[projectId]/team/page.tsx`)
- Team navigation link in project layout
- `<TeamMemberList>` component with role badges
- `<AddTeamMemberDialog>` with role selector
- `<TeamMemberRow>` with role dropdown and remove button
- Permission-aware UI (hide actions user can't perform)

**Documentation:**
- Permissions matrix document (role → capabilities mapping)
- Migration guide for existing deployments
- Testing scenarios for each role

### Out of Scope
- Custom/per-user permissions (only role-based)
- Permission groups or templates
- Time-based access grants (expiring permissions)
- Org-level team UI enhancements (already complete)
- Email notifications for team changes (future)
- Audit logging UI (use existing audit trail)

## User Stories

### As a project manager assigned to Project A
- I want to ONLY see Project A in my projects list so I'm not distracted by unrelated projects
- I want to manage my project team so I can add supervisors and viewers
- I want to create budgets, costs, and change orders for my project
- I cannot see or access other projects in the organization

### As a field supervisor assigned to multiple projects
- I want to see only the projects I'm assigned to so I can focus on my work
- I want to create daily reports and log costs for my projects
- I want to submit RFIs and submittals for review
- I cannot edit budgets or approve change orders (manager permission)

### As an organization owner
- I want to see all projects across the organization for oversight
- I want to assign project managers to new projects
- I want to grant field supervisors access to specific projects
- I want to remove team members when they're reassigned
- I want to audit who has access to sensitive projects

### As a viewer (client/stakeholder)
- I want read-only access to project progress
- I want to view budgets, costs, and reports
- I cannot create, edit, or delete anything

## Dependencies
- Existing `project_access` table and RLS infrastructure
- Existing `organization_members` table
- Existing project team management server actions (`lib/actions/projects/team-management.ts`)
- Existing OpenSpec proposal `add-project-team-management` (backend complete)
- Shadcn/ui components (Dialog, Select, Badge, etc.)

## Success Criteria
**Visibility:**
- [ ] Project managers only see their assigned projects in project lists
- [ ] Owners/admins continue to see all org projects
- [ ] Attempting to access unassigned project returns 403 Forbidden

**Permissions:**
- [ ] Permissions matrix documented and implemented
- [ ] Each role can perform only allowed operations
- [ ] Server actions validate permissions before execution
- [ ] RLS policies enforce row-level permission checks
- [ ] UI hides/disables actions based on user permissions

**Team UI:**
- [ ] Project team page displays current team members with roles
- [ ] Owners/admins can add org members to projects with role selection
- [ ] Owners/admins can update team member roles
- [ ] Owners/admins can remove team members (with last-manager protection)
- [ ] Project managers can view team but not edit (unless they're also owners/admins)
- [ ] Team changes reflect immediately without page refresh
- [ ] Audit trail shows who granted/revoked access and when

**Testing:**
- [ ] E2E tests for each role's access patterns
- [ ] Unit tests for permission helper functions
- [ ] Integration tests for RLS policy enforcement

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing access for current users | High | Implement feature flag; migrate existing users to explicit project assignments |
| Performance degradation from permission checks | Medium | Use indexed queries; cache permission results; optimize RLS policies |
| Complex permission logic leading to bugs | High | Comprehensive test coverage; permission matrix documentation; code reviews |
| Users locked out of projects after migration | High | Automated migration script assigns all current org members to all projects; owners/admins manually remove unneeded access |
| UI complexity from permission-aware components | Medium | Create reusable `<PermissionGate>` component; centralized permission checks |

## Open Questions
1. **Migration Strategy:** Should existing org members be auto-assigned to all projects or start with zero access?
   - **Recommendation:** Auto-assign to maintain current behavior, then allow owners to remove access as needed

2. **Can project managers add team members to their projects?**
   - **Recommendation:** No in v1 (only owners/admins), re-evaluate based on feedback

3. **Should we support per-project permission overrides?** (e.g., viewer can edit budgets on Project A)
   - **Recommendation:** Out of scope for v1, keep role-based only

4. **How granular should permissions be?** (operation-level vs feature-level)
   - **Recommendation:** Feature-level (e.g., "can_manage_budgets") rather than operation-level ("can_create_budget", "can_edit_budget")

5. **Should supervisors see each other's work or only their own?**
   - **Recommendation:** See all project data (team visibility), but this can be refined later

## Alternatives Considered

### Alternative 1: Keep current "all org members see all projects" model
**Pros:** Simple, no migration needed, no access complaints
**Cons:** Security risk, violates least privilege, doesn't meet user requirements
**Decision:** Rejected - user explicitly wants restricted visibility

### Alternative 2: Attribute-Based Access Control (ABAC) instead of RBAC
**Pros:** More flexible, can support complex rules
**Cons:** Much more complex to implement and reason about
**Decision:** Rejected - RBAC sufficient for construction use cases

### Alternative 3: Build permissions UI before enforcing them
**Pros:** Users can see permissions before they take effect
**Cons:** Confusing state where permissions exist but don't do anything
**Decision:** Rejected - implement enforcement and UI together

### Alternative 4: Use third-party permission service (e.g., Oso, Authzed)
**Pros:** Battle-tested, feature-rich
**Cons:** External dependency, cost, complexity, RLS integration challenges
**Decision:** Rejected - Postgres RLS is sufficient and already in use

## Timeline
- **Specification:** 1 day (this proposal)
- **Database & Permission System:** 2-3 days (modify RLS, add helpers, testing)
- **Project Team UI:** 2-3 days (components, pages, integration)
- **Migration Script & Docs:** 1 day
- **E2E Testing:** 1-2 days
- **Total:** 7-10 days

## Related Changes
- `add-project-team-management` - Backend APIs already implemented, UI missing
- `add-project-foundation` - Original project/org schema
- Future: `add-permission-templates` - Reusable permission sets for common roles
- Future: `add-team-notifications` - Notify users when added/removed from projects
- Future: `add-audit-logging-ui` - View permission change history

## References
- Current RLS Policies: `supabase/migrations/20250120000001_rls_policies.sql`
- Project Team Management Actions: `lib/actions/projects/team-management.ts`
- Existing Project Team Proposal: `openspec/changes/add-project-team-management/proposal.md`
- Org Team UI (reference implementation): `app/(dashboard)/[orgSlug]/team/`
