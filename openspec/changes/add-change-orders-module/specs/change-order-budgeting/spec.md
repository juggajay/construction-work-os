# Capability: Change Order Budgeting

## ADDED Requirements

### Requirement: CO-BUDG-001 - Cumulative Contract Value Tracking
The system MUST calculate and display the cumulative contract value (original + all approved change orders).

#### Scenario: Update contract value on approval
- **Given** a project with original contract value $500,000
- **And** an approved change order with cost_impact $25,000
- **When** the change order is approved
- **Then** the project cumulative_contract_value updates to $525,000
- **And** the budget dashboard reflects the new value

### Requirement: CO-BUDG-002 - Budget Impact Reporting
Users MUST see real-time budget impact analysis showing variance from original contract.

#### Scenario: View budget impact dashboard
- **Given** a project with 15 approved change orders totaling $120,000
- **When** a user views the budget dashboard
- **Then** they see:
  - Original contract value: $500,000
  - Approved change orders: $120,000
  - Current contract value: $620,000
  - Percentage change: +24%

### Requirement: CO-BUDG-003 - Cost Breakdown by Type
Users MUST be able to view change order costs grouped by type (scope, design, site condition, etc.).

#### Scenario: Cost breakdown by change order type
- **Given** a project with change orders of various types
- **When** a user views the cost breakdown report
- **Then** they see costs grouped by type:
  - Scope changes: $45,000
  - Site conditions: $30,000
  - Owner requested: $25,000
  - Design changes: $20,000

### Requirement: CO-BUDG-004 - Budget Forecasting
Users MUST see pending (unapproved) change order costs in budget forecasts.

#### Scenario: Include pending change orders in forecast
- **Given** a project with:
  - Original contract: $500,000
  - Approved COs: $50,000
  - Pending COs (in proposed status): $30,000
- **When** a user views the budget forecast
- **Then** they see:
  - Current contract: $550,000
  - Potential additions (pending): $30,000
  - Forecast total: $580,000

### Requirement: CO-BUDG-005 - Budget Alert Thresholds
Users MUST receive alerts when cumulative change orders exceed configured thresholds.

#### Scenario: Alert when 10% threshold exceeded
- **Given** a project with original contract $500,000 and alert threshold 10%
- **When** cumulative approved change orders reach $51,000 (10.2%)
- **Then** an alert notification is sent to project managers
- **And** the budget dashboard shows a warning indicator

### Requirement: CO-BUDG-006 - Budget Export
Users MUST be able to export budget data with change orders for QuickBooks integration.

#### Scenario: Export budget data to CSV
- **Given** a project with change order data
- **When** a user clicks "Export Budget to CSV"
- **Then** a CSV file is generated with columns:
  - CO number, description, type, cost_impact, status, approved_date
- **And** the CSV can be imported into QuickBooks
