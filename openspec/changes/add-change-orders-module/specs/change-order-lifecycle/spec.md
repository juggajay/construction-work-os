# Capability: Change Order Lifecycle

## ADDED Requirements

### Requirement: CO-LIFE-001 - Change Order Creation
Users MUST be able to create new change orders with essential information including title, description, type, and originating event reference.

#### Scenario: Create change order from RFI
- **Given** a user is viewing an approved RFI with cost or schedule impact
- **When** they click "Create Change Order" from the RFI detail page
- **Then** a new change order is created in "contemplated" status
- **And** the originating_event_type is set to "rfi"
- **And** the originating_event_id references the RFI
- **And** the title and description are pre-populated from the RFI

#### Scenario: Create standalone change order
- **Given** a project manager identifies a scope change not related to an RFI
- **When** they navigate to the change orders page and click "New Change Order"
- **Then** they can create a change order with type "owner_requested" or "design_change"
- **And** the originating_event_type is set to "manual"
- **And** they must provide title, description, and estimated cost/schedule impact

### Requirement: CO-LIFE-002 - Change Order Numbering
Each change order MUST receive a unique sequential number based on its status (CO-001, PCO-001, COR-001).

#### Scenario: Automatic number assignment
- **Given** a user creates a new change order in "potential" status
- **When** the change order is saved
- **Then** it receives the next available PCO number (e.g., PCO-001, PCO-002)
- **And** the number is unique within the project
- **And** the number never changes even if status changes

#### Scenario: Number collision handling
- **Given** two users simultaneously create change orders
- **When** both save at the same time
- **Then** each receives a unique number without conflict
- **And** the system retries up to 3 times if a collision occurs
- **And** an error is returned only if all retries fail

### Requirement: CO-LIFE-003 - Status Workflow Transitions
Change orders MUST follow the state machine: contemplated → potential → proposed → approved → invoiced, with rejection and cancellation paths.

#### Scenario: Promote contemplated to potential
- **Given** a change order in "contemplated" status with estimated cost
- **When** the user clicks "Promote to PCO"
- **Then** the status changes to "potential"
- **And** a PCO number is assigned (PCO-001)
- **And** the submitted_at timestamp is recorded

#### Scenario: Submit potential as proposed
- **Given** a change order in "potential" status with complete line items
- **When** the user submits it for approval
- **Then** the status changes to "proposed"
- **And** the number prefix changes from PCO to COR (COR-001)
- **And** the first approval stage (GC review) is created with status "pending"

#### Scenario: Approve proposed change order
- **Given** a change order in "proposed" status with all approval stages completed
- **When** the final approver approves it
- **Then** the status changes to "approved"
- **And** the approved_at timestamp is recorded
- **And** the number prefix changes from COR to CO (CO-001)
- **And** the project cumulative_contract_value is updated

#### Scenario: Reject proposed change order
- **Given** a change order in "proposed" status in owner approval stage
- **When** the owner rejects it with a rejection reason
- **Then** the status changes to "rejected"
- **And** the rejected_at timestamp is recorded
- **And** the rejection reason is stored in the approval record
- **And** the creator can revise and resubmit (creating a new version)

### Requirement: CO-LIFE-004 - Change Order Types
Users MUST categorize change orders by type to enable filtering and reporting.

#### Scenario: Select change order type
- **Given** a user is creating a change order
- **When** they select a type from the dropdown
- **Then** they can choose from: "Scope Change", "Design Change", "Site Condition", "Owner Requested", "Time Extension", "Cost Only", "Schedule Only"
- **And** the type affects which fields are required (cost or schedule impact)

#### Scenario: Filter change orders by type
- **Given** a project has 50 change orders of various types
- **When** a user filters by type "Site Condition"
- **Then** only change orders with type "site_condition" are displayed
- **And** the count badge shows the filtered count

### Requirement: CO-LIFE-005 - Ball-in-Court Tracking
The system MUST clearly indicate which party is responsible for the next action on each change order.

#### Scenario: Contemplated status ball-in-court
- **Given** a change order in "contemplated" status
- **Then** the ball-in-court shows the creator
- **And** the action label is "Develop Estimate"

#### Scenario: Proposed status ball-in-court
- **Given** a change order in "proposed" status in owner approval stage
- **Then** the ball-in-court shows the owner organization
- **And** the action label is "Awaiting Owner Approval"

#### Scenario: Rejected status ball-in-court
- **Given** a change order in "rejected" status
- **Then** the ball-in-court shows the creator
- **And** the action label is "Revise and Resubmit"

### Requirement: CO-LIFE-006 - Change Order Editing
Users MUST be able to edit change orders in draft/contemplated/potential states, but not after approval.

#### Scenario: Edit contemplated change order
- **Given** a change order in "contemplated" status
- **When** the creator edits the title or description
- **Then** the changes are saved immediately
- **And** the updated_at timestamp is updated

#### Scenario: Prevent editing approved change order
- **Given** a change order in "approved" status
- **When** the user attempts to edit any field
- **Then** the edit UI is disabled
- **And** a message explains "Approved change orders cannot be edited. Create a new version for revisions."

### Requirement: CO-LIFE-007 - Change Order Deletion
Users MUST be able to soft-delete change orders in draft states, but not after submission.

#### Scenario: Delete contemplated change order
- **Given** a change order in "contemplated" status
- **When** the creator clicks "Delete"
- **Then** the change order is soft-deleted (deleted_at timestamp set)
- **And** it no longer appears in default list views
- **And** it can be restored by clearing the deleted_at field

#### Scenario: Prevent deletion of proposed change order
- **Given** a change order in "proposed" status
- **When** the user attempts to delete it
- **Then** the delete action is disabled
- **And** a message explains "Use 'Cancel' instead to preserve audit trail"

### Requirement: CO-LIFE-008 - Change Order Cancellation
Users MUST be able to cancel change orders at any stage to preserve audit trail.

#### Scenario: Cancel proposed change order
- **Given** a change order in "proposed" status
- **When** the user clicks "Cancel" and provides a reason
- **Then** the status changes to "cancelled"
- **And** the cancellation reason is stored
- **And** the change order remains visible in the audit trail
- **And** budget calculations exclude cancelled change orders

### Requirement: CO-LIFE-009 - Change Order Search and Filtering
Users MUST be able to search and filter change orders by multiple criteria.

#### Scenario: Search by title or number
- **Given** a project has 100 change orders
- **When** a user enters "CO-042" in the search box
- **Then** only change order CO-042 is displayed

#### Scenario: Filter by status
- **Given** a project has change orders in multiple statuses
- **When** a user filters by status "proposed"
- **Then** only change orders in "proposed" status are displayed
- **And** the count badge reflects the filtered count

#### Scenario: Filter by cost range
- **Given** a project has change orders with various cost impacts
- **When** a user filters by cost range "$10,000 - $50,000"
- **Then** only change orders with cost_impact in that range are displayed

### Requirement: CO-LIFE-010 - Change Order List Performance
The change order list MUST render efficiently even with 1,000+ change orders.

#### Scenario: Load large change order list
- **Given** a project has 1,000 change orders
- **When** a user navigates to the change orders page
- **Then** the list renders in less than 500ms
- **And** virtualization is used to render only visible rows
- **And** scrolling is smooth without lag
