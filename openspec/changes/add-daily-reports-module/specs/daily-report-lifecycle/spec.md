# Capability: Daily Report Lifecycle Management

**Capability ID**: `daily-report-lifecycle`
**Status**: New
**Owner**: Backend Team

## Purpose

Enable construction teams to create, view, update, and manage the complete lifecycle of daily field reports with proper status workflow, unique date constraints, and audit compliance.

## ADDED Requirements

### Requirement: Create Daily Report for Specific Date

Users MUST be able to create a new daily report for a specific calendar date with automatic weather data capture.

**Priority**: P0 (Critical)

#### Scenario: Field supervisor creates first daily report for project

**Given** I am authenticated as a field supervisor
**And** my project "Sunset Tower" has no daily report for date 2025-01-20
**When** I create a daily report for date 2025-01-20
**Then** the daily report is created with status "draft"
**And** I am set as the creator
**And** weather data is automatically fetched for the project location
**And** the created_at timestamp is recorded

#### Scenario: Multiple users can create draft reports for same date

**Given** user Alice creates a draft daily report for 2025-01-20
**And** user Bob also creates a draft daily report for 2025-01-20
**When** both reports are in draft status
**Then** both drafts coexist without conflict
**And** only one can be submitted (first submission wins)

#### Scenario: Cannot create duplicate submitted reports for same date

**Given** project "Sunset Tower" has a submitted daily report for 2025-01-20
**When** I attempt to submit another daily report for 2025-01-20
**Then** I receive an error "A report for this date has already been submitted"
**And** the submission is rejected
**And** I am shown a link to the existing report

---

### Requirement: View Daily Report List with Filtering

Users MUST be able to view a list of all daily reports in a project with filtering by date range, status, weather, and submitter.

**Priority**: P0 (Critical)

#### Scenario: View all daily reports in project

**Given** I am authenticated and have access to project "Sunset Tower"
**And** the project has 30 daily reports for January 2025
**When** I navigate to the daily reports list page
**Then** I see all 30 reports displayed in a calendar view
**And** each report shows: date, weather icon, status, submitter, crew count
**And** reports are sorted by report_date descending (newest first)

#### Scenario: Filter daily reports by date range

**Given** I am viewing the daily reports list
**When** I filter by date range "2025-01-01" to "2025-01-15"
**Then** I see only reports within that date range
**And** the calendar highlights days with reports
**And** days without reports are visually indicated as gaps

#### Scenario: Filter daily reports by status

**Given** I am viewing the daily reports list
**And** there are 10 "draft", 15 "submitted", and 5 "approved" reports
**When** I filter by status "submitted"
**Then** I see only the 15 reports with status "submitted"
**And** the filter is reflected in the URL query params

#### Scenario: Filter daily reports by weather condition

**Given** I am viewing the daily reports list
**When** I filter by weather condition "rain"
**Then** I see only reports where weather_condition is "rain"
**And** this helps identify rain delays and weather-impacted days

---

### Requirement: View Daily Report Detail with All Entries

Users MUST be able to view complete daily report details including weather, crew, equipment, materials, incidents, and photos.

**Priority**: P0 (Critical)

#### Scenario: View daily report detail page

**Given** I am authenticated and have access to daily report for 2025-01-20
**When** I click on the report in the list
**Then** I am navigated to the detail page
**And** I see the report date and weather conditions
**And** I see all crew entries with trade, headcount, and hours
**And** I see all equipment entries with type, hours, and operator
**And** I see all material entries with description, quantity, and supplier
**And** I see all incidents with type, severity, and description
**And** I see all photo attachments in a gallery view
**And** I see the narrative and work summary
**And** I see a status timeline showing all state transitions

#### Scenario: Daily report shows summary statistics

**Given** I am viewing a daily report
**When** the page loads
**Then** I see summary cards showing:
- Total crew count (sum of all crew headcount)
- Total crew hours (sum of all hours worked)
- Equipment count (number of unique equipment entries)
- Photo count (number of attachments)
- Incident count (number of incidents recorded)

---

### Requirement: Update Daily Report (Draft Status Only)

Users MUST be able to edit daily report details and entries when in draft status, but not after submission.

**Priority**: P0 (Critical)

#### Scenario: Update draft daily report

**Given** I am the creator of a daily report for 2025-01-20
**And** the report status is "draft"
**When** I update the narrative to "Completed framing on Level 2"
**And** I update the work hours
**Then** the report is updated successfully
**And** the updated_at timestamp is refreshed
**And** an audit log entry is created

#### Scenario: Cannot update submitted daily report content

**Given** I am the creator of a daily report for 2025-01-20
**And** the report status is "submitted"
**When** I attempt to update the narrative or add crew entries
**Then** I receive an error "Cannot edit daily report after submission"
**And** the report remains unchanged

#### Scenario: Admin can revert report to draft for corrections

**Given** I am a project admin
**And** a daily report for 2025-01-20 has status "submitted"
**When** I revert the report to "draft" status with reason "Need to add missing crew hours"
**Then** the report status changes to "draft"
**And** the report becomes editable again
**And** an audit log entry records the reversion and reason
**And** a notification is sent to the original submitter

---

### Requirement: Submit Daily Report with Validation

Users MUST be able to submit a draft daily report, triggering validation and status change.

**Priority**: P0 (Critical)

#### Scenario: Submit draft daily report with required fields

**Given** I am the creator of a draft daily report for 2025-01-20
**And** the report has weather conditions populated
**And** the report has at least one crew entry OR equipment entry OR a narrative
**When** I click "Submit Report"
**Then** the report status changes to "submitted"
**And** the submitted_at timestamp is set to now
**And** the submitted_by is set to my user ID
**And** a notification is sent to the project manager
**And** the report becomes immutable (read-only)

#### Scenario: Cannot submit daily report without required fields

**Given** I am the creator of a draft daily report for 2025-01-20
**And** the report has no crew entries, no equipment entries, and no narrative
**When** I attempt to submit the report
**Then** I receive a validation error "Report must have crew entries, equipment entries, or a narrative before submission"
**And** the report remains in "draft" status

#### Scenario: Cannot submit report for same date as existing submitted report

**Given** a daily report for 2025-01-20 is already submitted
**And** I have a draft daily report for 2025-01-20
**When** I attempt to submit my draft
**Then** I receive an error "A report for this date has already been submitted by [name]"
**And** my draft remains in "draft" status
**And** I am shown options to: view existing report, delete my draft, or contact admin

---

### Requirement: Approve Daily Report (Project Manager Only)

Project managers MUST be able to approve submitted daily reports, finalizing them for record-keeping.

**Priority**: P1 (High)

#### Scenario: Project manager approves submitted daily report

**Given** I am a project manager
**And** a daily report for 2025-01-20 has status "submitted"
**When** I click "Approve Report"
**Then** the report status changes to "approved"
**And** the approved_at timestamp is set to now
**And** the approved_by is set to my user ID
**And** an audit log entry is created
**And** a notification is sent to the submitter

#### Scenario: Field supervisor cannot approve reports

**Given** I am a field supervisor (not project manager)
**And** a daily report for 2025-01-20 has status "submitted"
**When** I attempt to approve the report
**Then** I receive a 403 Forbidden error "Only project managers can approve daily reports"
**And** the report remains in "submitted" status

---

### Requirement: Archive Old Daily Reports Automatically

The system MUST automatically archive approved daily reports older than 90 days for performance optimization.

**Priority**: P2 (Medium)

#### Scenario: Background job archives old reports

**Given** a daily report for 2024-10-01 has status "approved"
**And** today is 2025-01-10 (over 90 days later)
**When** the nightly archival job runs
**Then** the report status changes to "archived"
**And** the report remains accessible for viewing
**And** the report is moved to read-only cold storage (Phase 2)
**And** an audit log entry is created

---

### Requirement: Copy Data from Previous Daily Report

Users MUST be able to quickly create a new daily report by copying crew and equipment entries from the previous day.

**Priority**: P0 (Critical)

#### Scenario: Create daily report from previous day's data

**Given** I am creating a daily report for 2025-01-21
**And** a daily report exists for 2025-01-20 with:
- 3 crew entries (Electricians, Plumbers, General Labor)
- 2 equipment entries (Forklift, Generator)
**When** I click "Copy from Previous Day"
**Then** a new draft report is created for 2025-01-21
**And** all crew entries from 2025-01-20 are duplicated (without notes)
**And** all equipment entries from 2025-01-20 are duplicated (without notes)
**And** the narrative and incidents are NOT copied (date-specific)
**And** I can modify the copied entries before submission

#### Scenario: No previous report exists to copy from

**Given** I am creating a daily report for 2025-01-01
**And** no previous daily reports exist for this project
**When** I attempt to copy from previous day
**Then** I receive a message "No previous report found. Start from scratch."
**And** a blank draft report is created

---

### Requirement: Soft Delete Daily Report (Admin Only)

Project admins MUST be able to soft-delete daily reports for cleanup, preserving audit trail.

**Priority**: P2 (Medium)

#### Scenario: Admin soft-deletes draft daily report

**Given** I am a project admin
**And** a daily report for 2025-01-20 exists with status "draft"
**When** I delete the report
**Then** the report deleted_at timestamp is set to now
**And** the report no longer appears in normal list views
**And** the report is still accessible via direct link (for audit)
**And** an audit log entry is created

#### Scenario: Non-admin cannot delete daily reports

**Given** I am a field supervisor (not admin)
**And** a daily report for 2025-01-20 exists
**When** I attempt to delete the report
**Then** I receive a 403 Forbidden error
**And** the report is not deleted

---

### Requirement: Daily Report Status Workflow Validation

The system MUST enforce valid status transitions and prevent invalid state changes.

**Priority**: P0 (Critical)

#### Scenario: Valid status transitions

**Given** a daily report with status "draft"
**Then** valid transitions are: "submitted", "deleted" (soft delete)
**And** invalid transitions are: "approved", "archived"

**Given** a daily report with status "submitted"
**Then** valid transitions are: "approved", "draft" (admin revert only), "deleted" (admin only)
**And** invalid transitions are: "archived"

**Given** a daily report with status "approved"
**Then** valid transitions are: "archived" (automatic after 90 days), "draft" (admin emergency corrections), "deleted" (admin only)

#### Scenario: Invalid status transition is rejected

**Given** a daily report has status "draft"
**When** I attempt to change status directly to "approved"
**Then** I receive a validation error "Invalid status transition: draft → approved (must submit first)"
**And** the report status remains "draft"

---

### Requirement: Search Daily Reports by Keyword

Users MUST be able to search daily reports by narrative content, crew trade, equipment type, or incident description.

**Priority**: P1 (High)

#### Scenario: Search daily reports by narrative keyword

**Given** I am viewing the daily reports list
**And** there are reports with narratives containing "concrete pour" and "electrical rough-in"
**When** I search for "concrete"
**Then** I see only reports with "concrete" in narrative or material entries
**And** search terms are highlighted in results

#### Scenario: Search daily reports by incident keyword

**Given** I am viewing the daily reports list
**And** there is a report with an incident containing "safety violation"
**When** I search for "safety"
**Then** I see reports with "safety" in incident descriptions
**And** incident badges are displayed prominently

---

## Test Coverage

### Unit Tests
- [x] One-report-per-date constraint enforcement
- [x] Status transition validation (state machine)
- [x] Required field validation before submission
- [x] Copy-from-previous logic (crew/equipment duplication)

### Integration Tests
- [x] RLS policies: users can only view/edit reports in accessible projects
- [x] Audit log triggers fire on all mutations
- [x] Concurrent submissions for same date (first wins, others rejected)
- [x] Unique constraint on (project_id, report_date) for submitted reports

### E2E Tests
- [x] Create draft report → Add entries → Submit workflow
- [x] Copy from previous day → Modify entries → Submit
- [x] Filter reports by date range, status, weather
- [x] Search reports by keyword
- [x] Admin revert submitted report to draft

## Dependencies

- **Database**: `daily_reports` table, RLS policies, audit triggers
- **Auth**: Existing user authentication and project access
- **Weather API**: OpenWeatherMap for automatic weather data capture
- **Child entities**: Crew, equipment, material entries (daily-report-entries capability)

## Acceptance Criteria

- [ ] Field supervisor can create draft daily report for specific date
- [ ] Only one submitted/approved report allowed per project per date
- [ ] Daily report list shows all reports with filters (date range, status, weather)
- [ ] Daily report detail page shows all entries and summary statistics
- [ ] Draft reports can be edited, submitted reports cannot (unless reverted by admin)
- [ ] Status transitions follow valid workflow (draft → submitted → approved → archived)
- [ ] Copy-from-previous creates new report with previous crew/equipment entries
- [ ] Search finds reports by keyword in narrative, crew, equipment, incidents
- [ ] All mutations create audit log entries
- [ ] RLS policies prevent unauthorized access
