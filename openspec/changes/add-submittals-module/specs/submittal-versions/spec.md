# Capability: Submittal Version Tracking

**Capability ID**: `submittal-versions`
**Status**: New
**Owner**: Backend Team

## Purpose

Enable tracking of submittal revisions (resubmittals) with clear version history, allowing users to create new versions after revision requests, view all previous versions, and maintain audit trail of what changed between versions.

## ADDED Requirements

### Requirement: Create Resubmittal After Revision Request

Users MUST be able to create a new version (resubmittal) of a submittal after receiving a revision request, incrementing the version number and restarting the review workflow.

**Priority**: P0 (Critical)

#### Scenario: Creator creates first resubmittal (Rev A) after revision request

**Given** submittal "03 30 00-001" (Rev 0) has status "revise_resubmit"
**And** I am the original creator
**When** I click "Create Resubmittal"
**And** I add notes "Added 28-day concrete strength test results per GC comments"
**And** I upload revised product data PDF
**And** I submit the resubmittal
**Then** a new submittal record is created with:
  - Same number: "03 30 00-001"
  - Version: "Rev A"
  - Version number: 1
  - Parent submittal ID: original submittal ID
  - Status: "draft"
  - Current stage: "draft"
**And** the new attachments are linked to version 1
**And** the original Rev 0 remains accessible for reference
**And** I can now submit Rev A for review

#### Scenario: Create second resubmittal (Rev B) after another revision

**Given** submittal "03 30 00-001" (Rev A) has status "revise_resubmit"
**And** I am the creator
**When** I create a resubmittal with notes "Corrected rebar detail per A/E comments"
**Then** a new submittal is created with:
  - Version: "Rev B"
  - Version number: 2
  - Parent submittal ID: Rev A's ID
**And** the version chain is: Rev 0 → Rev A → Rev B

#### Scenario: Resubmittal inherits metadata from parent

**Given** I am creating a resubmittal for "03 30 00-001" (Rev 0)
**When** the resubmittal is created
**Then** it inherits from the parent:
  - Project ID
  - Title
  - Spec section
  - Submittal type
  - Required on site date
  - Lead time days
**And** I can modify these fields before submitting
**And** the parent's review history is NOT copied (stays with parent)

---

### Requirement: View Version History

Users MUST be able to view complete version history for a submittal, showing all revisions, why they were created, and their final status.

**Priority**: P0 (Critical)

#### Scenario: View version history on submittal detail page

**Given** submittal "03 30 00-001" has three versions:
  - Rev 0 (status: revise_resubmit)
  - Rev A (status: revise_resubmit)
  - Rev B (status: approved)
**When** I view the detail page for any version
**Then** I see a "Version History" section showing:
  - Rev 0: Submitted 2025-01-10, Revision requested by GC on 2025-01-12
  - Rev A: Submitted 2025-01-15, Revision requested by A/E on 2025-01-17
  - Rev B: Submitted 2025-01-20, Approved by A/E on 2025-01-22 ← Current version
**And** I can click on any version to view its full details
**And** the current version is clearly marked

#### Scenario: Version history shows what changed in each resubmittal

**Given** I am viewing submittal "03 30 00-001" version history
**When** I view Rev A in the history
**Then** I see the creator's notes: "Added 28-day concrete strength test results per GC comments"
**And** I see which files were added/removed compared to Rev 0
**And** I see the review decision that triggered the resubmittal

---

### Requirement: Link Between Parent and Child Versions

The system MUST maintain clear parent-child relationships between versions for audit trail and navigation.

**Priority**: P0 (Critical)

#### Scenario: Navigate from parent to child versions

**Given** I am viewing Rev 0 of submittal "03 30 00-001"
**And** Rev A and Rev B exist as resubmittals
**When** I view the submittal detail page
**Then** I see a notice "This version has been superseded by Rev B"
**And** I see a link "View current version (Rev B)"
**And** I can click to navigate to the latest approved version

#### Scenario: Navigate from child to parent version

**Given** I am viewing Rev B of submittal "03 30 00-001"
**And** Rev 0 and Rev A are parent versions
**When** I click "View Previous Versions"
**Then** I see links to:
  - Rev A (previous version)
  - Rev 0 (original version)
**And** I can navigate to any parent to see what changed over time

---

### Requirement: Version-Specific Attachments

Each version MUST have its own set of attachments, clearly separated from other versions.

**Priority**: P0 (Critical)

#### Scenario: Attachments are version-specific

**Given** Rev 0 has attachments:
  - "concrete-mix-design-v1.pdf"
  - "test-results-preliminary.pdf"
**And** Rev A has attachments:
  - "concrete-mix-design-v2.pdf"
  - "test-results-28day.pdf"
**When** I view Rev 0
**Then** I see only Rev 0's attachments
**And** I cannot see Rev A's attachments
**When** I view Rev A
**Then** I see only Rev A's attachments
**And** the old Rev 0 attachments are not shown

#### Scenario: Compare attachments between versions

**Given** Rev 0 and Rev A exist
**When** I view version history
**Then** I see a comparison showing:
  - Rev 0: 2 attachments (concrete-mix-design-v1.pdf, test-results-preliminary.pdf)
  - Rev A: 2 attachments (concrete-mix-design-v2.pdf, test-results-28day.pdf)
**And** I can see which files were replaced or added

---

### Requirement: Review History is Version-Specific

Each version MUST have its own review history, not shared with parent or child versions.

**Priority**: P0 (Critical)

#### Scenario: View review history for specific version

**Given** Rev 0 was reviewed by GC (revision requested)
**And** Rev A was reviewed by GC (forwarded to A/E) and A/E (approved)
**When** I view Rev 0
**Then** I see only Rev 0's review history:
  - GC Review (John Smith): Revise and resubmit
**When** I view Rev A
**Then** I see only Rev A's review history:
  - GC Review (John Smith): Forwarded to A/E
  - A/E Review (Sarah Johnson): Approved

---

### Requirement: Prevent Resubmittal Creation Without Revision Request

Users MUST NOT be able to create resubmittals unless the current version has status "revise_resubmit".

**Priority**: P1 (Important)

#### Scenario: Cannot create resubmittal for approved submittal

**Given** submittal "03 30 00-001" has status "approved"
**When** I attempt to create a resubmittal
**Then** the action is blocked with error "Cannot create resubmittal. Submittal is already approved."
**And** no new version is created

#### Scenario: Cannot create resubmittal while under review

**Given** submittal "03 30 00-001" has status "gc_review"
**And** review is pending
**When** I attempt to create a resubmittal
**Then** the action is blocked with error "Cannot create resubmittal. Submittal is under review."

#### Scenario: Can create resubmittal after rejection

**Given** submittal "03 30 00-001" has status "rejected"
**When** I click "Create Resubmittal"
**Then** the resubmittal creation form opens
**And** I can create a new version to address rejection reasons

---

### Requirement: Version Numbering Increments Correctly

Version numbering MUST follow construction standards: Rev 0, Rev A, Rev B, ..., Rev Z.

**Priority**: P1 (Important)

#### Scenario: Version numbers increment alphabetically

**Given** submittal "03 30 00-001" has versions:
  - Rev 0 (version_number: 0)
  - Rev A (version_number: 1)
  - Rev B (version_number: 2)
**When** I create another resubmittal
**Then** the new version is "Rev C" with version_number: 3

#### Scenario: Version 0 is always initial submission

**Given** I create a new submittal
**When** the submittal is created
**Then** the version is "Rev 0"
**And** the version_number is 0
**And** this is the initial submission before any resubmittals

---

### Requirement: Only Latest Version Can Be Resubmitted

Users MUST only be able to create resubmittals from the latest version, not from old revisions.

**Priority**: P2 (Nice to Have)

#### Scenario: Cannot create resubmittal from old version

**Given** submittal "03 30 00-001" has versions:
  - Rev 0 (status: revise_resubmit)
  - Rev A (status: gc_review) ← Latest version
**When** I view Rev 0 and click "Create Resubmittal"
**Then** I see a warning "This is not the latest version. Please create resubmittal from Rev A."
**And** the resubmittal creation is blocked

---

### Requirement: Track Resubmittal Reasons

Users MUST document why a resubmittal was created (what changed) for audit trail.

**Priority**: P1 (Important)

#### Scenario: Resubmittal requires change notes

**Given** submittal "03 30 00-001" has status "revise_resubmit"
**When** I create a resubmittal
**And** I leave the "What changed" notes field empty
**And** I attempt to submit
**Then** the submission is blocked with error "Please describe what changed in this revision"

#### Scenario: Change notes are visible in version history

**Given** Rev A was created with notes "Added 28-day test results"
**When** I view the version history
**Then** I see Rev A's notes clearly displayed
**And** reviewers can see what changed before reviewing

---

### Requirement: Export Version History for Audit

Users MUST be able to export complete version history including all revisions, reviews, and decisions for project closeout and audit compliance.

**Priority**: P2 (Nice to Have)

#### Scenario: Export version history as PDF

**Given** submittal "03 30 00-001" has 3 versions with multiple reviews
**When** I click "Export Version History" and select PDF
**Then** a PDF is generated containing:
  - Submittal number, title, spec section
  - All versions with submission dates
  - All review decisions for each version
  - All attachments for each version
  - Final approval status and date
**And** the PDF is suitable for project closeout documentation
