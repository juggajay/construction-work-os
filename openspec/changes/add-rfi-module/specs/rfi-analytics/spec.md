# Capability: RFI Analytics & Reporting

**Capability ID**: `rfi-analytics`
**Status**: New
**Owner**: Backend Team

## Purpose

Provide project managers with analytics, reporting, and insights on RFI performance, SLA compliance, and team responsiveness.

## ADDED Requirements

### Requirement: RFI Dashboard Widget on Project Page

The project dashboard MUST show a summary widget with key RFI metrics.

**Priority**: P1 (High)

#### Scenario: View RFI summary on project dashboard

**Given** I am viewing the project "Sunset Tower" dashboard
**And** the project has 25 total RFIs
**And** 5 are open, 3 are overdue, 20 are closed
**When** the dashboard loads
**Then** I see an RFI summary card showing:
  - Total RFIs: 25
  - Open: 5
  - Overdue: 3 (red badge)
  - Closed: 20
**And** I see a "View All RFIs" link

#### Scenario: Dashboard shows recent RFI activity

**Given** the last 3 RFI events were:
  1. RFI-005 submitted 2 hours ago
  2. RFI-003 answered 1 day ago
  3. RFI-008 closed 2 days ago
**When** I view the project dashboard
**Then** I see a "Recent RFI Activity" section
**And** it shows the 3 most recent events with timestamps

---

### Requirement: SLA Compliance Report

Project managers MUST be able to view SLA compliance metrics for RFIs.

**Priority**: P0 (Critical)

#### Scenario: View overall SLA compliance

**Given** I am a project manager on "Sunset Tower"
**And** the project has 50 closed RFIs
**And** 40 were answered within response_due_date
**And** 10 were answered late
**When** I navigate to the RFI Analytics page
**Then** I see "SLA Compliance Rate: 80% (40/50)"
**And** I see a line chart showing compliance trend over time
**And** I see a breakdown by discipline

#### Scenario: Filter SLA compliance by date range

**Given** I am viewing the RFI Analytics page
**When** I filter by date range "Last 30 days"
**Then** I see SLA compliance metrics for RFIs closed in the last 30 days
**And** the chart updates to show only the filtered period

---

### Requirement: Average Response Time by Discipline

Users MUST be able to view average RFI response time broken down by discipline.

**Priority**: P1 (High)

#### Scenario: View response time by discipline

**Given** the project has RFIs across 5 disciplines:
  - Structural: 10 RFIs, avg 2.3 days response time
  - Mechanical: 8 RFIs, avg 4.1 days
  - Electrical: 12 RFIs, avg 1.8 days
  - Plumbing: 6 RFIs, avg 3.5 days
  - Architectural: 14 RFIs, avg 2.9 days
**When** I view the RFI Analytics page
**Then** I see a bar chart showing average response time by discipline
**And** disciplines are sorted by response time (fastest first)
**And** each bar shows the response time in days

---

### Requirement: Top Assignees by Volume

Users MUST be able to see which team members handle the most RFIs.

**Priority**: P2 (Medium)

#### Scenario: View top assignees by RFI count

**Given** the project has 50 RFIs assigned to various team members:
  - Alice: 15 RFIs
  - Bob: 12 RFIs
  - Carol: 10 RFIs
  - Dave: 8 RFIs
  - Eve: 5 RFIs
**When** I view the RFI Analytics page
**Then** I see a "Top Assignees" table
**And** it shows the top 5 assignees by RFI count
**And** each row shows: Name, RFI count, Avg response time, SLA compliance %

---

### Requirement: Overdue RFI Alert Dashboard

Project managers MUST have a dedicated view for all overdue RFIs.

**Priority**: P0 (Critical)

#### Scenario: View all overdue RFIs

**Given** I am a project manager
**And** the project has 3 overdue RFIs:
  - RFI-005: 2 days overdue, assigned to Alice
  - RFI-012: 5 days overdue, assigned to Bob
  - RFI-018: 1 day overdue, assigned to Carol
**When** I click "Overdue RFIs" on the dashboard
**Then** I see a table with all 3 overdue RFIs
**And** each row shows: Number, Title, Assignee, Days overdue
**And** rows are sorted by days overdue (most overdue first)
**And** I can click "Send Reminder" to notify the assignee

#### Scenario: Send bulk reminder for overdue RFIs

**Given** I am viewing the overdue RFI list
**And** there are 5 overdue RFIs
**When** I click "Send Reminders to All"
**Then** email reminders are sent to all 5 assignees
**And** a success message shows "Reminders sent to 5 users"
**And** the last_reminder_sent_at timestamp is updated for each RFI

---

### Requirement: Export RFI Log to CSV

Users MUST be able to export the complete RFI log as a CSV file for external reporting.

**Priority**: P1 (High)

#### Scenario: Export all RFIs to CSV

**Given** I am viewing the RFI list
**And** the project has 100 RFIs
**When** I click "Export to CSV"
**Then** a CSV file is generated with all 100 RFIs
**And** the CSV filename is "RFIs-{project-name}-{date}.csv"
**And** the CSV includes columns:
  - Number, Title, Description, Discipline, Status, Priority
  - Assigned To, Created By, Submitted At, Due Date, Answered At, Closed At
  - Cost Impact, Schedule Impact, Spec Section, Drawing Reference
**And** the download starts automatically

#### Scenario: Export filtered RFIs to CSV

**Given** I am viewing the RFI list filtered by status "submitted"
**And** 15 RFIs match the filter
**When** I click "Export to CSV"
**Then** only the 15 filtered RFIs are included in the CSV
**And** the CSV filename includes the filter: "RFIs-{project-name}-submitted-{date}.csv"

---

### Requirement: RFI Volume Trend Chart

Users MUST be able to see RFI volume trends over time to identify patterns.

**Priority**: P2 (Medium)

#### Scenario: View RFI volume by month

**Given** the project started in January 2025
**And** RFIs were created:
  - Jan 2025: 5 RFIs
  - Feb 2025: 12 RFIs
  - Mar 2025: 18 RFIs
  - Apr 2025: 9 RFIs
**When** I view the RFI Analytics page
**Then** I see a line chart showing RFI volume by month
**And** the X-axis shows months (Jan, Feb, Mar, Apr)
**And** the Y-axis shows RFI count
**And** I can see the trend is increasing

---

### Requirement: Cost and Schedule Impact Tracking

Users MUST be able to track the estimated financial and schedule impact of RFIs.

**Priority**: P2 (Medium)

#### Scenario: View total cost impact

**Given** the project has 50 RFIs
**And** 20 have estimated cost_impact totaling $125,000
**And** 30 have no cost impact
**When** I view the RFI Analytics page
**Then** I see "Total Cost Impact: $125,000"
**And** I see a breakdown by discipline showing cost impact per category

#### Scenario: View total schedule impact

**Given** the project has 50 RFIs
**And** 15 have estimated schedule_impact totaling 45 days
**And** 35 have no schedule impact
**When** I view the RFI Analytics page
**Then** I see "Total Schedule Impact: 45 days"
**And** I see which RFIs contributed the most to delays

---

### Requirement: QuickBooks Export for Cost Tracking

Users MUST be able to export RFI cost data to QuickBooks format (CSV).

**Priority**: P2 (Medium)

#### Scenario: Export RFI cost data to QuickBooks CSV

**Given** I am viewing the RFI list
**And** 20 RFIs have cost_impact values
**When** I click "Export to QuickBooks"
**Then** a CSV file is generated with columns:
  - Date: RFI submitted_at
  - Description: RFI title
  - Amount: cost_impact
  - Account: "RFI Costs"
  - Memo: RFI number
**And** the CSV is formatted for QuickBooks import
**And** the download starts automatically

---

### Requirement: RFI Status Distribution Chart

Users MUST be able to see the current distribution of RFIs across statuses.

**Priority**: P2 (Medium)

#### Scenario: View RFI status pie chart

**Given** the project has 50 RFIs:
  - Draft: 5
  - Submitted: 10
  - Under Review: 8
  - Answered: 7
  - Closed: 18
  - Cancelled: 2
**When** I view the RFI Analytics page
**Then** I see a pie chart showing status distribution
**And** each slice is labeled with status name and count
**And** clicking a slice filters the RFI list to that status

---

### Requirement: Response Time Percentiles (p50, p90, p95)

Advanced users MUST be able to see statistical percentiles for response time analysis.

**Priority**: P2 (Medium)

#### Scenario: View response time percentiles

**Given** the project has 100 answered RFIs
**And** response times range from 0.5 days to 15 days
**When** I view the RFI Analytics page
**Then** I see response time percentiles:
  - p50 (median): 2.3 days
  - p90: 5.8 days
  - p95: 8.2 days
**And** I see a histogram showing response time distribution

---

## Test Coverage

### Unit Tests
- [x] SLA compliance calculation
- [x] Average response time by discipline
- [x] CSV export formatting
- [x] QuickBooks CSV format validation

### Integration Tests
- [x] Dashboard widget queries performance (<500ms)
- [x] Analytics queries with 10,000+ RFIs
- [x] Export CSV with special characters in titles

### E2E Tests
- [x] View dashboard → Click overdue RFIs → Send reminder
- [x] View analytics page → Filter by date range → Export CSV
- [x] View RFI volume chart → Trend is accurate

## Dependencies

- **rfi-lifecycle**: Core RFI data for analytics queries
- **rfi-assignments**: SLA and assignment data
- **Charting library**: Recharts or similar for visualizations
- **CSV export**: Papa Parse or native JS

## Acceptance Criteria

- [ ] Project dashboard shows RFI summary widget (total, open, overdue)
- [ ] SLA compliance report shows % on-time vs late
- [ ] Analytics page shows response time by discipline (bar chart)
- [ ] Overdue RFI dashboard lists all overdue RFIs with bulk reminder
- [ ] Export RFI log to CSV with all relevant columns
- [ ] Export cost data to QuickBooks-compatible CSV (P2)
- [ ] RFI volume trend chart shows monthly patterns (P2)
- [ ] Status distribution pie chart shows current breakdown (P2)
