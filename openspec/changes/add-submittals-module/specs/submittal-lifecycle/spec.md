# Capability: Submittal Lifecycle Management

**Capability ID**: `submittal-lifecycle`
**Status**: New
**Owner**: Backend Team

## Purpose

Enable construction teams to create, view, update, and manage the complete lifecycle of submittals (product data, shop drawings, samples) with proper status workflow, CSI spec section mapping, sequential numbering per spec section, and audit compliance.

## ADDED Requirements

### Requirement: Create Submittal with Auto-Generated Number by CSI Section

Users MUST be able to create a new submittal with an automatically assigned sequential number unique to the project and CSI spec section combination.

**Priority**: P0 (Critical)

#### Scenario: Subcontractor creates first submittal in spec section

**Given** I am authenticated as a subcontractor representative
**And** project "Sunset Tower" has no existing submittals for spec section "03 30 00"
**When** I create a submittal with:
  - Title: "Cast-in-Place Concrete Mix Design"
  - Spec section: "03 30 00"
  - Type: "product_data"
**Then** the submittal is created with number "03 30 00-001"
**And** the submittal status is set to "draft"
**And** the current_stage is set to "draft"
**And** I am set as the creator
**And** the version is set to "Rev 0"
**And** the version_number is set to 0

#### Scenario: Sequential numbering continues within same spec section

**Given** I am authenticated as a subcontractor
**And** project "Sunset Tower" has submittals "03 30 00-001" through "03 30 00-005"
**When** I create a new submittal with spec section "03 30 00"
**Then** the submittal is created with number "03 30 00-006"
**And** no numbering conflicts occur

#### Scenario: Different spec sections have independent numbering

**Given** project "Sunset Tower" has submittal "03 30 00-003" (concrete)
**When** I create a submittal with spec section "23 00 00" (HVAC)
**Then** the submittal is created with number "23 00 00-001"
**And** numbering starts fresh for the new spec section

#### Scenario: Soft-deleted submittals don't affect numbering

**Given** project "Sunset Tower" has submittals "03 30 00-001" (active) and "03 30 00-002" (soft-deleted)
**When** I create a new submittal for spec section "03 30 00"
**Then** the submittal is created with number "03 30 00-003"
**And** the soft-deleted number is not reused

---

### Requirement: View Submittal List with Filtering and Grouping

Users MUST be able to view a list of all submittals in a project with filtering by status, CSI section, review stage, and overdue status.

**Priority**: P0 (Critical)

#### Scenario: View all submittals in project grouped by CSI section

**Given** I am authenticated and have access to project "Sunset Tower"
**And** the project has 25 submittals across 5 different CSI sections
**When** I navigate to the submittal list page
**Then** I see all 25 submittals displayed
**And** each submittal shows: number, title, type, status, current stage, reviewer
**And** submittals are grouped by CSI spec section
**And** submittals are sorted by number within each section

#### Scenario: Filter submittals by status

**Given** I am viewing the submittal list
**And** there are 5 "gc_review", 3 "ae_review", 2 "approved", and 1 "revise_resubmit"
**When** I filter by status "gc_review"
**Then** I see only the 5 submittals with status "gc_review"
**And** the filter is reflected in the URL query params

#### Scenario: Filter submittals by CSI division

**Given** I am viewing the submittal list
**And** there are 10 submittals in Division 03 (Concrete)
**And** there are 8 submittals in Division 23 (HVAC)
**When** I filter by CSI Division "03"
**Then** I see only the 10 submittals with spec sections starting with "03"

#### Scenario: Filter submittals by current review stage

**Given** I am viewing the submittal list
**And** 5 submittals are in "gc_review" stage
**And** 7 submittals are in "ae_review" stage
**When** I filter by stage "ae_review"
**Then** I see only the 7 submittals currently at the A/E review stage

#### Scenario: Filter overdue submittals by procurement deadline

**Given** I am viewing the submittal list
**And** 3 submittals have procurement_deadline < TODAY
**And** 20 submittals are not overdue
**When** I filter by "Overdue"
**Then** I see only the 3 overdue submittals
**And** each has a red "Overdue" badge displayed

---

### Requirement: View Submittal Detail with Full Context

Users MUST be able to view complete submittal details including description, spec section, attachments, review history, version history, and lead time information.

**Priority**: P0 (Critical)

#### Scenario: View submittal detail page

**Given** I am authenticated and have access to submittal "03 30 00-001"
**When** I click on the submittal in the list
**Then** I am navigated to the submittal detail page
**And** I see the submittal number, title, and description
**And** I see metadata: type, spec section, version, status
**And** I see current stage and current reviewer (ball-in-court)
**And** I see all attachments for the current version
**And** I see lead time information: required on site date, procurement deadline
**And** I see a timeline of all review actions
**And** I see links to previous versions (if resubmittals exist)

#### Scenario: View submittal with overdue procurement deadline

**Given** I am viewing submittal "03 30 00-001"
**And** the procurement_deadline is 5 days ago
**And** the status is "ae_review" (not yet approved)
**When** I view the submittal detail
**Then** I see a prominent red alert "Procurement deadline passed 5 days ago"
**And** I see the original required on site date
**And** I see the calculated procurement deadline

---

### Requirement: Update Submittal in Draft Status

Users MUST be able to update submittal details while in draft status before submission.

**Priority**: P0 (Critical)

#### Scenario: Creator updates draft submittal

**Given** I created submittal "03 30 00-001"
**And** the submittal status is "draft"
**When** I update the title to "Revised Concrete Mix Design"
**And** I update the required_on_site date to "2025-03-15"
**And** I set lead_time_days to 45
**Then** the submittal is updated successfully
**And** the procurement_deadline is calculated as "2025-01-29"
**And** the updated_at timestamp is refreshed

#### Scenario: Cannot update submitted submittal without proper permissions

**Given** submittal "03 30 00-001" has status "gc_review"
**And** I am not the current reviewer
**When** I attempt to update the title
**Then** the update is rejected with "Cannot modify submittal under review"

---

### Requirement: Soft Delete Submittal

Users with admin privileges MUST be able to soft-delete submittals, preserving audit history.

**Priority**: P1 (Important)

#### Scenario: Admin soft-deletes submittal

**Given** I am authenticated as a project admin
**And** submittal "03 30 00-001" exists with status "draft"
**When** I delete the submittal
**Then** the submittal deleted_at timestamp is set
**And** the submittal no longer appears in the default submittal list
**And** the submittal number "03 30 00-001" is not reused for future submittals
**And** an audit log entry is created recording the deletion

#### Scenario: Non-admin cannot delete submittal

**Given** I am authenticated as a subcontractor (non-admin)
**And** submittal "03 30 00-001" exists
**When** I attempt to delete the submittal
**Then** the deletion is rejected with "Insufficient permissions"

---

### Requirement: Search Submittals by Keywords

Users MUST be able to search submittals by keywords in title, description, or spec section.

**Priority**: P1 (Important)

#### Scenario: Search submittals by title keyword

**Given** I am viewing the submittal list
**And** there is a submittal with title "Cast-in-Place Concrete Mix Design"
**When** I search for "concrete mix"
**Then** I see the matching submittal in the results
**And** the search term is highlighted in the title

#### Scenario: Search submittals by CSI spec section

**Given** I am viewing the submittal list
**And** there are 5 submittals with spec section starting with "03"
**When** I search for "03 30"
**Then** I see all 5 matching submittals
**And** results are grouped by spec section

---

### Requirement: View Submittal as External Reviewer

External reviewers (A/E firms, owner representatives) MUST be able to view submittals assigned to them without seeing unrelated project data.

**Priority**: P1 (Important)

#### Scenario: A/E reviewer sees only assigned submittals

**Given** I am authenticated as an A/E reviewer
**And** I have access to project "Sunset Tower" as external reviewer
**And** 3 submittals are currently assigned to me for review
**And** 20 other submittals exist in the project
**When** I navigate to the submittal list
**Then** I see only the 3 submittals assigned to me
**And** I can view full details and attachments for those submittals
**And** I can perform review actions on those submittals

---

### Requirement: Export Submittal Log for Closeout

Users MUST be able to export a complete submittal log in PDF or CSV format for project closeout documentation.

**Priority**: P2 (Nice to Have)

#### Scenario: Export submittal log as PDF

**Given** I am authenticated as a project manager
**And** project "Sunset Tower" has 50 submittals
**When** I click "Export Submittal Log" and select "PDF"
**Then** a PDF is generated containing:
  - Project name and information
  - All submittals grouped by CSI section
  - For each submittal: number, title, type, final status, approval date
**And** the PDF is downloaded to my device

#### Scenario: Export submittal log as CSV

**Given** I am authenticated as a project manager
**When** I export the submittal log as CSV
**Then** a CSV file is generated with columns:
  - Number, Title, Type, Spec Section, Status, Submitted Date, Approved Date, Version
**And** all submittals (including soft-deleted) are included
**And** the CSV can be imported into Excel or QuickBooks
