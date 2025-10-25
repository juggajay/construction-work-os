# Capability: Change Order Integrations

## ADDED Requirements

### Requirement: CO-INTG-001 - RFI to Change Order Linking
Users MUST be able to create change orders directly from RFIs that have cost or schedule impact.

#### Scenario: Create change order from RFI
- **Given** an approved RFI with description "Structural steel substitution required"
- **When** a user clicks "Create Change Order" from the RFI detail page
- **Then** a new change order is created with:
  - originating_event_type: "rfi"
  - originating_event_id: <RFI UUID>
  - Title pre-populated from RFI title
  - Description pre-populated from RFI description
- **And** the change order detail page shows a link back to the originating RFI

#### Scenario: View change orders from RFI
- **Given** an RFI that has generated 2 change orders
- **When** a user views the RFI detail page
- **Then** a "Related Change Orders" section lists both COs
- **And** clicking a CO navigates to the change order detail page

### Requirement: CO-INTG-002 - Submittal to Change Order Linking
Users MUST be able to create change orders from submittals when product substitutions occur.

#### Scenario: Create change order from submittal substitution
- **Given** a submittal with status "revise_resubmit" due to product unavailability
- **When** a user clicks "Create Change Order" for product substitution
- **Then** a new change order is created with:
  - originating_event_type: "submittal"
  - Type: "scope_change" or "design_change"
- **And** the submittal detail page shows a link to the change order

### Requirement: CO-INTG-003 - Daily Report to Change Order Linking
Users MUST be able to create change orders from daily report incidents (site conditions, delays).

#### Scenario: Create change order from site condition incident
- **Given** a daily report incident with type "unforeseen_site_condition"
- **When** a user clicks "Create Change Order" from the incident
- **Then** a new change order is created with:
  - originating_event_type: "daily_report"
  - Type: "site_condition"
  - Photos from the daily report automatically attached

### Requirement: CO-INTG-004 - Project Dashboard Integration
The project dashboard MUST display change order summary metrics.

#### Scenario: Display change order metrics on dashboard
- **Given** a project with 15 change orders (10 approved, 3 proposed, 2 rejected)
- **When** a user views the project dashboard
- **Then** the dashboard shows:
  - Total change orders: 15
  - Approved: 10 ($150,000)
  - Pending: 3 ($25,000)
  - Contract value: $650,000 (+30%)

### Requirement: CO-INTG-005 - Notification Integration
Change order events MUST trigger notifications via email and in-app.

#### Scenario: Notify on approval request
- **Given** a change order submitted for owner approval
- **When** the system creates the owner_approval stage
- **Then** an email notification is sent to the owner
- **And** an in-app notification appears in the owner's notification center

### Requirement: CO-INTG-006 - Budget System Integration
Approved change orders MUST automatically update project budget fields.

#### Scenario: Update project budget on approval
- **Given** a change order approved with cost_impact $25,000
- **When** the approval is finalized
- **Then** the project.cumulative_contract_value increases by $25,000
- **And** budget variance reports reflect the change

### Requirement: CO-INTG-007 - Audit Log Integration
All change order actions MUST be recorded in the audit log.

#### Scenario: Log change order creation
- **Given** a user creates a new change order
- **When** the change order is saved
- **Then** an audit log entry is created with:
  - Action: "create"
  - Table: "change_orders"
  - Record ID: <CO UUID>
  - User ID: <creator UUID>
  - Changes: Full record data

#### Scenario: Log approval decision
- **Given** an approver approves a change order
- **When** the approval is recorded
- **Then** an audit log entry is created with:
  - Action: "approve"
  - Table: "change_order_approvals"
  - Approval stage and notes

### Requirement: CO-INTG-008 - Navigation Menu Integration
Change orders MUST be accessible from the project navigation menu.

#### Scenario: Enable change orders menu item
- **Given** the change orders module is deployed
- **When** a user views a project page
- **Then** the "Change Orders" menu item is enabled (not grayed out)
- **And** clicking it navigates to the change orders list page

### Requirement: CO-INTG-009 - Search Integration
Change orders MUST be searchable from the global project search.

#### Scenario: Search for change order by number
- **Given** a user in the global search box
- **When** they type "CO-042"
- **Then** the search results include change order CO-042
- **And** clicking the result navigates to the detail page

### Requirement: CO-INTG-010 - QuickBooks Export Integration
Users MUST be able to export change order data for QuickBooks import.

#### Scenario: Export to QuickBooks CSV
- **Given** a project with 20 approved change orders
- **When** a user clicks "Export to QuickBooks"
- **Then** a CSV file is generated with QuickBooks-compatible columns
- **And** the CSV includes: CO number, description, amount, date, CSI section
- **And** the user can manually import the CSV into QuickBooks
