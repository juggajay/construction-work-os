# Capability: RFI Attachments & Document References

**Capability ID**: `rfi-attachments`
**Status**: New
**Owner**: Backend Team

## Purpose

Enable users to attach files, photos, and drawing references to RFIs for visual context and documentation.

## ADDED Requirements

### Requirement: Upload File Attachments to RFI

Users MUST be able to upload files (PDFs, photos, documents) to an RFI.

**Priority**: P0 (Critical)

#### Scenario: Upload single file to RFI

**Given** I am creating or viewing RFI "RFI-001"
**And** I have access to edit the RFI
**When** I upload a file "foundation-detail.pdf" (2.5 MB)
**Then** the file is uploaded to Supabase Storage at `/rfis/{project_id}/{rfi_id}/foundation-detail.pdf`
**And** an attachment record is created in `rfi_attachments`
**And** the attachment appears in the RFI detail view
**And** I can download the file via a signed URL

#### Scenario: Upload multiple files to RFI

**Given** I am creating RFI "RFI-001"
**When** I upload 3 files: "photo1.jpg" (8 MB), "photo2.jpg" (6 MB), "spec-sheet.pdf" (1 MB)
**Then** all 3 files are uploaded successfully
**And** 3 attachment records are created
**And** all 3 files appear in the RFI attachments list

#### Scenario: Auto-compress large photos

**Given** I am uploading "site-photo.jpg" (12 MB, 4032x3024 px)
**When** the upload starts
**Then** the image is compressed client-side to <500 KB
**And** the resolution is reduced to 1920x1440 px (maintains aspect ratio)
**And** the compressed file is uploaded to Storage
**And** the original file size is stored in attachment metadata

---

### Requirement: Enforce File Size and Type Limits

The system MUST enforce file upload limits to prevent storage abuse.

**Priority**: P0 (Critical)

#### Scenario: Reject file exceeding size limit

**Given** I am uploading a file to RFI "RFI-001"
**And** the file "large-video.mp4" is 50 MB
**When** the upload is attempted
**Then** I receive an error "File exceeds 10 MB limit. Please compress or split the file."
**And** the file is not uploaded
**And** no attachment record is created

#### Scenario: Reject unsupported file type

**Given** I am uploading a file to RFI "RFI-001"
**And** the file "malware.exe" has type "application/x-msdownload"
**When** the upload is attempted
**Then** I receive an error "File type not supported. Allowed types: PDF, JPG, PNG, DOCX, XLSX"
**And** the file is not uploaded

#### Scenario: Accept supported file types

**Given** I am uploading files to RFI "RFI-001"
**When** I upload files of types: PDF, JPG, PNG, DOCX, XLSX
**Then** all files are uploaded successfully
**And** MIME types are validated on the server

---

### Requirement: Link RFI to Drawing Sheets

Users MUST be able to reference specific drawing sheets related to an RFI.

**Priority**: P1 (High)

#### Scenario: Add drawing sheet references to RFI

**Given** I am creating RFI "RFI-001"
**And** the project has drawings with sheets: A-101, A-102, S-201
**When** I add drawing references "A-101, S-201"
**Then** the RFI drawing_reference field is set to "A-101, S-201"
**And** the detail view shows clickable sheet number badges
**And** clicking a sheet badge navigates to the drawing viewer (if implemented)

#### Scenario: Multiple RFIs can reference same sheet

**Given** RFI "RFI-001" references sheet "A-101"
**And** RFI "RFI-002" also references sheet "A-101"
**When** I view the drawing sheet "A-101" (future feature)
**Then** I see both RFIs listed as related to this sheet

---

### Requirement: Link RFI to Spec Sections

Users MUST be able to tag RFIs with CSI MasterFormat spec sections.

**Priority**: P1 (High)

#### Scenario: Add spec section to RFI

**Given** I am creating RFI "RFI-001"
**And** the RFI is about concrete placement
**When** I set spec_section to "03 30 00 - Cast-in-Place Concrete"
**Then** the spec_section field is stored
**And** the RFI detail view shows the spec section badge
**And** the RFI is searchable by spec section

#### Scenario: Auto-suggest spec sections

**Given** I am creating RFI "RFI-001"
**And** I type "concrete" in the spec section field
**When** the autocomplete triggers
**Then** I see suggestions:
  - "03 10 00 - Concrete Forming"
  - "03 20 00 - Concrete Reinforcing"
  - "03 30 00 - Cast-in-Place Concrete"
**And** I can select one from the list

---

### Requirement: Delete Attachment from RFI

Users MUST be able to remove attachments from an RFI they created.

**Priority**: P1 (High)

#### Scenario: Creator deletes attachment from draft RFI

**Given** I am the creator of RFI "RFI-001"
**And** the RFI status is "draft"
**And** the RFI has 3 attachments
**When** I delete attachment "photo1.jpg"
**Then** the attachment record is deleted from the database
**And** the file is deleted from Supabase Storage
**And** the attachment no longer appears in the RFI detail view

#### Scenario: Cannot delete attachment from submitted RFI

**Given** RFI "RFI-001" has status "submitted"
**And** the RFI has 2 attachments
**When** I attempt to delete an attachment
**Then** I receive an error "Cannot delete attachments after RFI submission"
**And** the attachment remains

---

### Requirement: Download Attachment with Signed URL

Users MUST be able to securely download RFI attachments.

**Priority**: P0 (Critical)

#### Scenario: Download attachment via signed URL

**Given** I have access to RFI "RFI-001"
**And** the RFI has an attachment "foundation-detail.pdf"
**When** I click the "Download" button
**Then** a signed URL is generated with 1-hour expiration
**And** the file download starts
**And** the filename is preserved: "foundation-detail.pdf"

#### Scenario: Signed URL expires after timeout

**Given** I generated a signed URL for "foundation-detail.pdf"
**And** 61 minutes have passed
**When** I attempt to use the signed URL
**Then** I receive a 403 Forbidden error
**And** I must regenerate the download link

---

### Requirement: Inline Image Preview

Users MUST be able to see inline previews of image attachments (JPG, PNG) in the RFI detail view.

**Priority**: P2 (Medium)

#### Scenario: Inline preview for image attachments

**Given** RFI "RFI-001" has attachments: "site-photo.jpg", "spec-sheet.pdf"
**When** I view the RFI detail page
**Then** "site-photo.jpg" displays as an inline thumbnail (200x200 px)
**And** clicking the thumbnail opens a full-size lightbox viewer
**And** "spec-sheet.pdf" shows a file icon (no inline preview)

---

### Requirement: Track Attachment Metadata

The system MUST store metadata for each attachment for audit and analytics.

**Priority**: P1 (High)

#### Scenario: Store attachment metadata on upload

**Given** I upload "site-photo.jpg" to RFI "RFI-001"
**When** the upload completes
**Then** the attachment record stores:
  - file_path: "/rfis/{project_id}/{rfi_id}/site-photo.jpg"
  - file_name: "site-photo.jpg"
  - file_size: 487234 (bytes)
  - file_type: "image/jpeg"
  - uploaded_by: {my user ID}
  - created_at: {current timestamp}

#### Scenario: View attachment history

**Given** RFI "RFI-001" has 5 attachments
**And** 2 were deleted (in draft)
**When** I view the audit log
**Then** I see upload events for all 7 attachments
**And** I see deletion events for the 2 removed attachments

---

### Requirement: Attach Files to RFI Responses

Users MUST be able to attach files to individual responses within an RFI thread.

**Priority**: P1 (High)

#### Scenario: Attach file to response

**Given** I am responding to RFI "RFI-001"
**And** I want to include a supporting document
**When** I write a response and attach "clarification-diagram.pdf"
**Then** the response is created with the text content
**And** the attachment is linked to the response (not the RFI root)
**And** the attachment appears below the response in the thread

---

### Requirement: Bulk Download All RFI Attachments

Users MUST be able to download all RFI attachments as a ZIP archive.

**Priority**: P2 (Medium)

#### Scenario: Download all attachments as ZIP

**Given** RFI "RFI-001" has 8 attachments totaling 12 MB
**When** I click "Download All Attachments"
**Then** a ZIP file is generated server-side
**And** the ZIP is named "RFI-001-attachments.zip"
**And** the ZIP contains all 8 files with original filenames
**And** the download starts automatically

---

## Test Coverage

### Unit Tests
- [x] File size validation (reject >10 MB)
- [x] MIME type validation (whitelist)
- [x] Signed URL generation with expiration
- [x] Image compression logic

### Integration Tests
- [x] Upload file to Supabase Storage
- [x] Delete file from Storage
- [x] RLS policies: users can only access attachments for RFIs they can view
- [x] Attachment metadata stored correctly

### E2E Tests
- [x] Upload file → View in RFI detail → Download
- [x] Upload large photo → Auto-compressed
- [x] Delete attachment from draft RFI
- [x] Attach file to response

## Dependencies

- **Supabase Storage**: For file storage and signed URLs
- **rfi-lifecycle**: Core RFI data model
- **Client-side image compression**: Browser-native or library (e.g., browser-image-compression)

## Acceptance Criteria

- [ ] User can upload files (PDF, JPG, PNG, DOCX, XLSX) to RFIs
- [ ] Files are limited to 10 MB, with auto-compression for large photos
- [ ] Attachments are stored in Supabase Storage with RLS protection
- [ ] User can download attachments via signed URLs
- [ ] User can reference drawing sheets and spec sections
- [ ] Image attachments show inline thumbnails
- [ ] Attachments can be added to individual responses
- [ ] Bulk download all RFI attachments as ZIP (P2)
