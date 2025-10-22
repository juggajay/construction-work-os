# Capability: Daily Report Entries Management

**Capability ID**: `daily-report-entries`
**Status**: New
**Owner**: Backend Team

## Purpose

Enable construction teams to record detailed crew hours, equipment usage, material deliveries, and incidents as structured entries within daily reports.

## ADDED Requirements

### Requirement: Add Crew Entry to Daily Report

Users MUST be able to add crew entries tracking headcount, hours worked, and labor classification by trade.

**Priority**: P0 (Critical)

#### Scenario: Add crew entry for electrical trade

**Given** I am editing a draft daily report for 2025-01-20
**When** I add a crew entry with:
- Trade: "Electrician"
- CSI Division: "26 - Electrical"
- Headcount: 3
- Hours worked: 24.0
- Classification: "Journeyman"
**Then** the crew entry is saved to the daily report
**And** the total_crew_count is updated to 3
**And** an audit log entry is created

#### Scenario: Add multiple crew entries for different trades

**Given** I am editing a draft daily report
**When** I add crew entries for:
- Electricians: 3 workers, 24 hours
- Plumbers: 2 workers, 16 hours
- General Labor: 5 workers, 40 hours
**Then** all three crew entries are saved
**And** the total_crew_count is updated to 10
**And** total crew hours across all trades is 80 hours

#### Scenario: Add crew entry for subcontractor

**Given** I am editing a draft daily report
**When** I add a crew entry with:
- Trade: "HVAC"
- Subcontractor: "ABC Mechanical Corp"
- Headcount: 4
- Hours worked: 32.0
**Then** the crew entry is linked to the subcontractor organization
**And** the entry is flagged as subcontractor work (not GC direct)

---

### Requirement: Update Crew Entry Hours and Headcount

Users MUST be able to modify crew entry details while the daily report is in draft status.

**Priority**: P0 (Critical)

#### Scenario: Update crew headcount and hours

**Given** a draft daily report has a crew entry for "Electricians" with headcount 3, hours 24
**When** I update the headcount to 4 and hours to 32
**Then** the crew entry is updated
**And** the total_crew_count is recalculated
**And** the updated_at timestamp is refreshed

#### Scenario: Cannot update crew entry after submission

**Given** a daily report has status "submitted"
**And** it has a crew entry for "Electricians"
**When** I attempt to update the crew entry
**Then** I receive an error "Cannot modify entries after report submission"
**And** the crew entry remains unchanged

---

### Requirement: Delete Crew Entry from Draft Report

Users MUST be able to remove crew entries from draft daily reports.

**Priority**: P1 (High)

#### Scenario: Delete crew entry from draft

**Given** a draft daily report has a crew entry for "Plumbers"
**When** I delete the crew entry
**Then** the entry is removed from the report
**And** the total_crew_count is recalculated
**And** an audit log entry is created

---

### Requirement: Add Equipment Entry to Daily Report

Users MUST be able to log equipment usage with hours, operator, and fuel consumption.

**Priority**: P0 (Critical)

#### Scenario: Add equipment entry for excavator

**Given** I am editing a draft daily report
**When** I add an equipment entry with:
- Equipment type: "Excavator"
- Equipment ID: "EXC-12"
- Operator name: "John Smith"
- Hours used: 8.5
- Fuel consumed: 25 gallons
**Then** the equipment entry is saved to the daily report
**And** an audit log entry is created

#### Scenario: Add rental equipment with cost

**Given** I am editing a draft daily report
**When** I add an equipment entry with:
- Equipment type: "Crane"
- Equipment ID: "Rental-CR-5"
- Hours used: 4.0
- Rental cost: $350/day
**Then** the equipment entry is saved
**And** the rental cost is tracked for billing purposes

---

### Requirement: Update Equipment Hours and Usage

Users MUST be able to modify equipment entry details while the daily report is in draft status.

**Priority**: P1 (High)

#### Scenario: Update equipment hours and fuel

**Given** a draft daily report has an equipment entry for "Forklift" with hours 6.0, fuel 10 gallons
**When** I update hours to 8.0 and fuel to 15 gallons
**Then** the equipment entry is updated
**And** the updated_at timestamp is refreshed

---

### Requirement: Add Material Delivery Entry to Daily Report

Users MUST be able to record material deliveries with supplier, quantity, and storage location.

**Priority**: P0 (Critical)

#### Scenario: Add material delivery for concrete

**Given** I am editing a draft daily report
**When** I add a material entry with:
- Material: "Concrete - 4000 PSI"
- Supplier: "Ready Mix Inc"
- Quantity: 15
- Unit: "CY" (cubic yards)
- Delivery time: 10:30 AM
- Delivery ticket: "RM-2025-0120-003"
- Location: "Level 2, Grid A-C"
**Then** the material entry is saved to the daily report
**And** an audit log entry is created

#### Scenario: Add multiple material deliveries

**Given** I am editing a draft daily report
**When** I add material entries for:
- Concrete: 15 CY from Ready Mix Inc
- Rebar #5: 2000 LF from Steel Supply Co
- Lumber 2x4: 500 LF from Lumber Yard
**Then** all three material entries are saved
**And** each has its own delivery ticket and location

---

### Requirement: Add Incident Entry to Daily Report

Users MUST be able to document safety incidents, delays, inspections, and site visitors.

**Priority**: P0 (Critical)

#### Scenario: Add safety incident with corrective action

**Given** I am editing a draft daily report
**When** I add an incident entry with:
- Type: "safety"
- Severity: "medium"
- Time occurred: 2:15 PM
- Description: "Worker slipped on wet surface near entrance"
- Involved parties: "John Doe, ABC Plumbing"
- Corrective action: "Installed wet floor signs, cordoned off area"
- OSHA recordable: No
**Then** the incident entry is saved to the daily report
**And** a safety alert notification is sent to the project manager
**And** an audit log entry is created

#### Scenario: Add delay incident with impact

**Given** I am editing a draft daily report
**When** I add an incident entry with:
- Type: "delay"
- Severity: "high"
- Time occurred: 9:00 AM
- Description: "Rain stopped concrete pour, rescheduled to tomorrow"
- Corrective action: "Crew reassigned to interior framing"
- Follow-up required: Yes
**Then** the incident entry is saved
**And** the delay is flagged for schedule impact tracking

#### Scenario: Add site inspection record

**Given** I am editing a draft daily report
**When** I add an incident entry with:
- Type: "inspection"
- Time occurred: 1:00 PM
- Description: "City building inspector reviewed electrical rough-in"
- Involved parties: "Inspector Mike Johnson, License #12345"
- Notes: "Approved with minor corrections to conduit support spacing"
**Then** the inspection record is saved
**And** it appears in the project inspection log

#### Scenario: Add visitor log entry

**Given** I am editing a draft daily report
**When** I add an incident entry with:
- Type: "visitor"
- Time occurred: 11:30 AM
- Description: "Owner representatives toured site"
- Involved parties: "Jane Smith (Owner), Tom Brown (Design Consultant)"
**Then** the visitor entry is saved
**And** it appears in the project visitor log

---

### Requirement: OSHA-Recordable Safety Incident Flagging

Users MUST be able to mark safety incidents as OSHA-recordable for compliance reporting.

**Priority**: P1 (High)

#### Scenario: Flag safety incident as OSHA-recordable

**Given** I am adding a safety incident entry
**And** the incident involved a worker requiring medical treatment beyond first aid
**When** I check the "OSHA-recordable" checkbox
**Then** the incident is flagged for OSHA Form 300 reporting
**And** a notification is sent to the safety manager
**And** the incident appears in the OSHA compliance dashboard

---

### Requirement: View All Entries in Organized Sections

Users MUST be able to view all entries grouped by type (crew, equipment, materials, incidents) on the daily report detail page.

**Priority**: P0 (Critical)

#### Scenario: View daily report with all entry types

**Given** a daily report has:
- 3 crew entries
- 2 equipment entries
- 4 material entries
- 1 safety incident
**When** I view the daily report detail page
**Then** I see sections for:
- "Crew" showing all 3 crew entries in a table
- "Equipment" showing all 2 equipment entries
- "Materials" showing all 4 material entries
- "Incidents" showing 1 incident with severity badge
**And** each section has summary statistics (total hours, total equipment hours, etc.)

---

### Requirement: Calculate Summary Statistics from Entries

The system MUST automatically calculate and display aggregate statistics based on entries.

**Priority**: P1 (High)

#### Scenario: Calculate total crew hours

**Given** a daily report has crew entries:
- Electricians: 3 workers × 8 hours = 24 hours
- Plumbers: 2 workers × 8 hours = 16 hours
**When** I view the daily report
**Then** the summary shows "Total crew hours: 40"

#### Scenario: Calculate total equipment hours

**Given** a daily report has equipment entries:
- Excavator: 8.5 hours
- Forklift: 6.0 hours
**When** I view the daily report
**Then** the summary shows "Total equipment hours: 14.5"

---

### Requirement: Export Crew Hours to QuickBooks Format

Users MUST be able to export crew hours entries in QuickBooks IIF format for accounting import.

**Priority**: P1 (High)

#### Scenario: Generate QuickBooks crew hours CSV

**Given** a daily report for 2025-01-20 has crew entries:
- Electricians: 3 workers, 24 hours, Journeyman
- Plumbers: 2 workers, 16 hours, Foreman
**When** I click "Export to QuickBooks"
**Then** a CSV file is downloaded with format:
```
!TIMEACT	DATE	JOB	EMP	ITEM	PITEM	DURATION	NOTE
TIMEACT	1/20/2025	Project-ABC	Electrician Crew	Journeyman	Labor	8.0	Daily Report: Electrical rough-in
TIMEACT	1/20/2025	Project-ABC	Plumber Crew	Foreman	Labor	8.0	Daily Report: Plumbing installation
```
**And** the export includes all crew entries for the report date

---

### Requirement: Validate Entry Data Constraints

The system MUST enforce data validation rules on all entry types.

**Priority**: P0 (Critical)

#### Scenario: Validate crew entry required fields

**Given** I am adding a crew entry
**When** I attempt to save without specifying "Trade" or "Headcount"
**Then** I receive a validation error "Trade and headcount are required"
**And** the entry is not saved

#### Scenario: Validate equipment hours are positive

**Given** I am adding an equipment entry
**When** I attempt to enter hours_used as "-5" or "0"
**Then** I receive a validation error "Equipment hours must be greater than 0"
**And** the entry is not saved

#### Scenario: Validate material quantity and unit

**Given** I am adding a material entry
**When** I attempt to save without specifying "Quantity" or "Unit"
**Then** I receive a validation error "Quantity and unit are required"
**And** the entry is not saved

---

## Test Coverage

### Unit Tests
- [x] Crew entry CRUD operations
- [x] Equipment entry CRUD operations
- [x] Material entry CRUD operations
- [x] Incident entry CRUD operations
- [x] Summary statistics calculation (total hours, counts)
- [x] QuickBooks CSV generation format
- [x] Entry validation rules (required fields, positive numbers)

### Integration Tests
- [x] RLS policies: entries inherit access from parent daily report
- [x] Cascade updates: changing crew headcount updates total_crew_count
- [x] Prevent entry modification after report submission
- [x] OSHA-recordable incident notifications

### E2E Tests
- [x] Add crew → equipment → materials → incidents → Submit workflow
- [x] Update crew hours → Verify summary statistics recalculated
- [x] Delete equipment entry → Verify removed from list
- [x] Export crew hours to QuickBooks CSV

## Dependencies

- **Database**: Crew, equipment, material, incident tables linked to daily_reports
- **Parent capability**: daily-report-lifecycle (report status controls entry mutability)
- **Notifications**: Safety incident alerts to project manager

## Acceptance Criteria

- [ ] User can add crew entries with trade, headcount, hours, classification
- [ ] User can add equipment entries with type, hours, operator, fuel
- [ ] User can add material entries with description, quantity, supplier, delivery info
- [ ] User can add incident entries with type, severity, description, corrective action
- [ ] Summary statistics automatically calculate total hours and counts
- [ ] Entries cannot be modified after report submission (immutable)
- [ ] OSHA-recordable incidents trigger notifications to safety manager
- [ ] QuickBooks export generates correct IIF format for crew hours
- [ ] All entry operations create audit log entries
- [ ] RLS policies prevent unauthorized access to entries
