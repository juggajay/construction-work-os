# Capability: Submittal Analytics and Lead Time Tracking

**Capability ID**: `submittal-analytics`
**Status**: New
**Owner**: Backend Team

## Purpose

Enable tracking of submittal procurement lead times, approval cycle times, and overdue alerts to help teams identify bottlenecks and ensure materials arrive on schedule.

## ADDED Requirements

### Requirement: Calculate Procurement Deadline Based on Lead Time

The system MUST automatically calculate procurement deadlines based on required on-site date and lead time days.

**Priority**: P0 (Critical)

#### Scenario: Calculate procurement deadline on submittal creation

**Given** I am creating submittal "03 30 00-001"
**When** I set "Required on Site" to 2025-03-15
**And** I set "Lead Time" to 45 days
**And** I save the submittal
**Then** the system calculates procurement_deadline as 2025-01-29
  (2025-03-15 minus 45 days)
**And** the procurement deadline is displayed on the submittal
**And** I see "Material must be ordered by January 29, 2025"

#### Scenario: Update procurement deadline when dates change

**Given** submittal "03 30 00-001" has:
  - Required on site: 2025-03-15
  - Lead time: 45 days
  - Procurement deadline: 2025-01-29 (calculated)
**When** I update "Required on Site" to 2025-04-01
**And** I save the submittal
**Then** the procurement deadline recalculates to 2025-02-15
  (2025-04-01 minus 45 days)

---

### Requirement: Display Overdue Procurement Warnings

The system MUST display prominent warnings when procurement deadlines are approaching or have passed.

**Priority**: P0 (Critical)

#### Scenario: Show yellow warning when deadline approaching

**Given** submittal "03 30 00-001" has:
  - Procurement deadline: 14 days from today
  - Status: "ae_review" (not yet approved)
**When** I view the submittal list or detail page
**Then** I see a yellow warning badge "Deadline in 14 days"
**And** the submittal is highlighted in the list

#### Scenario: Show red alert when deadline passed

**Given** submittal "03 30 00-001" has:
  - Procurement deadline: 5 days ago
  - Status: "gc_review" (not yet approved)
**When** I view the submittal
**Then** I see a red alert banner "Procurement deadline passed 5 days ago"
**And** I see a warning "Material may not arrive on time for required date"
**And** the submittal appears in "Overdue" filter

#### Scenario: No warning after submittal approved

**Given** submittal "03 30 00-001" has:
  - Procurement deadline: yesterday
  - Status: "approved"
**When** I view the submittal
**Then** I do NOT see an overdue warning
**And** the submittal is marked "Approved on time"

---

### Requirement: Track Approval Cycle Time

The system MUST track the time from submission to final approval for each submittal.

**Priority**: P1 (Important)

#### Scenario: Calculate cycle time for approved submittal

**Given** submittal "03 30 00-001" was:
  - Submitted: 2025-01-10 10:00 AM
  - Approved: 2025-01-17 2:00 PM
**When** I view the submittal analytics
**Then** I see "Approval cycle time: 7 days, 4 hours"
**And** this is stored for reporting purposes

#### Scenario: Cycle time includes resubmittals

**Given** submittal "03 30 00-001":
  - Rev 0: Submitted 2025-01-10, Revision requested 2025-01-12 (2 days)
  - Rev A: Submitted 2025-01-15, Approved 2025-01-20 (5 days)
**When** I view the full submittal cycle
**Then** I see "Total cycle time: 10 days (including 1 resubmittal)"
**And** I see breakdown:
  - Rev 0: 2 days
  - Rev A: 5 days
  - Gap between versions: 3 days

---

### Requirement: View Pending Submittals by Review Stage

Users MUST be able to see how many submittals are pending at each review stage.

**Priority**: P0 (Critical)

#### Scenario: View submittal pipeline dashboard

**Given** project "Sunset Tower" has 50 submittals:
  - 10 in draft
  - 8 in GC review
  - 5 in A/E review
  - 2 in owner review
  - 20 approved
  - 3 awaiting resubmittal
  - 2 rejected
**When** I navigate to the submittals pipeline dashboard
**Then** I see a visual pipeline showing:
  - Draft: 10
  - GC Review: 8 (with average time: 3 days)
  - A/E Review: 5 (with average time: 5 days)
  - Owner Review: 2 (with average time: 2 days)
  - Approved: 20
  - Needs Revision: 3
  - Rejected: 2
**And** I can click on each stage to see the list of submittals

#### Scenario: Identify bottleneck in review process

**Given** the submittal pipeline shows:
  - GC Review: 8 submittals, average 2 days
  - A/E Review: 15 submittals, average 12 days ← Bottleneck
  - Owner Review: 1 submittal, average 1 day
**When** I view the analytics
**Then** A/E Review stage is highlighted as a bottleneck
**And** I see "15 submittals pending A/E review (avg 12 days)"
**And** I can identify which submittals are oldest in that stage

---

### Requirement: View My Pending Reviews with Days Pending

Reviewers MUST see a list of submittals assigned to them with days pending.

**Priority**: P0 (Critical)

#### Scenario: Reviewer dashboard shows pending submittals

**Given** I am authenticated as a GC reviewer
**And** 6 submittals are assigned to me:
  - "03 30 00-001": assigned 2 days ago
  - "03 30 00-002": assigned 5 days ago
  - "23 00 00-001": assigned 8 days ago (overdue)
  - "03 30 00-003": assigned 1 day ago
  - "03 30 00-004": assigned 10 days ago (overdue)
  - "23 00 00-002": assigned 3 days ago
**When** I navigate to "My Reviews" dashboard
**Then** I see all 6 submittals sorted by days pending (oldest first)
**And** overdue items (>7 days) are highlighted in red
**And** I see a summary "6 pending reviews (2 overdue)"
**And** I can click "Review" to take action on each

---

### Requirement: Send Email Reminders for Overdue Reviews

The system MUST send automated email reminders when submittals are pending review for too long.

**Priority**: P1 (Important)

#### Scenario: Send reminder after 7 days pending

**Given** submittal "03 30 00-001" has been in "gc_review" for 7 days
**And** no review action has been taken
**When** the daily reminder job runs
**Then** an email is sent to the current reviewer with:
  - Subject: "Reminder: Submittal 03 30 00-001 pending review for 7 days"
  - Submittal details: title, spec section, submitter
  - Days pending: 7
  - Procurement deadline warning (if applicable)
  - Link to review the submittal
**And** a copy is sent to the project manager

---

### Requirement: View Average Approval Times by CSI Division

Users MUST be able to see average approval cycle times grouped by CSI division to identify patterns.

**Priority**: P2 (Nice to Have)

#### Scenario: View approval times by CSI division

**Given** project "Sunset Tower" has approved submittals:
  - Division 03 (Concrete): 10 submittals, avg 5 days
  - Division 23 (HVAC): 8 submittals, avg 12 days
  - Division 26 (Electrical): 5 submittals, avg 8 days
**When** I view the analytics dashboard
**Then** I see a chart showing average approval times by division:
  - Division 03: 5 days
  - Division 23: 12 days ← Slowest
  - Division 26: 8 days
**And** I can drill down to see individual submittals in each division

---

### Requirement: Export Submittal Analytics Report

Users MUST be able to export submittal analytics as PDF or CSV for project meetings and reporting.

**Priority**: P2 (Nice to Have)

#### Scenario: Export analytics report as PDF

**Given** I am viewing submittal analytics for project "Sunset Tower"
**When** I click "Export Report" and select "PDF"
**Then** a PDF is generated containing:
  - Project summary: total submittals, approved count, pending count
  - Approval cycle times: average, by division
  - Pipeline status: count at each review stage
  - Overdue submittals: list with days overdue
  - Resubmittal rate: percentage requiring revision
  - Charts and visualizations
**And** the PDF downloads to my device

---

### Requirement: Track Resubmittal Rate as Quality Metric

The system MUST calculate and display resubmittal rate to measure quality of initial submissions.

**Priority**: P2 (Nice to Have)

#### Scenario: Calculate resubmittal rate for project

**Given** project "Sunset Tower" has:
  - 50 total submittals
  - 15 required resubmittals (Rev A or higher)
  - 35 approved on first submission (Rev 0 only)
**When** I view the quality metrics dashboard
**Then** I see "Resubmittal rate: 30% (15 of 50)"
**And** I see a comparison to project target (e.g., "Target: <20%")
**And** I can see which subcontractors have highest resubmittal rates

#### Scenario: Resubmittal rate by CSI division

**Given** project has submittals across multiple divisions
**When** I view resubmittal rate by division
**Then** I see:
  - Division 03: 10% resubmittal rate (1 of 10)
  - Division 23: 50% resubmittal rate (4 of 8) ← Needs attention
  - Division 26: 20% resubmittal rate (1 of 5)
**And** I can identify which divisions need more attention to quality

---

### Requirement: Monitor Lead Time Compliance

The system MUST track whether materials ordered after approval will arrive on time based on lead times.

**Priority**: P2 (Nice to Have)

#### Scenario: Green status for on-time approval

**Given** submittal "03 30 00-001" has:
  - Required on site: 2025-03-15
  - Lead time: 45 days
  - Procurement deadline: 2025-01-29
  - Approved: 2025-01-25 (4 days before deadline)
**When** I view the submittal
**Then** I see a green checkmark "Approved with 4 days to spare"
**And** I see "Material should arrive on time"

#### Scenario: Red status for late approval

**Given** submittal "03 30 00-001" has:
  - Required on site: 2025-03-15
  - Lead time: 45 days
  - Procurement deadline: 2025-01-29
  - Approved: 2025-02-05 (7 days late)
**When** I view the submittal
**Then** I see a red warning "Approved 7 days after procurement deadline"
**And** I see calculated "Material may arrive 7 days late"
**And** I can flag this as a potential project delay risk

---

### Requirement: Alert Project Manager for Critical Overdue Submittals

The system MUST send high-priority alerts to project managers when critical-path submittals are overdue.

**Priority**: P1 (Important)

#### Scenario: Alert PM when critical submittal overdue

**Given** submittal "03 30 00-001" is marked as "Critical Path"
**And** the procurement deadline passed 3 days ago
**And** the status is still "ae_review"
**When** the daily alert job runs
**Then** an urgent email is sent to the project manager with:
  - Subject: "URGENT: Critical submittal 03 30 00-001 overdue by 3 days"
  - Impact: "May delay concrete pour scheduled for March 15"
  - Current stage: A/E Review
  - Assigned reviewer: Sarah Johnson
  - Action needed: "Escalate with A/E firm"
**And** the project manager receives an in-app notification

---

### Requirement: Compare Project Performance to Benchmarks

Users MUST be able to compare their project's submittal metrics to historical benchmarks or similar projects.

**Priority**: P3 (Future)

#### Scenario: Compare to company benchmark

**Given** my company has completed 10 similar projects
**And** the average approval cycle time across those projects is 8 days
**And** the current project "Sunset Tower" has average cycle time of 12 days
**When** I view the benchmarking report
**Then** I see "Your project: 12 days vs Company average: 8 days"
**And** I see suggestions to improve: "Consider earlier A/E engagement"
