# Proposal: Add Project Team Management

## Change ID
`add-project-team-management`

## Status
**PROPOSED** | Created: 2025-10-26

## Summary
Enable organization owners and administrators to manage project teams by adding/removing users with specific roles (manager, supervisor, viewer) to projects. This provides granular access control at the project level, allowing owners to assign dedicated project managers and build focused project teams from the organization's member pool.

## Problem Statement
Currently, there is no user interface or backend API for organization owners to manage which users have access to specific projects and what roles they have. The `project_access` table exists in the database, but there are no CRUD operations exposed to:
- View current project team members
- Add organization members to a project with a specific role
- Update a user's role on a project
- Remove users from a project team
- Audit who granted/revoked access and when

This prevents owners from:
- Assigning dedicated project managers to oversee specific projects
- Giving supervisors field-level access without full manager permissions
- Providing view-only access to stakeholders or subcontractors
- Maintaining proper access control as projects evolve and team composition changes

## Proposed Solution
Build a complete project team management system accessible to organization owners/admins that enables:

**For Organization Owners/Admins:**
1. View all current team members for any project
2. Add organization members to a project with role assignment (manager/supervisor/viewer)
3. Update existing team member roles
4. Remove team members from projects
5. See audit trail of who granted/revoked access

**For Project Managers:**
- View their project team (read-only for non-owners)

**Technical Implementation:**
- Server actions for all team management operations
- RLS policies ensuring only owners/admins can modify project teams
- Audit logging via `granted_by` and `granted_at` fields
- UI components for team management integrated into project settings
- Real-time updates when team composition changes

## Scope

### In Scope
- Project team listing UI showing current members with roles
- Add team member form (select from org members, assign role)
- Update team member role functionality
- Remove team member functionality
- Server actions for all CRUD operations on `project_access`
- RLS policies for project team management
- Audit trail display (who granted access, when)
- Role-based UI (owners can edit, others view-only)

### Out of Scope
- Email invitations to users not yet in the organization (separate feature)
- Bulk team member operations (import/export)
- Team templates or presets
- Project-specific permissions beyond the existing three roles
- Integration with external identity providers
- Team member activity tracking or analytics

## User Stories

### As an organization owner
- I want to view all team members on a project so I can see who has access
- I want to add project managers to projects so they can oversee specific builds
- I want to assign supervisors to projects so field staff have appropriate access
- I want to give view-only access to stakeholders so they can monitor progress
- I want to remove users from projects when they're reassigned so access stays current
- I want to see who granted access and when for audit compliance

### As a project manager
- I want to see my project team members so I know who I'm working with
- I want to understand each member's role so I know their permissions

## Dependencies
- Existing `project_access` table schema (already implemented)
- Existing `organization_members` table (users must be org members first)
- Auth system with role-based access control
- RLS helper functions for access checks

## Success Criteria
- [ ] Owners can view complete project team roster with roles
- [ ] Owners can add org members to projects with role selection
- [ ] Owners can update team member roles
- [ ] Owners can remove team members from projects
- [ ] All operations are audited (granted_by, granted_at populated)
- [ ] RLS policies prevent unauthorized team management
- [ ] UI clearly distinguishes between owner/admin (can edit) and others (view-only)
- [ ] Changes reflect immediately in the UI
- [ ] Project managers can view (but not edit) their team roster

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Owners accidentally remove themselves | High | Require at least one manager on each project; show warning before removing last manager |
| Performance with large orgs (100+ members) | Medium | Paginate member selection dropdown; index project_access queries |
| Audit trail gaps if granted_by is nullable | Medium | Make granted_by required for new access grants; default to current user |
| Users confused about org vs project roles | Low | Clear UI labeling; contextual help text explaining difference |

## Open Questions
1. Should we enforce at least one project manager per project? **Decision:** Yes, prevent removing the last manager
2. Should project managers be able to add supervisors/viewers? **Decision:** No, only owners/admins initially
3. Do we need team member search/filter for large teams? **Decision:** Implement if >20 members on a project
4. Should we send notifications when users are added/removed? **Decision:** Out of scope for v1, add to backlog

## Alternatives Considered

### Alternative 1: Automatic project access for all org members
**Pros:** Simpler, no management needed
**Cons:** Violates principle of least privilege; can't restrict sensitive projects
**Decision:** Rejected - explicit access control is critical for construction compliance

### Alternative 2: Allow project managers to manage their own teams
**Pros:** Distributes responsibility, less bottleneck on owners
**Cons:** Could lead to inconsistent access patterns; managers might over-grant access
**Decision:** Deferred to v2 based on customer feedback

### Alternative 3: Role-based access only (no per-project assignments)
**Pros:** Simpler model, easier to understand
**Cons:** Doesn't support multi-project scenarios where users have different roles per project
**Decision:** Rejected - per-project roles are industry standard

## Timeline
- **Specification:** 1 day
- **Implementation:** 2-3 days
- **Testing:** 1 day
- **Total:** 4-5 days

## Related Changes
- `add-project-foundation` - Original project/org schema
- Future: `add-team-member-invitations` - Invite external users to org then project
- Future: `add-team-activity-tracking` - Monitor team member actions

## References
- Database Schema: `supabase/migrations/20250120000000_initial_schema.sql`
- Existing RLS Policies: `supabase/migrations/20250120000001_rls_policies.sql`
- Project Documentation: `openspec/project.md` (RBAC section)
