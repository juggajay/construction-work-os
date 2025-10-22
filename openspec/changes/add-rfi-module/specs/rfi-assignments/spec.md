# Capability: RFI Assignments & Ball-in-Court Tracking

**Capability ID**: `rfi-assignments`
**Status**: New
**Owner**: Backend Team

## Purpose

Enable clear ownership and routing of RFIs through ball-in-court tracking, assignment notifications, and SLA monitoring to ensure timely responses.

## ADDED Requirements

### Requirement: Assign RFI to User or Organization

Users MUST be able to assign an RFI to an individual user (internal) or organization (external A/E).

**Priority**: P0 (Critical)

#### Scenario: Assign RFI to internal project member

**Given** I am the creator of draft RFI "RFI-001"
**And** "Jane Doe" is a member of the project team
**When** I assign the RFI to "Jane Doe"
**Then** the RFI assigned_to_id is set to Jane's user ID
**And** the assigned_to_org is null
**And** the ball-in-court indicator shows "Jane Doe"

#### Scenario: Assign RFI to external organization

**Given** I am the creator of draft RFI "RFI-001"
**And** "ABC Architecture" is an external A/E firm
**When** I assign the RFI to "ABC Architecture"
**Then** the RFI assigned_to_org is set to ABC's org ID
**And** the assigned_to_id is null
**And** the ball-in-court indicator shows "ABC Architecture"

#### Scenario: Cannot assign to both user and org

**Given** I am creating an RFI
**When** I attempt to assign to both "Jane Doe" AND "ABC Architecture"
**Then** I receive a validation error "Assign to either user or organization, not both"
**And** the RFI remains unassigned

---

### Requirement: Reassign RFI to Different Party

Users MUST be able to reassign an RFI to a different user or organization at any time before closure.

**Priority**: P0 (Critical)

#### Scenario: Assignee reassigns to another team member

**Given** I am assigned RFI "RFI-001" with status "submitted"
**And** "John Smith" is a project member
**When** I reassign the RFI to "John Smith"
**Then** the assigned_to_id changes to John's user ID
**And** an email notification is sent to "John Smith"
**And** an audit log entry records the reassignment
**And** the ball-in-court transfers to "John Smith"

#### Scenario: Creator reassigns draft RFI

**Given** I am the creator of draft RFI "RFI-001"
**And** the RFI is currently assigned to "Jane Doe"
**When** I reassign the RFI to "Mike Engineer"
**Then** the assigned_to_id changes to Mike's user ID
**And** no notification is sent (still in draft)

---

### Requirement: Set Response Due Date for SLA Tracking

Users MUST be able to set a response due date to track SLA compliance.

**Priority**: P0 (Critical)

#### Scenario: Set due date when creating RFI

**Given** I am creating a new RFI
**When** I set response_due_date to "2025-02-15 17:00:00"
**Then** the response_due_date is stored
**And** the overdue_at timestamp is calculated as "2025-02-15 17:00:00"

#### Scenario: Update due date for submitted RFI

**Given** RFI "RFI-001" has status "submitted"
**And** I am the creator or project manager
**And** the current response_due_date is "2025-02-15"
**When** I extend the due date to "2025-02-20"
**Then** the response_due_date is updated
**And** the overdue_at timestamp is recalculated
**And** an email notification is sent to the assignee

#### Scenario: Cannot remove due date after submission

**Given** RFI "RFI-001" has status "submitted"
**And** the RFI has a response_due_date set
**When** I attempt to clear the response_due_date
**Then** I receive a validation error "Due date required for submitted RFIs"
**And** the due date remains unchanged

---

### Requirement: Overdue RFI Alerts

Users MUST receive notifications when an RFI becomes overdue.

**Priority**: P0 (Critical)

#### Scenario: RFI becomes overdue

**Given** RFI "RFI-001" has response_due_date "2025-01-20 17:00:00"
**And** the RFI status is "submitted"
**And** no official answer has been provided
**When** the current time passes "2025-01-20 17:00:00"
**Then** the RFI is marked as overdue
**And** an email notification is sent to the assignee
**And** a daily digest is sent to the project manager
**And** the RFI list shows a red "Overdue" badge

#### Scenario: Overdue status clears when answered

**Given** RFI "RFI-001" is overdue
**When** an official answer is provided
**Then** the RFI status changes to "answered"
**And** the overdue indicator is removed
**And** no further overdue alerts are sent

---

### Requirement: Ball-in-Court Visibility

Users MUST clearly see who is responsible for the next action on each RFI.

**Priority**: P0 (Critical)

#### Scenario: Ball-in-court for draft RFI

**Given** RFI "RFI-001" has status "draft"
**And** I am the creator
**Then** the ball-in-court indicator shows "You (Draft)"
**And** suggested actions are: "Edit", "Submit", "Cancel"

#### Scenario: Ball-in-court for submitted RFI

**Given** RFI "RFI-001" has status "submitted"
**And** the RFI is assigned to "Jane Architect"
**Then** the ball-in-court indicator shows "Jane Architect"
**And** if I am "Jane Architect", suggested actions are: "Respond", "Reassign"
**And** if I am the creator, suggested actions are: "View status"

#### Scenario: Ball-in-court for answered RFI

**Given** RFI "RFI-001" has status "answered"
**And** I am the creator
**Then** the ball-in-court indicator shows "You (Review Answer)"
**And** suggested actions are: "Close", "Request Clarification"

---

### Requirement: Email Notifications for Assignments

Users MUST receive email notifications when assigned an RFI or when RFI status changes.

**Priority**: P0 (Critical)

#### Scenario: User receives assignment notification

**Given** I am a project member
**When** RFI "RFI-001" is submitted and assigned to me
**Then** I receive an email with subject "You've been assigned RFI-001: {title}"
**And** the email contains: RFI title, description, assignor name, due date
**And** the email has a "View RFI" link to the detail page

#### Scenario: User receives response notification

**Given** I am the creator of RFI "RFI-001"
**And** the RFI is assigned to "Jane Architect"
**When** "Jane Architect" adds a response
**Then** I receive an email with subject "New response on RFI-001"
**And** the email contains the response text
**And** the email has a "View RFI" link

#### Scenario: User receives overdue notification

**Given** I am assigned RFI "RFI-001"
**And** the RFI is overdue by 2 days
**When** the daily overdue digest runs
**Then** I receive an email with subject "Overdue RFIs: 1 item needs your attention"
**And** the email lists all my overdue RFIs

---

### Requirement: AI-Suggested Assignees (Phase 2)

The system MUST be able to suggest appropriate assignees based on RFI discipline and historical patterns.

**Priority**: P2 (Medium)

#### Scenario: AI suggests assignee for structural RFI

**Given** I am creating a new RFI
**And** I set the discipline to "structural"
**And** I set spec_section to "03 30 00" (Concrete)
**When** I click "Suggest Assignee"
**Then** the system suggests "Mike Structural Engineer"
**And** the suggestion includes confidence score "85%"
**And** the suggestion includes reason "Handled 12 structural RFIs, avg 1.5 day response"

#### Scenario: No suggestions available

**Given** I am creating a new RFI
**And** the discipline is "specialty" (uncommon)
**And** no team members have handled this discipline before
**When** I click "Suggest Assignee"
**Then** the system shows "No suggestions available"
**And** I must manually select an assignee

---

### Requirement: Track Assignment History

The system MUST maintain a complete history of all assignment changes for audit compliance.

**Priority**: P1 (High)

#### Scenario: View assignment history timeline

**Given** RFI "RFI-001" has been reassigned 3 times
**And** I am viewing the RFI detail page
**When** I click "View History"
**Then** I see a timeline showing all assignments:
  - "Created by Alice, assigned to Bob" (Jan 15, 10:00 AM)
  - "Reassigned from Bob to Carol" (Jan 16, 2:00 PM)
  - "Reassigned from Carol to Dave" (Jan 17, 9:00 AM)
  - "Reassigned from Dave to Eve" (Jan 18, 11:00 AM)
**And** each entry shows who made the change and when

---

## Test Coverage

### Unit Tests
- [x] Assignment validation (user XOR org, not both)
- [x] Ball-in-court calculation for each status
- [x] Overdue detection logic
- [x] AI assignment suggestion algorithm

### Integration Tests
- [x] Email notifications sent on assignment
- [x] Email notifications sent on response
- [x] Overdue digest includes all overdue RFIs
- [x] Assignment history audit log

### E2E Tests
- [x] Assign RFI → Receive notification
- [x] Reassign RFI → New assignee notified
- [x] RFI becomes overdue → Alert sent

## Dependencies

- **Email Service**: SendGrid for assignment/response/overdue notifications
- **rfi-lifecycle**: Core RFI data model and status workflow
- **Database**: Audit log for assignment history

## Acceptance Criteria

- [ ] User can assign RFI to individual user or external org
- [ ] Assignee receives email notification on assignment
- [ ] Ball-in-court indicator clearly shows who is responsible
- [ ] Overdue RFIs trigger email alerts to assignee and project manager
- [ ] Response due dates can be set and updated
- [ ] Assignment history is fully audited
- [ ] AI suggests assignees based on discipline/spec section (Phase 2)
