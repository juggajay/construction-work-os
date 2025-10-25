# Capability: Change Order Versions

## ADDED Requirements

### Requirement: CO-VERS-001 - Version Creation
Users MUST be able to create new versions of rejected change orders for negotiation and resubmission.

#### Scenario: Create new version after rejection
- **Given** a change order in "rejected" status at version 1
- **When** the creator clicks "Create New Version"
- **Then** the current_version increments to 2
- **And** all line items from version 1 are copied to version 2
- **And** the status returns to "potential" for editing
- **And** a version record is created with reason "Owner requested revisions"

### Requirement: CO-VERS-002 - Version History Display
Users MUST be able to view complete version history with all changes.

#### Scenario: View version history
- **Given** a change order with 3 versions
- **When** a user navigates to the "Version History" tab
- **Then** all 3 versions are listed with version number, date, creator, reason
- **And** each version shows the cost_impact and schedule_impact_days at that time

### Requirement: CO-VERS-003 - Version Comparison
Users MUST be able to compare two versions side-by-side to see pricing differences.

#### Scenario: Compare version 1 and version 2
- **Given** a change order with version 1 (cost $15,000) and version 2 (cost $12,000)
- **When** the user selects "Compare Versions" and chooses v1 vs v2
- **Then** a side-by-side comparison shows:
  - Line items added, removed, or modified
  - Cost changes highlighted in red (increases) and green (decreases)
  - Total cost difference ($3,000 reduction)

### Requirement: CO-VERS-004 - Version Immutability
Once a version is submitted for approval, it MUST become immutable.

#### Scenario: Prevent editing submitted version
- **Given** a change order at version 2 in "proposed" status
- **When** a user attempts to edit line items
- **Then** the system prevents edits
- **And** a message explains "Create a new version to make changes"

### Requirement: CO-VERS-005 - Version Reason Tracking
Each version MUST have a reason explaining why it was created.

#### Scenario: Provide reason for new version
- **Given** a user is creating version 2 after rejection
- **When** they enter reason "Reduced scope per owner request"
- **Then** the reason is stored in the change_order_versions record
- **And** the reason is visible in the version history

### Requirement: CO-VERS-006 - Approval Reset on New Version
Creating a new version MUST reset all approval stages to pending.

#### Scenario: Reset approvals for new version
- **Given** a change order at version 1 rejected at owner_approval stage
- **When** the creator creates version 2
- **Then** all approval records for version 2 are created with status "pending"
- **And** the approval workflow starts over from gc_review
