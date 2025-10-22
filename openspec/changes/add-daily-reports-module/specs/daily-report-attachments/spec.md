# Capability: Daily Report Attachments Management

**Capability ID**: `daily-report-attachments`
**Status**: New
**Owner**: Backend Team

## Purpose

Enable construction teams to upload, view, and manage photo and document attachments for daily reports, with automatic compression, EXIF metadata extraction, and GPS geolocation support.

## ADDED Requirements

### Requirement: Upload Photos to Daily Report

Users MUST be able to upload multiple photos to a daily report with automatic client-side compression.

**Priority**: P0 (Critical)

#### Scenario: Upload single photo to daily report

**Given** I am editing a draft daily report for 2025-01-20
**When** I select a photo file "progress_photo_1.jpg" (5MB, 12MP)
**Then** the photo is compressed client-side to <500KB
**And** the compressed photo is uploaded to Supabase Storage
**And** an attachment record is created with:
- file_path: "daily-reports/{report_id}/{uuid}.jpg"
- file_name: "progress_photo_1.jpg"
- file_size: 450KB (compressed)
- attachment_type: "photo"
**And** an upload progress indicator shows 0% → 100%

#### Scenario: Bulk upload multiple photos

**Given** I am editing a draft daily report
**When** I select 10 photos (each 5MB)
**Then** all 10 photos are compressed in parallel
**And** photos are uploaded with max 3 concurrent uploads
**And** a bulk progress indicator shows "3 of 10 uploaded"
**And** all 10 attachments are linked to the daily report

#### Scenario: Upload photo with EXIF metadata extraction

**Given** I upload a photo captured on my phone with GPS enabled
**When** the photo is processed
**Then** EXIF data is extracted:
- GPS latitude: 37.7749
- GPS longitude: -122.4194
- Captured at: 2025-01-20 14:30:00
- Device model: "iPhone 14 Pro"
**And** the EXIF data is stored in the attachment record
**And** a map thumbnail shows the photo location

---

### Requirement: View Photos in Gallery

Users MUST be able to view all photos for a daily report in a gallery with lightbox and thumbnails.

**Priority**: P0 (Critical)

#### Scenario: View photo gallery on daily report detail page

**Given** a daily report has 8 photo attachments
**When** I view the report detail page
**Then** I see a photo gallery section with 8 thumbnails in a grid
**And** each thumbnail shows a preview (200x200px)
**And** thumbnails are lazy-loaded for performance

#### Scenario: Open photo in lightbox for full-size view

**Given** I am viewing a photo gallery with 8 photos
**When** I click on photo #3
**Then** a lightbox modal opens showing the full-size photo
**And** I can navigate to previous/next photos using arrows
**And** I can zoom in/out on the photo
**And** I see photo metadata: filename, captured date, GPS coordinates (if available)
**And** I can download the original photo

---

### Requirement: Add Photo Descriptions and Tags

Users MUST be able to add descriptions to photos for context and searchability.

**Priority**: P1 (High)

#### Scenario: Add description to uploaded photo

**Given** I have uploaded a photo to a daily report
**When** I click "Add Description" on the photo thumbnail
**And** I enter "Electrical rough-in on Level 2, Grid A-C"
**Then** the description is saved to the attachment record
**And** the description appears below the photo thumbnail
**And** the photo is searchable by description keywords

---

### Requirement: Delete Photos from Draft Reports

Users MUST be able to remove photos from daily reports while in draft status.

**Priority**: P1 (High)

#### Scenario: Delete photo from draft report

**Given** a draft daily report has 5 photo attachments
**When** I delete photo #3
**Then** the photo attachment record is deleted
**And** the photo file is removed from Supabase Storage
**And** the gallery shows only 4 remaining photos
**And** an audit log entry is created

#### Scenario: Cannot delete photos after submission

**Given** a daily report has status "submitted"
**And** it has 5 photo attachments
**When** I attempt to delete a photo
**Then** I receive an error "Cannot delete photos after report submission"
**And** the photo remains in the report

---

### Requirement: Client-Side Photo Compression

The system MUST compress photos on the client before upload to save bandwidth and storage.

**Priority**: P0 (Critical)

#### Scenario: Compress high-resolution photo

**Given** I upload a photo "IMG_1234.jpg" with:
- Original size: 5.2MB
- Resolution: 4032 × 3024 (12MP)
**When** the photo is compressed using browser-image-compression library
**Then** the compressed photo has:
- Compressed size: <500KB
- Resolution: 1920 × 1440 (maintains aspect ratio)
- Quality: 80%
- Format: JPEG
**And** the compression takes <3 seconds per photo

#### Scenario: Skip compression for already-small photos

**Given** I upload a photo "thumbnail.jpg" with size 150KB
**When** the photo is processed
**Then** compression is skipped (already under 500KB threshold)
**And** the original photo is uploaded as-is

---

### Requirement: Extract and Display GPS Coordinates from EXIF

The system MUST extract GPS coordinates from photo EXIF data and display location on a map.

**Priority**: P1 (High)

#### Scenario: Extract GPS coordinates from photo

**Given** I upload a photo with embedded GPS EXIF data:
- Latitude: 37.7749
- Longitude: -122.4194
**When** the photo is processed
**Then** the GPS coordinates are extracted and stored
**And** a map thumbnail is displayed next to the photo showing the location
**And** clicking the map opens a full map view with the photo pinned

#### Scenario: Photo has no GPS data

**Given** I upload a photo with no GPS EXIF data (e.g., screenshot, edited photo)
**When** the photo is processed
**Then** the GPS fields are null
**And** no map thumbnail is displayed
**And** the photo is still uploaded successfully

---

### Requirement: Verify Photos Captured Within Project Site Boundary

The system MUST verify that photo GPS coordinates fall within the project site boundary when GPS data is available.

**Priority**: P2 (Medium)

#### Scenario: Photo GPS within project boundary

**Given** the project site boundary is defined as a radius around 37.7749, -122.4194
**And** I upload a photo with GPS 37.7755, -122.4188 (within 100m of site center)
**When** the photo is processed
**Then** the photo is accepted
**And** a green check badge indicates "Photo captured on-site"

#### Scenario: Photo GPS outside project boundary

**Given** the project site boundary is defined
**And** I upload a photo with GPS 37.8000, -122.5000 (5km away from site)
**When** the photo is processed
**Then** the photo is accepted (not rejected)
**And** a yellow warning badge indicates "Photo location is outside project site boundary"
**And** this helps identify potential data quality issues (e.g., photos from wrong project)

---

### Requirement: Photo Privacy and EXIF Stripping

Admins MUST be able to configure EXIF GPS stripping for privacy compliance.

**Priority**: P2 (Medium)

#### Scenario: Admin enables GPS stripping

**Given** I am a project admin
**And** I enable the setting "Strip GPS coordinates from photos"
**When** a user uploads a photo with GPS EXIF data
**Then** the GPS coordinates are extracted and stored in the database
**And** the GPS data is stripped from the photo file before storage
**And** downloaded photos do not contain GPS EXIF data

#### Scenario: User consents to GPS capture on first upload

**Given** I am uploading my first photo to any daily report
**And** I have not seen the GPS consent dialog
**When** the upload begins
**Then** a dialog appears: "Photos may contain GPS location data. This helps verify on-site documentation. Continue?"
**And** I can choose "Accept" or "Decline"
**And** my choice is stored in user preferences

---

### Requirement: Upload Documents (PDFs, etc.) to Daily Report

Users MUST be able to upload documents (PDF, DOC, etc.) in addition to photos.

**Priority**: P2 (Medium)

#### Scenario: Upload delivery ticket PDF

**Given** I am editing a draft daily report
**When** I upload a document "delivery_ticket_RM-2025-0120.pdf" (200KB)
**Then** the document is uploaded to Supabase Storage
**And** an attachment record is created with attachment_type "document"
**And** the document appears in the "Documents" section (separate from photos)
**And** I can download the PDF from the report detail page

---

### Requirement: Download All Photos as ZIP

Users MUST be able to download all photos from a daily report as a ZIP archive.

**Priority**: P2 (Medium)

#### Scenario: Download all photos as ZIP

**Given** a daily report has 10 photo attachments
**When** I click "Download All Photos"
**Then** a ZIP file is generated containing all 10 photos
**And** the ZIP filename is "daily-report-2025-01-20-photos.zip"
**And** the ZIP file is downloaded to my device
**And** the ZIP generation shows a progress indicator

---

### Requirement: Photo Upload Limits and Validation

The system MUST enforce photo upload limits to prevent abuse.

**Priority**: P0 (Critical)

#### Scenario: Enforce max 50 photos per daily report

**Given** a draft daily report already has 50 photo attachments
**When** I attempt to upload an additional photo
**Then** I receive an error "Maximum 50 photos per daily report"
**And** the upload is rejected

#### Scenario: Reject invalid file types

**Given** I am uploading a file "document.exe"
**When** the file type is validated
**Then** I receive an error "Invalid file type. Only images (JPG, PNG, HEIC) and documents (PDF) allowed"
**And** the upload is rejected

#### Scenario: Reject oversized files

**Given** I am uploading a photo "large_photo.jpg" with size 50MB
**When** the file size is validated
**Then** I receive an error "File too large. Maximum 20MB per file"
**And** the upload is rejected
**And** I am prompted to compress the photo first

---

### Requirement: Display Photo Capture Timestamp

Users MUST be able to see when each photo was captured (from EXIF or upload time).

**Priority**: P1 (High)

#### Scenario: Display EXIF capture timestamp

**Given** a photo has EXIF DateTimeOriginal of 2025-01-20 14:30:00
**When** I view the photo in the gallery
**Then** the timestamp displays "Captured: Jan 20, 2025, 2:30 PM"
**And** the timestamp is color-coded green if captured on the report date

#### Scenario: Fall back to upload timestamp if no EXIF

**Given** a photo has no EXIF DateTimeOriginal (e.g., screenshot)
**When** I view the photo in the gallery
**Then** the timestamp displays "Uploaded: Jan 20, 2025, 5:00 PM"
**And** the timestamp is color-coded gray to indicate "approximate time"

---

## Test Coverage

### Unit Tests
- [x] Photo compression logic (browser-image-compression)
- [x] EXIF extraction (GPS, timestamp, device model)
- [x] File type validation (allowed extensions)
- [x] File size validation (max 20MB before compression)
- [x] GPS boundary check (distance calculation)

### Integration Tests
- [x] Photo upload to Supabase Storage
- [x] Attachment record creation in database
- [x] RLS policies: users can only view attachments for accessible reports
- [x] Delete attachment removes file from storage
- [x] Bulk upload with concurrent limits

### E2E Tests
- [x] Upload 10 photos → Verify compressed and linked to report
- [x] Upload photo with GPS → Verify map thumbnail displayed
- [x] Delete photo from draft → Verify removed from storage
- [x] Download all photos as ZIP
- [x] Exceed 50 photo limit → Verify error

## Dependencies

- **Storage**: Supabase Storage for photo/document uploads
- **Compression library**: browser-image-compression (npm package)
- **EXIF library**: exifr (npm package)
- **Parent capability**: daily-report-lifecycle (attachments linked to daily reports)
- **Map display**: Mapbox or Google Maps API for GPS visualization

## Acceptance Criteria

- [ ] User can upload multiple photos with automatic compression (<500KB per photo)
- [ ] EXIF metadata (GPS, timestamp, device) is extracted and stored
- [ ] Photos are displayed in a gallery with thumbnails and lightbox view
- [ ] Users can add descriptions to photos for context
- [ ] Photos can be deleted from draft reports only (immutable after submission)
- [ ] GPS coordinates are displayed on a map thumbnail if available
- [ ] Photo upload limits enforced (max 50 photos, 20MB per file)
- [ ] Invalid file types are rejected (only JPG, PNG, HEIC, PDF allowed)
- [ ] User consent dialog shown on first photo upload explaining GPS capture
- [ ] Admin can enable GPS stripping for privacy compliance
- [ ] All photos can be downloaded as a single ZIP archive
- [ ] Photo capture timestamps displayed (from EXIF or upload time)
