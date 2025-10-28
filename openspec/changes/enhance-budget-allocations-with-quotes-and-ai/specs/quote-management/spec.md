# Spec: Quote Management

## Status
**PROPOSED**

## Overview
Capability to upload, view, and manage job quote documents associated with budget allocations. Each budget category (labor, materials, equipment, other) can have multiple attached quotes for reference and transparency.

## ADDED Requirements

### Requirement 1: Quote Upload
Project managers and supervisors can upload quote documents (PDF, images) to any budget category.

#### Scenario: Upload PDF quote to materials budget
**Given** user is a project manager on Project A
**And** Project A has a materials budget of $50,000
**When** user clicks "Attach Quote" on materials budget
**And** uploads "Acme_Electrical_Quote_2025-01-15.pdf" (5.2MB)
**Then** file uploads to `project-quotes/{projectId}/{quoteId}/` path
**And** creates record in `project_quotes` table
**And** displays "Quote uploaded" success message
**And** shows quote badge "1 quote attached" on materials budget card

#### Scenario: Reject oversized file
**Given** user attempts to upload quote file
**When** file size exceeds 25MB
**Then** upload is rejected with error "File size exceeds 25MB limit"
**And** no database record created
**And** no storage upload occurs

#### Scenario: Reject invalid file type
**Given** user attempts to upload quote file
**When** file type is `.docx` (not PDF/image)
**Then** upload is rejected with error "Invalid file type. Please upload PDF, JPEG, PNG, or HEIC"
**And** no database record created

### Requirement 2: Quote Metadata Extraction
System extracts basic metadata from uploaded quotes (vendor, date, total amount).

#### Scenario: Extract metadata from structured PDF
**Given** quote PDF contains text "Vendor: Acme Corp", "Date: 01/15/2025", "Total: $47,850.00"
**When** quote is uploaded
**Then** `project_quotes` record created with:
  - `vendor_name`: "Acme Corp"
  - `quote_date`: "2025-01-15"
  - `total_amount`: 47850.00

#### Scenario: Partial metadata extraction
**Given** quote PDF missing vendor name
**When** quote is uploaded
**Then** `project_quotes` record created with:
  - `vendor_name`: NULL
  - Other fields extracted normally
**And** user can manually edit vendor name later

### Requirement 3: Quote Viewing
Team members can view uploaded quote documents inline or download originals.

#### Scenario: View PDF quote inline
**Given** materials budget has attached quote "Acme_Electrical_Quote.pdf"
**When** user clicks "View Quote" link
**Then** opens PDF viewer dialog
**And** displays PDF with page navigation
**And** shows download button for original file

#### Scenario: Download original quote file
**Given** quote PDF is displayed in viewer
**When** user clicks "Download" button
**Then** downloads original file with preserved filename "Acme_Electrical_Quote_2025-01-15.pdf"

### Requirement 4: Multiple Quotes Per Category
Budget categories can have multiple quotes attached for comparison or phased work.

#### Scenario: Attach second quote to same category
**Given** materials budget already has 1 quote attached
**When** user uploads second quote "Jones_Supply_Quote.pdf"
**Then** both quotes stored independently
**And** quote badge shows "2 quotes attached"
**And** both quotes accessible from materials budget section

### Requirement 5: Quote Deletion
Managers can delete quotes that are no longer relevant.

#### Scenario: Delete quote (soft delete)
**Given** user is a project manager
**And** materials budget has quote "Old_Quote.pdf"
**When** user clicks delete on quote
**And** confirms deletion
**Then** `project_quotes.deleted_at` set to current timestamp
**And** quote no longer appears in UI
**And** file remains in storage (soft delete for audit)

#### Scenario: Non-managers cannot delete quotes
**Given** user role is "supervisor" (not manager)
**When** user attempts to delete quote
**Then** delete button is not visible/disabled
**And** API returns 403 Forbidden if attempted directly

### Requirement 6: Quote-Budget Validation
System validates that quote amounts align with budget allocations.

#### Scenario: Warning when quote exceeds budget allocation
**Given** materials budget allocated amount is $50,000
**And** uploaded quote total is $65,000
**When** quote metadata extracted
**Then** displays warning "Quote total ($65,000) exceeds allocated budget ($50,000)"
**And** suggests "Consider adjusting budget allocation or negotiating quote"

#### Scenario: No warning when quote within budget
**Given** materials budget allocated amount is $50,000
**And** uploaded quote total is $45,000
**When** quote metadata extracted
**Then** no warning displayed
**And** shows "Within budget" indicator

---

## Storage Structure

```
project-quotes/
  {project_id}/
    {quote_id}/
      {original_filename}
```

## Database Schema

```sql
CREATE TABLE project_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  budget_category project_budget_category NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  vendor_name TEXT,
  quote_number TEXT,
  quote_date DATE,
  total_amount DECIMAL(15, 2),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

## RLS Policies

- **SELECT**: Users can view quotes from projects they have access to
- **INSERT**: Managers/supervisors can upload quotes to their projects
- **UPDATE**: Managers/supervisors can edit quote metadata
- **DELETE**: Managers only can soft-delete quotes

---

**Spec Version**: 1.0
**Last Updated**: 2025-01-28
