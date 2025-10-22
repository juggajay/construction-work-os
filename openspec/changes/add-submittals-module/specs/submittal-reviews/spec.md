# Capability: Submittal Review Workflow

**Capability ID**: `submittal-reviews`
**Status**: New
**Owner**: Backend Team

## Purpose

Enable multi-stage review workflow for submittals with clear ball-in-court tracking, approval statuses (Approved, Approved as Noted, Revise and Resubmit, Rejected), and stage progression through GC → A/E → Owner review paths.

## ADDED Requirements

### Requirement: Submit Submittal for Initial Review

Users MUST be able to submit a draft submittal for initial GC review, transitioning it to the review workflow.

**Priority**: P0 (Critical)

#### Scenario: Subcontractor submits draft submittal for GC review

**Given** I created submittal "03 30 00-001" with status "draft"
**And** all required fields are completed (title, spec section, attachments)
**When** I click "Submit for Review"
**And** I select reviewer "John Smith (GC Project Engineer)"
**Then** the submittal status changes to "submitted"
**And** the current_stage changes to "gc_review"
**And** the current_reviewer_id is set to John Smith's ID
**And** the submitted_at timestamp is recorded
**And** an email notification is sent to John Smith
**And** I receive confirmation "Submittal submitted to GC for review"

#### Scenario: Cannot submit submittal without required attachments

**Given** I created submittal "03 30 00-001" with status "draft"
**And** no attachments have been uploaded
**When** I attempt to submit for review
**Then** the submission is blocked with error "At least one attachment required"
**And** the status remains "draft"

---

### Requirement: Perform GC Review with Approval Actions

GC reviewers MUST be able to review submittals and take actions: Approve, Approve as Noted, Forward to A/E, Request Revision, or Reject.

**Priority**: P0 (Critical)

#### Scenario: GC approves submittal without A/E review needed

**Given** submittal "03 30 00-001" is in "gc_review" stage
**And** I am the current reviewer
**When** I select action "Approved"
**And** I add comments "Mix design meets specifications"
**And** I submit the review
**Then** a review record is created with action "approved"
**And** the submittal status changes to "approved"
**And** the current_stage changes to "complete"
**And** the reviewed_at timestamp is recorded
**And** the closed_at timestamp is recorded
**And** an email notification is sent to the submittal creator
**And** the submittal creator receives "Submittal approved by GC"

#### Scenario: GC approves with notes

**Given** submittal "03 30 00-001" is in "gc_review" stage
**And** I am the current reviewer
**When** I select action "Approved as Noted"
**And** I add comments "Approved with minor color adjustment per spec 03 30 00.2.1"
**And** I submit the review
**Then** the submittal status changes to "approved_as_noted"
**And** the current_stage changes to "complete"
**And** the review comments are visible on the submittal detail page
**And** an email is sent to the creator with the approval notes

#### Scenario: GC forwards submittal to A/E for review

**Given** submittal "03 30 00-001" is in "gc_review" stage
**And** I am the current reviewer
**When** I select action "Forward to A/E Review"
**And** I select reviewer "Sarah Johnson (Architect)"
**And** I add comments "Please verify structural details on shop drawings"
**And** I submit the review
**Then** a review record is created with action "forwarded"
**And** the submittal status remains "submitted"
**And** the current_stage changes to "ae_review"
**And** the current_reviewer_id is set to Sarah Johnson's ID
**And** an email notification is sent to Sarah Johnson
**And** the submittal creator is notified "Submittal forwarded to A/E for review"

#### Scenario: GC requests revision

**Given** submittal "03 30 00-001" is in "gc_review" stage
**And** I am the current reviewer
**When** I select action "Revise and Resubmit"
**And** I add comments "Missing concrete strength test data. Please resubmit with 28-day test results."
**And** I submit the review
**Then** a review record is created with action "revise_resubmit"
**And** the submittal status changes to "revise_resubmit"
**And** the current_stage changes to "complete"
**And** the current_reviewer_id is cleared
**And** the closed_at timestamp is recorded
**And** an email is sent to the creator requesting revision
**And** the creator can create a resubmittal (new version)

#### Scenario: GC rejects submittal

**Given** submittal "03 30 00-001" is in "gc_review" stage
**And** I am the current reviewer
**When** I select action "Rejected"
**And** I add comments "Concrete mix design does not meet specification 03 30 00. Non-compliant materials."
**And** I submit the review
**Then** a review record is created with action "rejected"
**And** the submittal status changes to "rejected"
**And** the current_stage changes to "complete"
**And** the closed_at timestamp is recorded
**And** an email is sent to the creator with rejection reason

---

### Requirement: Perform A/E Review with Approval Actions

A/E reviewers MUST be able to review submittals forwarded from GC and take actions: Approve, Approve as Noted, Forward to Owner (optional), Request Revision, or Reject.

**Priority**: P0 (Critical)

#### Scenario: A/E approves submittal

**Given** submittal "03 30 00-001" is in "ae_review" stage
**And** I am the current A/E reviewer
**When** I select action "Approved"
**And** I add comments "Shop drawings comply with structural design"
**And** I submit the review
**Then** a review record is created with action "approved"
**And** the submittal status changes to "approved"
**And** the current_stage changes to "complete"
**And** email notifications are sent to GC and submittal creator

#### Scenario: A/E forwards to owner for final approval

**Given** submittal "03 30 00-001" is in "ae_review" stage
**And** I am the current A/E reviewer
**And** the submittal is marked as "Owner approval required"
**When** I select action "Forward to Owner Review"
**And** I select reviewer "Mike Davis (Owner Rep)"
**And** I add comments "Forwarding for owner approval of finish selection"
**And** I submit the review
**Then** a review record is created with action "forwarded"
**And** the current_stage changes to "owner_review"
**And** the current_reviewer_id is set to Mike Davis's ID
**And** an email notification is sent to Mike Davis

#### Scenario: A/E requests revision from subcontractor

**Given** submittal "03 30 00-001" is in "ae_review" stage
**And** I am the current A/E reviewer
**When** I select action "Revise and Resubmit"
**And** I add comments "Revise detail 3/S-102 to show additional rebar per structural notes"
**And** I submit the review
**Then** the submittal status changes to "revise_resubmit"
**And** ball-in-court returns to the submittal creator
**And** an email is sent to the creator and GC with revision request

---

### Requirement: Perform Owner Review (Optional Final Stage)

Owner representatives MUST be able to review submittals requiring owner approval and take final approval actions.

**Priority**: P1 (Important)

#### Scenario: Owner approves submittal

**Given** submittal "03 30 00-001" is in "owner_review" stage
**And** I am the current owner reviewer
**When** I select action "Approved"
**And** I add comments "Finish selection approved"
**And** I submit the review
**Then** the submittal status changes to "approved"
**And** the current_stage changes to "complete"
**And** email notifications are sent to A/E, GC, and submittal creator
**And** all parties receive "Submittal approved by Owner"

#### Scenario: Owner requests changes through A/E

**Given** submittal "03 30 00-001" is in "owner_review" stage
**And** I am the current owner reviewer
**When** I select action "Revise and Resubmit"
**And** I add comments "Change finish color to match owner's interior design standards"
**And** I submit the review
**Then** the submittal status changes to "revise_resubmit"
**And** ball-in-court returns to submittal creator
**And** an email chain includes A/E, GC, and creator

---

### Requirement: View Review History Timeline

Users MUST be able to view complete review history showing all review actions, reviewers, timestamps, and comments in chronological order.

**Priority**: P0 (Critical)

#### Scenario: View review timeline for multi-stage submittal

**Given** submittal "03 30 00-001" has gone through:
  - GC review (forwarded to A/E)
  - A/E review (requested revision)
  - Resubmittal as Rev A
  - GC review Rev A (forwarded to A/E)
  - A/E review Rev A (approved)
**When** I view the submittal detail page
**Then** I see a visual timeline showing:
  - Rev 0: Submitted → GC Review (John Smith, forwarded) → A/E Review (Sarah Johnson, revise and resubmit)
  - Rev A: Submitted → GC Review (John Smith, forwarded) → A/E Review (Sarah Johnson, approved)
**And** each review shows: reviewer name, action, comments, timestamp
**And** the timeline is color-coded: green for approvals, yellow for forwards, red for revisions/rejections

---

### Requirement: Ball-in-Court Tracking

The system MUST clearly indicate who currently needs to act on a submittal (ball-in-court) at each stage.

**Priority**: P0 (Critical)

#### Scenario: View my pending reviews (ball-in-court for me)

**Given** I am authenticated as a GC reviewer
**And** 5 submittals are assigned to me with current_stage "gc_review"
**And** 10 other submittals are in different stages
**When** I navigate to "My Reviews" dashboard
**Then** I see only the 5 submittals where I am the current reviewer
**And** each shows: number, title, spec section, submitted date, days pending
**And** urgent items (>7 days pending) are highlighted
**And** I see a count badge "5 pending reviews"

#### Scenario: Ball-in-court returns to creator after revision request

**Given** submittal "03 30 00-001" was in "gc_review"
**And** the GC requested revision
**When** the review is submitted
**Then** the current_reviewer_id is cleared
**And** the status shows "revise_resubmit"
**And** the creator sees "Action required: Revise and resubmit" on their dashboard
**And** the creator can create a new version (resubmittal)

---

### Requirement: Prevent Unauthorized Review Actions

The system MUST prevent users from performing review actions on submittals not assigned to them.

**Priority**: P0 (Critical)

#### Scenario: Non-reviewer cannot approve submittal

**Given** submittal "03 30 00-001" is in "gc_review"
**And** the current_reviewer_id is John Smith
**And** I am authenticated as Jane Doe (not the assigned reviewer)
**When** I attempt to approve the submittal
**Then** the action is rejected with "You are not the assigned reviewer"
**And** no review record is created

#### Scenario: Cannot review submittal after it has moved to next stage

**Given** submittal "03 30 00-001" was in "gc_review" assigned to me
**And** another admin forwarded it to "ae_review"
**When** I attempt to perform a review action
**Then** the action is rejected with "Submittal has moved to next review stage"

---

### Requirement: Email Notifications for Review Events

Users MUST receive email notifications for key review events: submission, review completed, approval, revision request, rejection.

**Priority**: P1 (Important)

#### Scenario: Reviewer receives email when submittal assigned

**Given** submittal "03 30 00-001" is submitted for review
**And** I am assigned as the GC reviewer
**When** the submittal is submitted
**Then** I receive an email with:
  - Subject: "New Submittal for Review: 03 30 00-001"
  - Submittal details: title, spec section, submitter
  - Link to submittal detail page
  - Expected review timeline

#### Scenario: Creator receives email on approval

**Given** I created submittal "03 30 00-001"
**And** the submittal was under A/E review
**When** the A/E approves the submittal
**Then** I receive an email with:
  - Subject: "Submittal Approved: 03 30 00-001"
  - Approval status (Approved / Approved as Noted)
  - Reviewer comments
  - Link to view approved submittal

#### Scenario: Creator receives email on revision request

**Given** I created submittal "03 30 00-001"
**When** the GC requests revision
**Then** I receive an email with:
  - Subject: "Revision Required: 03 30 00-001"
  - Reviewer comments explaining required changes
  - Link to create resubmittal
  - Procurement deadline warning (if overdue)

---

### Requirement: Review Action Audit Trail

All review actions MUST be recorded in an immutable audit log for compliance and dispute resolution.

**Priority**: P0 (Critical)

#### Scenario: Audit log captures all review details

**Given** I am the GC reviewer for submittal "03 30 00-001"
**When** I approve the submittal with comments
**Then** an audit log entry is created containing:
  - Submittal ID and version number
  - Review action (approved)
  - Reviewer user ID and name
  - Timestamp (ISO 8601 format)
  - IP address and user agent
  - Previous status and new status
  - Comments text
**And** the audit log entry cannot be modified or deleted
**And** admins can view the complete audit trail

---

### Requirement: Skip Optional Review Stages

The system MUST support skipping optional review stages (A/E review, owner review) based on submittal type and project configuration.

**Priority**: P2 (Nice to Have)

#### Scenario: GC directly approves submittal without A/E review

**Given** submittal "03 30 00-001" is minor product data
**And** the project configuration allows GC to approve directly
**When** the GC selects action "Approved" (not "Forward to A/E")
**Then** the submittal status changes to "approved"
**And** the A/E review stage is skipped
**And** the submittal moves directly to "complete"

#### Scenario: A/E approves without owner review

**Given** submittal "03 30 00-001" does not require owner approval
**When** the A/E selects action "Approved"
**Then** the submittal status changes to "approved"
**And** the owner review stage is skipped
**And** the current_stage changes to "complete"
