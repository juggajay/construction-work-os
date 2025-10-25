# Capability: Change Order Approvals

## ADDED Requirements

### Requirement: CO-APPR-001 - Multi-Stage Approval Workflow
Change orders MUST progress through a multi-stage approval workflow with clear ownership at each stage.

#### Scenario: Submit change order for GC review
- **Given** a change order in "potential" status with complete line items
- **When** the creator submits it for approval
- **Then** the status changes to "proposed"
- **And** an approval record is created for stage "gc_review" with status "pending"
- **And** the ball-in-court is assigned to the GC review team

#### Scenario: GC approves and forwards to owner
- **Given** a change order in "proposed" status at "gc_review" stage
- **When** the GC reviewer approves it
- **Then** the gc_review approval record status changes to "approved"
- **And** a new approval record is created for stage "owner_approval" with status "pending"
- **And** the ball-in-court is assigned to the owner

#### Scenario: Owner approves and forwards to architect
- **Given** a change order in "proposed" status at "owner_approval" stage
- **When** the owner approves it
- **Then** the owner_approval approval record status changes to "approved"
- **And** a new approval record is created for stage "architect_approval" with status "pending"
- **And** the ball-in-court is assigned to the architect

#### Scenario: Architect approves (final approval)
- **Given** a change order in "proposed" status at "architect_approval" stage
- **When** the architect approves it
- **Then** the architect_approval approval record status changes to "approved"
- **And** the change order status changes to "approved"
- **And** the approved_at timestamp is recorded

### Requirement: CO-APPR-002 - Approval Rejection Handling
Approvers MUST be able to reject change orders with reasons, allowing creators to revise and resubmit.

#### Scenario: Owner rejects change order
- **Given** a change order in "proposed" status at "owner_approval" stage
- **When** the owner clicks "Reject" and provides a reason "Cost is too high"
- **Then** the owner_approval approval record status changes to "rejected"
- **And** the change order status changes to "rejected"
- **And** the rejection reason is stored in the approval notes
- **And** the ball-in-court returns to the creator

#### Scenario: Revise and resubmit after rejection
- **Given** a change order in "rejected" status
- **When** the creator creates a new version with revised pricing
- **Then** the current_version increments (from 1 to 2)
- **And** the status returns to "proposed"
- **And** all approval stages are reset to "pending"
- **And** the approval workflow starts over from GC review

### Requirement: CO-APPR-003 - Approval Notes and Comments
Approvers MUST be able to add notes and comments during the approval process.

#### Scenario: Approve with notes
- **Given** a change order in "proposed" status at "owner_approval" stage
- **When** the owner approves it with notes "Approved. Expedite procurement."
- **Then** the approval record stores the notes
- **And** the notes are visible in the approval timeline
- **And** an email notification includes the notes

#### Scenario: View approval timeline
- **Given** a change order that has gone through multiple approval stages
- **When** a user views the change order detail page
- **Then** an approval timeline shows all stages with timestamps
- **And** approver names and notes are displayed for each completed stage
- **And** pending stages are shown with "Awaiting Approval" status

### Requirement: CO-APPR-004 - Approval Permissions
Only users with appropriate project roles MUST be able to approve change orders at each stage.

#### Scenario: GC project manager approves at GC review stage
- **Given** a user with project role "manager" in the GC organization
- **When** they view a change order at "gc_review" stage
- **Then** they see "Approve" and "Reject" buttons
- **And** they can submit approval decisions

#### Scenario: Prevent unauthorized approval
- **Given** a user with project role "viewer"
- **When** they view a change order at any approval stage
- **Then** the "Approve" and "Reject" buttons are disabled
- **And** a message explains "You do not have permission to approve change orders"

### Requirement: CO-APPR-005 - Skip Optional Approval Stages
The system MUST allow skipping the architect approval stage if not required for the project.

#### Scenario: Skip architect approval
- **Given** a project configured to skip architect approval
- **When** the owner approves a change order
- **Then** the change order status changes directly to "approved"
- **And** no architect_approval stage is created
- **And** the approved_at timestamp is recorded

#### Scenario: Require all approval stages
- **Given** a project configured to require all approval stages
- **When** the owner approves a change order
- **Then** the architect_approval stage is created
- **And** the change order remains in "proposed" status until architect approves

### Requirement: CO-APPR-006 - Approval Email Notifications
Email notifications MUST be sent when change orders reach each approval stage.

#### Scenario: Notify owner when forwarded for approval
- **Given** a change order approved at GC review stage
- **When** the system creates the owner_approval stage
- **Then** an email is sent to the owner approver
- **And** the email includes change order number, title, cost impact
- **And** the email includes a direct link to the approval page

#### Scenario: Notify creator when rejected
- **Given** a change order rejected at owner approval stage
- **When** the rejection is recorded
- **Then** an email is sent to the creator
- **And** the email includes the rejection reason
- **And** the email includes a link to revise and resubmit

### Requirement: CO-APPR-007 - Approval History Immutability
Once an approval decision is recorded, it MUST NOT be editable to maintain audit compliance.

#### Scenario: Attempt to edit approved stage
- **Given** an approval stage with status "approved"
- **When** a user attempts to change the decision
- **Then** the system prevents the edit
- **And** a message explains "Approval decisions are immutable for audit compliance"

#### Scenario: View complete approval history
- **Given** a change order that has been revised and resubmitted multiple times
- **When** a user views the approval history
- **Then** all approval decisions for all versions are visible
- **And** each decision shows approver name, timestamp, and notes

### Requirement: CO-APPR-008 - Concurrent Approval Handling
The system MUST prevent race conditions when multiple approvers act simultaneously.

#### Scenario: Prevent double approval
- **Given** two GC managers attempt to approve the same change order at the same time
- **When** both submit approval decisions within 1 second
- **Then** only the first approval is recorded
- **And** the second approver sees a message "This stage has already been approved"

### Requirement: CO-APPR-009 - Approval Delegation
Users MUST be able to delegate approval authority to other users on their team.

#### Scenario: Delegate approval to alternate
- **Given** an owner approver who will be unavailable
- **When** they delegate approval authority to another user
- **Then** the delegate receives approval notifications
- **And** the delegate can approve or reject on behalf of the owner
- **And** the audit trail shows both the delegator and delegate

### Requirement: CO-APPR-010 - Bulk Approval Actions
Users MUST be able to approve multiple change orders at once if they have appropriate permissions.

#### Scenario: Bulk approve multiple small change orders
- **Given** a GC manager reviewing 10 change orders all under $1,000
- **When** they select all 10 and click "Bulk Approve"
- **Then** all 10 change orders are approved at once
- **And** all approval stages advance to the next stage
- **And** individual approval records are created for each
