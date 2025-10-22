# Capability: RFI Lifecycle Management

**Capability ID**: `rfi-lifecycle`
**Status**: New
**Owner**: Backend Team

## Purpose

Enable construction teams to create, view, update, and manage the complete lifecycle of Requests for Information (RFIs) with proper status workflow, sequential numbering, and audit compliance.

## ADDED Requirements

### Requirement: Create RFI with Auto-Generated Number

Users MUST be able to create a new RFI with an automatically assigned sequential number unique to the project.

**Priority**: P0 (Critical)

#### Scenario: Project manager creates first RFI in project

**Given** I am authenticated as a project manager
**And** my project "Sunset Tower" has no existing RFIs
**When** I create an RFI with title "Clarify foundation depth on Grid A"
**Then** the RFI is created with number "RFI-001"
**And** the RFI status is set to "draft"
**And** I am set as the creator
**And** the created_at timestamp is recorded

#### Scenario: Sequential numbering continues from existing RFIs

**Given** I am authenticated as a project manager
**And** my project "Sunset Tower" has RFIs numbered "RFI-001" through "RFI-005"
**When** I create a new RFI with title "Beam size confirmation"
**Then** the RFI is created with number "RFI-006"
**And** no numbering conflicts occur

#### Scenario: Soft-deleted RFIs don't affect numbering

**Given** project "Sunset Tower" has RFIs "RFI-001" (active) and "RFI-002" (soft-deleted)
**When** I create a new RFI
**Then** the RFI is created with number "RFI-003"
**And** the soft-deleted "RFI-002" is not reused

---

### Requirement: View RFI List with Filtering

Users MUST be able to view a list of all RFIs in a project with filtering and sorting capabilities.

**Priority**: P0 (Critical)

#### Scenario: View all RFIs in project

**Given** I am authenticated and have access to project "Sunset Tower"
**And** the project has 15 RFIs across various statuses
**When** I navigate to the RFI list page
**Then** I see all 15 RFIs displayed in a table
**And** each RFI shows: number, title, status, assignee, due date
**And** RFIs are sorted by created_at descending (newest first)

#### Scenario: Filter RFIs by status

**Given** I am viewing the RFI list for project "Sunset Tower"
**And** there are 5 "submitted", 3 "under_review", and 2 "answered" RFIs
**When** I filter by status "submitted"
**Then** I see only the 5 RFIs with status "submitted"
**And** the filter is reflected in the URL query params

#### Scenario: Filter RFIs by assignee

**Given** I am viewing the RFI list
**And** 7 RFIs are assigned to me
**And** 8 RFIs are assigned to others
**When** I filter by "Assigned to me"
**Then** I see only the 7 RFIs assigned to me

#### Scenario: Filter overdue RFIs

**Given** I am viewing the RFI list
**And** 3 RFIs have passed their response_due_date
**And** 12 RFIs are not overdue
**When** I filter by "Overdue"
**Then** I see only the 3 overdue RFIs
**And** each has a red "Overdue" badge displayed

---

### Requirement: View RFI Detail with Full Context

Users MUST be able to view complete RFI details including description, responses, attachments, and history timeline.

**Priority**: P0 (Critical)

#### Scenario: View RFI detail page

**Given** I am authenticated and have access to RFI "RFI-003"
**When** I click on the RFI in the list
**Then** I am navigated to the RFI detail page
**And** I see the RFI title, number, and description
**And** I see all metadata: discipline, spec section, drawing references
**And** I see all responses in chronological order
**And** I see all attachments with download links
**And** I see a status timeline showing all state transitions

#### Scenario: RFI detail shows ball-in-court indicator

**Given** I am viewing RFI "RFI-003" with status "submitted"
**And** the RFI is assigned to "John Architect"
**When** the page loads
**Then** I see a prominent "Ball-in-court" indicator showing "John Architect"
**And** I see the response due date countdown timer

---

### Requirement: Update RFI (Draft Status Only)

Users MUST be able to edit RFI details when in draft status, but not after submission.

**Priority**: P0 (Critical)

#### Scenario: Update draft RFI

**Given** I am the creator of RFI "RFI-001"
**And** the RFI status is "draft"
**When** I update the title to "Updated clarification question"
**And** I update the description
**Then** the RFI is updated successfully
**And** the updated_at timestamp is refreshed
**And** an audit log entry is created

#### Scenario: Cannot update submitted RFI content

**Given** I am the creator of RFI "RFI-001"
**And** the RFI status is "submitted"
**When** I attempt to update the title or description
**Then** I receive an error "Cannot edit RFI after submission"
**And** the RFI remains unchanged

#### Scenario: Non-creator cannot edit RFI

**Given** I did not create RFI "RFI-001"
**And** I am not a project admin
**When** I attempt to update the RFI
**Then** I receive a 403 Forbidden error
**And** the RFI remains unchanged

---

### Requirement: Submit RFI (Transition to Submitted)

Users MUST be able to submit a draft RFI, triggering ball-in-court transfer and notifications.

**Priority**: P0 (Critical)

#### Scenario: Submit draft RFI to assignee

**Given** I am the creator of RFI "RFI-001"
**And** the RFI status is "draft"
**And** I have assigned the RFI to "Jane Architect"
**And** I have set a response_due_date of "2025-02-01"
**When** I click "Submit RFI"
**Then** the RFI status changes to "submitted"
**And** the submitted_at timestamp is set to now
**And** an email notification is sent to "Jane Architect"
**And** the ball-in-court is transferred to "Jane Architect"

#### Scenario: Cannot submit RFI without assignee

**Given** I am the creator of RFI "RFI-001"
**And** the RFI status is "draft"
**And** the RFI has no assigned_to_id or assigned_to_org
**When** I attempt to submit the RFI
**Then** I receive a validation error "Assignee required before submission"
**And** the RFI remains in "draft" status

---

### Requirement: Close RFI After Answer

Users MUST be able to close an answered RFI, finalizing the resolution.

**Priority**: P0 (Critical)

#### Scenario: Creator closes answered RFI

**Given** I am the creator of RFI "RFI-001"
**And** the RFI status is "answered"
**And** there is an official answer response
**When** I click "Close RFI"
**Then** the RFI status changes to "closed"
**And** the closed_at timestamp is set to now
**And** the ball-in-court is cleared (no longer assigned)
**And** an audit log entry is created

#### Scenario: Cannot close unanswered RFI

**Given** I am the creator of RFI "RFI-001"
**And** the RFI status is "submitted"
**And** there is no official answer
**When** I attempt to close the RFI
**Then** I receive a validation error "RFI must be answered before closing"
**And** the RFI remains in "submitted" status

---

### Requirement: Cancel RFI (Any Status)

Users MUST be able to cancel an RFI that is no longer needed.

**Priority**: P1 (High)

#### Scenario: Creator cancels RFI before submission

**Given** I am the creator of RFI "RFI-001"
**And** the RFI status is "draft"
**When** I click "Cancel RFI"
**Then** the RFI status changes to "cancelled"
**And** an audit log entry is created with reason
**And** no notifications are sent

#### Scenario: Project manager cancels submitted RFI

**Given** I am a project manager
**And** RFI "RFI-001" status is "submitted"
**When** I cancel the RFI with reason "Question answered verbally"
**Then** the RFI status changes to "cancelled"
**And** an email notification is sent to the assignee
**And** the reason is stored in the audit log

---

### Requirement: Soft Delete RFI (Admin Only)

Project admins MUST be able to soft-delete RFIs for cleanup, preserving audit trail.

**Priority**: P2 (Medium)

#### Scenario: Admin soft-deletes RFI

**Given** I am a project admin
**And** RFI "RFI-001" exists with status "cancelled"
**When** I delete the RFI
**Then** the RFI deleted_at timestamp is set to now
**And** the RFI no longer appears in normal list views
**And** the RFI is still accessible via direct link (for audit)
**And** an audit log entry is created

#### Scenario: Non-admin cannot delete RFI

**Given** I am a regular project member
**And** RFI "RFI-001" exists
**When** I attempt to delete the RFI
**Then** I receive a 403 Forbidden error
**And** the RFI is not deleted

---

### Requirement: RFI Status Workflow Validation

The system MUST enforce valid status transitions and prevent invalid state changes.

**Priority**: P0 (Critical)

#### Scenario: Valid status transitions

**Given** an RFI with status "draft"
**Then** valid transitions are: "submitted", "cancelled"
**And** invalid transitions are: "under_review", "answered", "closed"

**Given** an RFI with status "submitted"
**Then** valid transitions are: "under_review", "answered", "cancelled"
**And** invalid transitions are: "draft", "closed"

**Given** an RFI with status "answered"
**Then** valid transitions are: "closed", "submitted" (reopening)
**And** invalid transitions are: "draft", "under_review"

#### Scenario: Invalid status transition is rejected

**Given** RFI "RFI-001" has status "draft"
**When** I attempt to change status directly to "answered"
**Then** I receive a validation error "Invalid status transition: draft → answered"
**And** the RFI status remains "draft"

---

### Requirement: Search RFIs by Keyword

Users MUST be able to search RFIs by title, description, or RFI number.

**Priority**: P1 (High)

#### Scenario: Search RFIs by keyword in title

**Given** I am viewing the RFI list
**And** there are RFIs with titles containing "foundation" and "electrical"
**When** I search for "foundation"
**Then** I see only RFIs with "foundation" in title or description
**And** search terms are highlighted in results

#### Scenario: Search RFIs by number

**Given** I am viewing the RFI list
**When** I search for "RFI-005"
**Then** I see only the RFI with number "RFI-005"
**And** I am redirected directly to the detail page if only one match

---

## Test Coverage

### Unit Tests
- [x] RFI number generation logic (sequential, no conflicts)
- [x] Status transition validation (state machine)
- [x] Ball-in-court calculation per status
- [x] Search query building (full-text, filters)

### Integration Tests
- [x] RLS policies: users can only view/edit RFIs in accessible projects
- [x] Audit log triggers fire on all mutations
- [x] Concurrent RFI creation doesn't create duplicate numbers

### E2E Tests
- [x] Create draft RFI → Submit → Close workflow
- [x] Filter RFIs by status, assignee, overdue
- [x] Search RFIs by keyword
- [x] Invalid status transition is blocked

## Dependencies

- **Database**: `rfis` table, RLS policies, audit triggers
- **Auth**: Existing user authentication and project access
- **Storage**: Supabase Storage for attachments (rfi-attachments capability)

## Acceptance Criteria

- [ ] Project manager can create RFI with auto-generated number
- [ ] RFI list shows all project RFIs with filters (status, assignee, overdue)
- [ ] RFI detail page shows full context (responses, attachments, timeline)
- [ ] Draft RFIs can be edited, submitted RFIs cannot
- [ ] Status transitions follow valid workflow (draft → submitted → answered → closed)
- [ ] Search finds RFIs by keyword in title/description
- [ ] All mutations create audit log entries
- [ ] RLS policies prevent unauthorized access
