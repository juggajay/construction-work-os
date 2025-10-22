# Capability: Submittal Attachment Management

**Capability ID**: `submittal-attachments`
**Status**: New
**Owner**: Backend Team

## Purpose

Enable users to upload, view, download, and manage file attachments for submittals, supporting product data PDFs, shop drawings, sample photos, and specification documents with proper file size limits, type validation, and version-specific organization.

## ADDED Requirements

### Requirement: Upload Attachments to Draft Submittal

Users MUST be able to upload multiple files to a draft submittal before submission for review.

**Priority**: P0 (Critical)

#### Scenario: Upload product data PDF to submittal

**Given** I am creating submittal "03 30 00-001" with status "draft"
**When** I click "Add Attachment"
**And** I select file "concrete-mix-design.pdf" (5MB)
**And** I select attachment type "Product Data"
**And** I upload the file
**Then** the file is uploaded to Supabase Storage at path:
  `/submittals/{project_id}/{submittal_id}/rev-0/concrete-mix-design.pdf`
**And** an attachment record is created with:
  - submittal_id
  - version_number: 0
  - file_path
  - file_name: "concrete-mix-design.pdf"
  - file_size: 5242880 bytes
  - file_type: "application/pdf"
  - attachment_type: "product_data"
**And** I see the attachment listed on the submittal form
**And** I receive confirmation "File uploaded successfully"

#### Scenario: Upload multiple attachments at once

**Given** I am editing submittal "03 30 00-001"
**When** I select 3 files:
  - "product-data.pdf" (3MB)
  - "shop-drawing-1.pdf" (12MB)
  - "shop-drawing-2.pdf" (8MB)
**And** I upload all files
**Then** all 3 files are uploaded successfully
**And** I see a progress bar showing "Uploading 1 of 3", "2 of 3", "3 of 3"
**And** all 3 attachments appear in the attachment list

#### Scenario: Upload fails for oversized file

**Given** I am uploading an attachment
**When** I select file "large-shop-drawing.pdf" (75MB)
**And** I attempt to upload
**Then** the upload is blocked with error "File size exceeds 50MB limit. Please compress or split the file."
**And** no attachment record is created

---

### Requirement: Validate File Types

The system MUST validate uploaded files and only accept supported file types for construction submittals.

**Priority**: P0 (Critical)

#### Scenario: Upload supported file types

**Given** I am adding attachments to a submittal
**When** I upload files:
  - "drawing.pdf" (PDF document)
  - "photo.jpg" (JPEG image)
  - "calculation.xlsx" (Excel spreadsheet)
  - "spec-sheet.docx" (Word document)
**Then** all files are accepted and uploaded successfully

#### Scenario: Reject unsupported file types

**Given** I am adding an attachment
**When** I attempt to upload "virus.exe" (executable file)
**Then** the upload is blocked with error "Unsupported file type. Please upload PDF, image, or document files only."
**And** the file is not uploaded

---

### Requirement: View and Download Attachments

Users MUST be able to view the list of attachments for a submittal and download individual files.

**Priority**: P0 (Critical)

#### Scenario: View attachments on submittal detail page

**Given** submittal "03 30 00-001" (Rev 0) has 3 attachments:
  - "concrete-mix-design.pdf" (Product Data, 5MB)
  - "shop-drawing-1.pdf" (Shop Drawing, 12MB)
  - "sample-photo.jpg" (Sample Photo, 2MB)
**When** I view the submittal detail page
**Then** I see an "Attachments" section listing all 3 files
**And** each shows: filename, type, file size, upload date, uploader name
**And** each has a "Download" button

#### Scenario: Download attachment with signed URL

**Given** I am viewing submittal "03 30 00-001"
**And** the submittal has attachment "concrete-mix-design.pdf"
**When** I click "Download" on the attachment
**Then** a signed URL is generated from Supabase Storage
**And** the file begins downloading to my device
**And** the signed URL expires after 1 hour

---

### Requirement: Delete Attachment from Draft Submittal

Users MUST be able to delete attachments from draft submittals before submission.

**Priority**: P1 (Important)

#### Scenario: Creator deletes attachment from draft

**Given** submittal "03 30 00-001" has status "draft"
**And** I am the creator
**And** the submittal has 3 attachments
**When** I click "Delete" on attachment "wrong-file.pdf"
**And** I confirm the deletion
**Then** the attachment record is deleted from the database
**And** the file is deleted from Supabase Storage
**And** the attachment no longer appears in the list
**And** I receive confirmation "Attachment deleted"

#### Scenario: Cannot delete attachment from submitted submittal

**Given** submittal "03 30 00-001" has status "gc_review"
**When** I attempt to delete an attachment
**Then** the delete button is disabled
**And** I see a tooltip "Cannot delete attachments after submission"

---

### Requirement: Attachment Types for Organization

Users MUST be able to categorize attachments by type for better organization.

**Priority**: P1 (Important)

#### Scenario: Categorize attachments by type

**Given** I am uploading attachments to submittal "03 30 00-001"
**When** I upload "product-data.pdf" and select type "Product Data"
**And** I upload "shop-drawing.pdf" and select type "Shop Drawing"
**And** I upload "sample.jpg" and select type "Sample Photo"
**Then** all attachments are categorized correctly
**And** the submittal detail page groups attachments by type:
  - Product Data (1 file)
  - Shop Drawings (1 file)
  - Sample Photos (1 file)

---

### Requirement: Chunked Upload for Large Files

The system MUST support resumable chunked uploads for large files (>5MB) to handle network interruptions.

**Priority**: P1 (Important)

#### Scenario: Resume interrupted upload

**Given** I am uploading "large-shop-drawing.pdf" (40MB)
**And** the upload progresses to 60%
**When** my internet connection drops temporarily
**And** the connection is restored
**Then** the upload automatically resumes from 60%
**And** I don't need to restart the upload from 0%
**And** the file eventually completes successfully

---

### Requirement: Attachment Preview for Images and PDFs

Users MUST be able to preview image and PDF attachments inline without downloading.

**Priority**: P2 (Nice to Have)

#### Scenario: Preview image attachment inline

**Given** submittal "03 30 00-001" has attachment "sample-photo.jpg"
**When** I click on the attachment thumbnail
**Then** a modal opens showing the full image
**And** I can zoom in/out
**And** I can download from the preview modal

#### Scenario: Preview PDF attachment inline

**Given** submittal "03 30 00-001" has attachment "shop-drawing.pdf"
**When** I click "Preview" on the attachment
**Then** a PDF viewer modal opens
**And** I can navigate through the PDF pages
**And** I can download the full PDF from the preview

---

### Requirement: Attachment Metadata Tracking

The system MUST track upload metadata for audit purposes: who uploaded, when, file hash for integrity.

**Priority**: P1 (Important)

#### Scenario: Track upload metadata

**Given** I upload "concrete-mix-design.pdf" to submittal "03 30 00-001"
**When** the file is uploaded successfully
**Then** the attachment record stores:
  - uploaded_by: my user ID
  - created_at: current timestamp
  - file_name: original filename
  - file_size: bytes
  - file_type: MIME type
  - file_path: storage path
**And** admins can view this metadata for audit purposes

---

### Requirement: Version-Specific Attachment Storage

Attachments MUST be stored separately for each version to prevent confusion between revisions.

**Priority**: P0 (Critical)

#### Scenario: Attachments stored in version-specific folders

**Given** Rev 0 has attachment "concrete-mix-design-v1.pdf"
**And** Rev A has attachment "concrete-mix-design-v2.pdf"
**When** files are uploaded
**Then** Rev 0 file is stored at:
  `/submittals/{project_id}/{submittal_id}/rev-0/concrete-mix-design-v1.pdf`
**And** Rev A file is stored at:
  `/submittals/{project_id}/{submittal_id}/rev-a/concrete-mix-design-v2.pdf`
**And** the two files never overwrite each other

---

### Requirement: Link Attachments to Specification Sections

Users MUST be able to link attachments to specific spec sections or drawing sheets for cross-referencing.

**Priority**: P2 (Nice to Have)

#### Scenario: Link attachment to spec section

**Given** I am uploading "concrete-test-results.pdf"
**When** I add optional metadata:
  - Related spec section: "03 30 00.2.1"
  - Related drawing: "S-101"
**And** I upload the file
**Then** the attachment record includes these references
**And** users viewing spec section "03 30 00.2.1" can see linked submittals
**And** users viewing drawing "S-101" can see related attachments

---

### Requirement: Bulk Download All Attachments

Users MUST be able to download all attachments for a submittal as a ZIP file.

**Priority**: P2 (Nice to Have)

#### Scenario: Download all attachments as ZIP

**Given** submittal "03 30 00-001" has 5 attachments totaling 25MB
**When** I click "Download All Attachments"
**Then** a ZIP file is generated containing all 5 files
**And** the ZIP is named "03-30-00-001-rev-0-attachments.zip"
**And** the ZIP downloads to my device
**And** I can extract all files at once

---

### Requirement: Attachment Access Control via RLS

The system MUST enforce RLS policies so users can only access attachments for submittals in projects they have access to.

**Priority**: P0 (Critical)

#### Scenario: User can view attachments in accessible projects

**Given** I have access to project "Sunset Tower"
**And** submittal "03 30 00-001" belongs to project "Sunset Tower"
**When** I view the submittal
**Then** I can see and download all attachments

#### Scenario: User cannot access attachments in restricted projects

**Given** I do NOT have access to project "Other Project"
**And** submittal "03 30 00-001" belongs to "Other Project"
**When** I attempt to access the submittal
**Then** I receive "Access denied"
**And** no signed URLs are generated for attachments
**And** I cannot download any files

---

### Requirement: Client-Side Image Compression

The system MUST automatically compress large images before upload to save bandwidth and storage.

**Priority**: P2 (Nice to Have)

#### Scenario: Compress large photo before upload

**Given** I am uploading "sample-photo.jpg" (12MB, 4000x3000px)
**When** I select the file for upload
**Then** the system automatically compresses the image to:
  - 80% JPEG quality
  - Max dimensions: 2000x1500px
  - Resulting size: ~2MB
**And** I see a notice "Image compressed from 12MB to 2MB"
**And** the compressed version is uploaded
**And** storage space is saved

---

### Requirement: Attachment Virus Scanning

The system MUST scan uploaded files for viruses and malware before storing.

**Priority**: P2 (Nice to Have)

#### Scenario: Scan file for viruses on upload

**Given** I am uploading "product-data.pdf"
**When** the file is uploaded to the server
**Then** the file is scanned for viruses using Supabase Edge Function
**And** if clean, the upload proceeds
**And** if infected, the upload is blocked with error "File failed virus scan"
**And** the infected file is not stored
