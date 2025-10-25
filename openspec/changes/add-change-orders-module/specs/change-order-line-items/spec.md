# Capability: Change Order Line Items

## ADDED Requirements

### Requirement: CO-LINE-001 - Line Item Creation and Management
Users MUST be able to add, edit, and delete line items with quantity, unit cost, and extended cost calculations.

#### Scenario: Add line item with automatic cost calculation
- **Given** a change order in "contemplated" or "potential" status
- **When** a user adds a line item with description "Concrete", quantity 50, unit "CY", unit_cost $150
- **Then** the extended_cost is automatically calculated as $7,500 (50 * $150)
- **And** the line item is saved to the database
- **And** the change order cost_impact is recalculated

#### Scenario: Edit line item and recalculate
- **Given** a line item with quantity 50 and unit_cost $150
- **When** the user changes quantity to 60
- **Then** the extended_cost updates to $9,000
- **And** the change order cost_impact is recalculated

### Requirement: CO-LINE-002 - CSI Section Assignment
Line items MUST be categorized by CSI MasterFormat sections for cost reporting.

#### Scenario: Assign CSI section to line item
- **Given** a user is creating a concrete line item
- **When** they select CSI section "03 30 00 - Cast-in-Place Concrete"
- **Then** the csi_section field is set to "03 30 00"
- **And** the line item can be filtered and reported by CSI division

### Requirement: CO-LINE-003 - Tax Calculation
Line items MUST support tax rate and tax amount calculations.

#### Scenario: Apply sales tax to line item
- **Given** a line item with extended_cost $7,500
- **When** the user applies a tax_rate of 8.5%
- **Then** the tax_amount is calculated as $637.50
- **And** the total_amount is $8,137.50 (extended_cost + tax_amount)

### Requirement: CO-LINE-004 - Line Item Ordering
Users MUST be able to reorder line items by drag-and-drop.

#### Scenario: Reorder line items
- **Given** a change order with 5 line items
- **When** the user drags line item #3 to position #1
- **Then** the sort_order values are updated
- **And** the line items display in the new order

### Requirement: CO-LINE-005 - Subcontractor Cost and GC Markup
Line items MUST track subcontractor cost and GC markup separately for transparency.

#### Scenario: Add line item with markup
- **Given** a line item with sub_cost $10,000
- **When** the user applies gc_markup_percent 15%
- **Then** the gc_markup_amount is calculated as $1,500
- **And** the extended_cost is $11,500 (sub_cost + gc_markup_amount)

### Requirement: CO-LINE-006 - Line Item Deletion
Users MUST be able to delete line items from unapproved change orders.

#### Scenario: Delete line item
- **Given** a change order in "potential" status with 3 line items
- **When** the user deletes line item #2
- **Then** the line item is removed
- **And** the change order cost_impact is recalculated

### Requirement: CO-LINE-007 - Line Item Versioning
Line items MUST be preserved across versions for comparison.

#### Scenario: Create new version preserves line items
- **Given** a change order with 5 line items in version 1
- **When** the user creates version 2 (after rejection)
- **Then** all 5 line items are copied to version 2
- **And** the user can edit version 2 line items without affecting version 1

### Requirement: CO-LINE-008 - Line Item Import
Users MUST be able to import line items from CSV for bulk entry.

#### Scenario: Import line items from CSV
- **Given** a CSV file with columns: description, quantity, unit, unit_cost, csi_section
- **When** the user imports the file
- **Then** line items are created for each row
- **And** extended_cost is calculated for each
- **And** validation errors are reported for invalid rows

### Requirement: CO-LINE-009 - Line Item Total Calculation
The system MUST calculate and display subtotal, total tax, and grand total.

#### Scenario: Calculate totals for change order
- **Given** a change order with 3 line items:
  - Line 1: extended_cost $5,000, tax $425
  - Line 2: extended_cost $8,000, tax $680
  - Line 3: extended_cost $2,000, tax $170
- **Then** the subtotal is $15,000
- **And** the total tax is $1,275
- **And** the grand total (cost_impact) is $16,275

### Requirement: CO-LINE-010 - Line Item Permissions
Only users with edit permissions MUST be able to modify line items.

#### Scenario: Prevent viewer from editing line items
- **Given** a user with project role "viewer"
- **When** they view a change order with line items
- **Then** the line item editor is disabled
- **And** a message explains "You do not have permission to edit line items"
