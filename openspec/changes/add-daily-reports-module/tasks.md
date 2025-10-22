# Implementation Tasks: Daily Reports Module

**Change ID**: `add-daily-reports-module`
**Status**: Proposed
**Estimated Duration**: 2 weeks (Weeks 7-8)

---

## Phase 1: Database Foundation (Days 1-2)

### Task 1.1: Create Daily Report Enums Migration
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_daily_report_enums.sql`
- [ ] Define enum `daily_report_status`: draft, submitted, approved, archived
- [ ] Define enum `weather_condition`: clear, partly_cloudy, overcast, rain, snow, fog, wind
- [ ] Define enum `incident_type`: safety, delay, quality, visitor, inspection, other
- [ ] Define enum `incident_severity`: low, medium, high, critical
- [ ] Define enum `attachment_type`: photo, document, other
- [ ] **Validation**: Run `npm run db:reset` and verify enums created
- [ ] **Validation**: Test enum values with `SELECT enum_range(NULL::daily_report_status);`

**Dependencies**: Foundation database schema must exist
**Parallelizable**: Yes (can run independently)

---

### Task 1.2: Create Daily Reports Table Migration
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_daily_reports_table.sql`
- [ ] Define `daily_reports` table with all columns from design.md:
  - id, project_id, report_date, status
  - weather fields: weather_condition, temperature_high, temperature_low, precipitation, wind_speed, humidity
  - work fields: work_hours_start, work_hours_end, total_crew_count
  - content fields: narrative, delays, visitors, inspections
  - tracking fields: created_by, submitted_by, submitted_at, approved_by, approved_at
  - metadata: custom_fields (jsonb), created_at, updated_at, deleted_at
- [ ] Add CHECK constraint for status enum validation
- [ ] Add CHECK constraint for temperature range validation (high >= low)
- [ ] Create partial unique index: `(project_id, report_date) WHERE status IN ('submitted', 'approved', 'archived') AND deleted_at IS NULL`
- [ ] Create index on `project_id, report_date DESC` for list queries
- [ ] Create index on `project_id, status, report_date DESC` for status filtering
- [ ] Create index on `created_by, report_date DESC` for "my reports"
- [ ] Create index on `project_id, weather_condition, report_date` for weather analytics
- [ ] Add trigger for `updated_at` auto-update
- [ ] **Validation**: Run `npm run db:reset` and verify table created
- [ ] **Validation**: Check indexes with `\d daily_reports` in psql
- [ ] **Validation**: Test unique constraint by trying to submit two reports for same date

**Dependencies**: Task 1.1 must be complete
**Parallelizable**: No

---

### Task 1.3: Create Daily Report Crew Entries Table Migration
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_daily_report_crew_entries_table.sql`
- [ ] Define `daily_report_crew_entries` table with columns:
  - id, daily_report_id (FK), trade, csi_division, subcontractor_org_id (FK)
  - headcount, hours_worked, classification, hourly_rate, notes
  - created_at, updated_at
- [ ] Add CHECK constraint: headcount > 0, hours_worked >= 0
- [ ] Create index on `daily_report_id` for entry queries
- [ ] Create index on `daily_report_id, trade, hours_worked` for analytics
- [ ] Add trigger for `updated_at` auto-update
- [ ] Add trigger to update `total_crew_count` on parent daily_report
- [ ] **Validation**: Run `npm run db:reset` and verify table created
- [ ] **Validation**: Test trigger by inserting crew entry and checking total_crew_count

**Dependencies**: Task 1.2 must be complete (FK to daily_reports)
**Parallelizable**: No

---

### Task 1.4: Create Daily Report Equipment Entries Table Migration
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_daily_report_equipment_entries_table.sql`
- [ ] Define `daily_report_equipment_entries` table with columns:
  - id, daily_report_id (FK), equipment_type, equipment_id, operator_name
  - hours_used, fuel_consumed, rental_cost, notes
  - created_at, updated_at
- [ ] Add CHECK constraint: hours_used > 0
- [ ] Create index on `daily_report_id` for entry queries
- [ ] Create index on `daily_report_id, equipment_type, hours_used` for analytics
- [ ] Add trigger for `updated_at` auto-update
- [ ] **Validation**: Run `npm run db:reset` and verify table created

**Dependencies**: Task 1.2 must be complete
**Parallelizable**: Yes (parallel with Task 1.3, 1.5, 1.6)

---

### Task 1.5: Create Daily Report Material Entries Table Migration
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_daily_report_material_entries_table.sql`
- [ ] Define `daily_report_material_entries` table with columns:
  - id, daily_report_id (FK), material_description, supplier, quantity, unit
  - delivery_time, delivery_ticket, location, notes
  - created_at, updated_at
- [ ] Add CHECK constraint: quantity > 0
- [ ] Create index on `daily_report_id` for entry queries
- [ ] Add trigger for `updated_at` auto-update
- [ ] **Validation**: Run `npm run db:reset` and verify table created

**Dependencies**: Task 1.2 must be complete
**Parallelizable**: Yes (parallel with Task 1.3, 1.4, 1.6)

---

### Task 1.6: Create Daily Report Incidents Table Migration
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_daily_report_incidents_table.sql`
- [ ] Define `daily_report_incidents` table with columns:
  - id, daily_report_id (FK), incident_type, severity, time_occurred
  - description, involved_parties, corrective_action, reported_to
  - follow_up_required, osha_recordable, notes
  - created_at, updated_at
- [ ] Create index on `daily_report_id` for entry queries
- [ ] Create index on `daily_report_id, incident_type` for incident analytics
- [ ] Create index on `osha_recordable = true` for compliance reporting
- [ ] Add trigger for `updated_at` auto-update
- [ ] **Validation**: Run `npm run db:reset` and verify table created

**Dependencies**: Task 1.2 must be complete
**Parallelizable**: Yes (parallel with Task 1.3, 1.4, 1.5)

---

### Task 1.7: Create Daily Report Attachments Table Migration
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_daily_report_attachments_table.sql`
- [ ] Define `daily_report_attachments` table with columns:
  - id, daily_report_id (FK), file_path, file_name, file_size, file_type
  - attachment_type, description
  - gps_latitude, gps_longitude, captured_at
  - uploaded_by (FK), created_at
- [ ] Create index on `daily_report_id` for attachment queries
- [ ] Create index on `daily_report_id, attachment_type` for filtering photos/documents
- [ ] Add CHECK constraint: max 50 attachments per report (Phase 2)
- [ ] **Validation**: Run `npm run db:reset` and verify table created

**Dependencies**: Task 1.2 must be complete
**Parallelizable**: Yes (parallel with Task 1.3, 1.4, 1.5, 1.6)

---

### Task 1.8: Create RLS Policies for Daily Reports
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_daily_report_rls_policies.sql`
- [ ] Enable RLS on `daily_reports` table
- [ ] Create policy: "Users can view daily reports in accessible projects" (SELECT)
- [ ] Create policy: "Users can create draft daily reports in their projects" (INSERT)
- [ ] Create policy: "Users can update their own draft daily reports" (UPDATE)
- [ ] Create policy: "Project managers can update submitted daily reports" (UPDATE for approval)
- [ ] Create policy: "Admins can revert and soft-delete daily reports" (UPDATE, DELETE)
- [ ] **Validation**: Test with different user roles via SQL queries
- [ ] **Validation**: Verify unauthorized users cannot access reports
- [ ] **Validation**: Test unique constraint conflicts with concurrent submissions

**Dependencies**: Task 1.2 complete, `user_project_ids()` and `user_has_project_role()` helpers exist
**Parallelizable**: Yes (parallel with Task 1.9-1.13)

---

### Task 1.9: Create RLS Policies for Crew Entries
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_crew_entries_rls_policies.sql`
- [ ] Enable RLS on `daily_report_crew_entries` table
- [ ] Create policy: "Users can view crew entries in accessible reports" (SELECT via parent RLS)
- [ ] Create policy: "Users can create crew entries in draft reports" (INSERT)
- [ ] Create policy: "Users can update crew entries in draft reports" (UPDATE)
- [ ] Create policy: "Users can delete crew entries from draft reports" (DELETE)
- [ ] **Validation**: Test entry access with different user roles

**Dependencies**: Task 1.3 complete
**Parallelizable**: Yes (parallel with Task 1.8, 1.10-1.13)

---

### Task 1.10: Create RLS Policies for Equipment Entries
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_equipment_entries_rls_policies.sql`
- [ ] Enable RLS on `daily_report_equipment_entries` table
- [ ] Create policy: "Users can view equipment entries in accessible reports" (SELECT)
- [ ] Create policy: "Users can create equipment entries in draft reports" (INSERT)
- [ ] Create policy: "Users can update equipment entries in draft reports" (UPDATE)
- [ ] Create policy: "Users can delete equipment entries from draft reports" (DELETE)
- [ ] **Validation**: Test entry access with different user roles

**Dependencies**: Task 1.4 complete
**Parallelizable**: Yes (parallel with Task 1.8, 1.9, 1.11-1.13)

---

### Task 1.11: Create RLS Policies for Material Entries
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_material_entries_rls_policies.sql`
- [ ] Enable RLS on `daily_report_material_entries` table
- [ ] Create policies for SELECT, INSERT, UPDATE, DELETE (same pattern as crew/equipment)
- [ ] **Validation**: Test entry access with different user roles

**Dependencies**: Task 1.5 complete
**Parallelizable**: Yes (parallel with Task 1.8-1.10, 1.12, 1.13)

---

### Task 1.12: Create RLS Policies for Incidents
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_incidents_rls_policies.sql`
- [ ] Enable RLS on `daily_report_incidents` table
- [ ] Create policies for SELECT, INSERT, UPDATE, DELETE (same pattern)
- [ ] Add special policy: Safety managers can view all OSHA-recordable incidents
- [ ] **Validation**: Test incident access with different user roles
- [ ] **Validation**: Verify safety managers can view all OSHA incidents

**Dependencies**: Task 1.6 complete
**Parallelizable**: Yes (parallel with Task 1.8-1.11, 1.13)

---

### Task 1.13: Create RLS Policies for Attachments
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_attachments_rls_policies.sql`
- [ ] Enable RLS on `daily_report_attachments` table
- [ ] Create policy: "Users can view attachments in accessible reports" (SELECT)
- [ ] Create policy: "Users can upload attachments to draft reports" (INSERT)
- [ ] Create policy: "Uploaders can delete attachments from draft reports" (DELETE)
- [ ] **Validation**: Test attachment access with different user roles

**Dependencies**: Task 1.7 complete
**Parallelizable**: Yes (parallel with Task 1.8-1.12)

---

### Task 1.14: Create Audit Log Triggers
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_daily_report_audit_triggers.sql`
- [ ] Create trigger for `daily_reports` INSERT/UPDATE/DELETE
- [ ] Create trigger for `daily_report_crew_entries` INSERT/UPDATE/DELETE
- [ ] Create trigger for `daily_report_equipment_entries` INSERT/UPDATE/DELETE
- [ ] Create trigger for `daily_report_material_entries` INSERT/UPDATE/DELETE
- [ ] Create trigger for `daily_report_incidents` INSERT/UPDATE/DELETE (especially OSHA-recordable)
- [ ] Create trigger for `daily_report_attachments` INSERT/DELETE
- [ ] Log: action type, user_id, timestamp, old/new values
- [ ] **Validation**: Perform mutations and verify audit log entries

**Dependencies**: Tasks 1.2-1.7 complete, audit_logs table exists
**Parallelizable**: No

---

### Task 1.15: Create Supabase Storage Bucket for Attachments
- [ ] Create storage bucket: `daily-report-attachments` via Supabase console or migration
- [ ] Set bucket policy: Private (RLS-controlled access)
- [ ] Configure max file size: 20MB
- [ ] Enable automatic image transformations (thumbnails)
- [ ] **Validation**: Test file upload via Supabase client

**Dependencies**: None
**Parallelizable**: Yes

---

### Task 1.16: Generate TypeScript Types from Schema
- [ ] Run `npm run db:types` to generate types
- [ ] Verify types in `lib/types/supabase.ts` include all daily report tables
- [ ] Create type guards for enums (status, weather_condition, incident_type, etc.)
- [ ] Export convenience types: `DailyReport`, `CrewEntry`, `EquipmentEntry`, etc.
- [ ] **Validation**: TypeScript build succeeds with new types
- [ ] **Validation**: Import types in a test file and verify autocomplete works

**Dependencies**: Tasks 1.1-1.14 complete
**Parallelizable**: No

---

## Phase 2: Weather API Integration (Days 3-4)

### Task 2.1: Create Weather API Client
- [ ] Create file: `lib/integrations/weather/openweathermap-client.ts`
- [ ] Implement `fetchWeatherData(latitude, longitude, date)` function
- [ ] Handle API responses: transform to internal weather data format
- [ ] Implement error handling: API failures, rate limits, timeout
- [ ] Implement exponential backoff for retries (1s, 2s, 4s)
- [ ] Add environment variable: `OPENWEATHER_API_KEY`
- [ ] **Validation**: Write unit test with mocked API responses
- [ ] **Validation**: Test with live API call in development (manual)

**Dependencies**: None
**Parallelizable**: Yes (parallel with Task 2.2, 2.3)

---

### Task 2.2: Create Weather Cache Layer
- [ ] Create file: `lib/integrations/weather/weather-cache.ts`
- [ ] Implement cache key generation: `weather:{lat},{lon}:{date}`
- [ ] Use in-memory cache for development (simple Map)
- [ ] Use Redis for production (optional, Phase 2)
- [ ] Set cache expiration: 24 hours for historical weather
- [ ] Implement cache invalidation on manual weather override
- [ ] **Validation**: Test cache hit/miss scenarios
- [ ] **Validation**: Verify API call count reduced with caching

**Dependencies**: Task 2.1 complete
**Parallelizable**: No

---

### Task 2.3: Create Weather Helper Functions
- [ ] Create file: `lib/utils/weather-utils.ts`
- [ ] Implement `transformWeatherAPIResponse(apiData)` to normalize data
- [ ] Implement `getWeatherIcon(condition)` for UI display
- [ ] Implement `getWeatherColorCode(condition, windSpeed)` for severity badges
- [ ] Implement `isHistoricalWeatherAvailable(date)` to check API limits (5 days)
- [ ] **Validation**: Write unit tests for all helper functions

**Dependencies**: None
**Parallelizable**: Yes (parallel with Task 2.1, 2.2)

---

## Phase 3: Server Actions & Business Logic (Days 4-6)

### Task 3.1: Create Server Action - createDailyReport
- [ ] Create file: `lib/actions/daily-reports/create-daily-report.ts`
- [ ] Implement validation: report_date required, project access check
- [ ] Fetch weather data automatically (call weather API client)
- [ ] Insert into `daily_reports` table with status "draft"
- [ ] Handle weather API failures gracefully (fallback to manual)
- [ ] Return DailyReport object or error
- [ ] **Validation**: Write unit test for createDailyReport
- [ ] **Validation**: Test with missing report_date (should fail)
- [ ] **Validation**: Test with weather API failure (should succeed with manual fallback)

**Dependencies**: Phase 1 complete, Task 2.1, 2.2 complete
**Parallelizable**: Yes (parallel with Task 3.2-3.10)

---

### Task 3.2: Create Server Action - updateDailyReport
- [ ] Create file: `lib/actions/daily-reports/update-daily-report.ts`
- [ ] Implement validation: status is "draft", user is creator or has permission
- [ ] Allow updates to: narrative, delays, visitors, inspections, work_hours
- [ ] Prevent updates to: report_date (immutable), status (use separate actions)
- [ ] Return updated DailyReport or error
- [ ] **Validation**: Write unit test for updateDailyReport
- [ ] **Validation**: Test update on submitted report (should fail)

**Dependencies**: Phase 1 complete
**Parallelizable**: Yes (parallel with Task 3.1, 3.3-3.10)

---

### Task 3.3: Create Server Action - submitDailyReport
- [ ] Create file: `lib/actions/daily-reports/submit-daily-report.ts`
- [ ] Implement validation: status is "draft", user is creator
- [ ] Check required fields: weather_condition, at least one of (crew entries, equipment entries, narrative)
- [ ] Handle unique constraint violation: detect duplicate submission for same date
- [ ] Update status to "submitted", set submitted_at, submitted_by
- [ ] Send notification to project manager
- [ ] Return updated DailyReport or DuplicateReportError
- [ ] **Validation**: Write unit test for submitDailyReport
- [ ] **Validation**: Test without required fields (should fail)
- [ ] **Validation**: Test duplicate submission (should fail with DuplicateReportError)

**Dependencies**: Phase 1 complete
**Parallelizable**: Yes (parallel with Task 3.1-3.2, 3.4-3.10)

---

### Task 3.4: Create Server Action - approveDailyReport
- [ ] Create file: `lib/actions/daily-reports/approve-daily-report.ts`
- [ ] Implement authorization: user is project manager or admin
- [ ] Check status is "submitted"
- [ ] Update status to "approved", set approved_at, approved_by
- [ ] Send notification to submitter
- [ ] Return updated DailyReport or error
- [ ] **Validation**: Write unit test for approveDailyReport
- [ ] **Validation**: Test with field supervisor (should fail with 403)

**Dependencies**: Phase 1 complete
**Parallelizable**: Yes (parallel with Task 3.1-3.3, 3.5-3.10)

---

### Task 3.5: Create Server Action - revertDailyReportToDraft
- [ ] Create file: `lib/actions/daily-reports/revert-daily-report.ts`
- [ ] Implement authorization: user is admin only
- [ ] Accept reason parameter for audit logging
- [ ] Update status to "draft", log reversion reason
- [ ] Send notification to original submitter
- [ ] Return updated DailyReport or error
- [ ] **Validation**: Write unit test for revertDailyReportToDraft
- [ ] **Validation**: Test with non-admin (should fail)

**Dependencies**: Phase 1 complete
**Parallelizable**: Yes (parallel with Task 3.1-3.4, 3.6-3.10)

---

### Task 3.6: Create Server Action - copyFromPreviousReport
- [ ] Create file: `lib/actions/daily-reports/copy-from-previous.ts`
- [ ] Find previous report: most recent submitted/approved report before current date
- [ ] Create new draft daily report for specified date
- [ ] Duplicate crew entries (without notes)
- [ ] Duplicate equipment entries (without notes)
- [ ] Do NOT copy: narrative, delays, incidents, attachments
- [ ] Return new DailyReport or error if no previous report exists
- [ ] **Validation**: Write unit test for copyFromPreviousReport
- [ ] **Validation**: Test with no previous report (should return helpful error)

**Dependencies**: Phase 1 complete
**Parallelizable**: Yes (parallel with Task 3.1-3.5, 3.7-3.10)

---

### Task 3.7: Create Server Action - addCrewEntry
- [ ] Create file: `lib/actions/daily-reports/entries/add-crew-entry.ts`
- [ ] Implement validation: trade, headcount, hours_worked required
- [ ] Check daily report is in "draft" status
- [ ] Insert into `daily_report_crew_entries`
- [ ] Trigger updates total_crew_count on parent report
- [ ] Return CrewEntry or error
- [ ] **Validation**: Write unit test for addCrewEntry
- [ ] **Validation**: Test on submitted report (should fail)

**Dependencies**: Phase 1 complete
**Parallelizable**: Yes (parallel with Task 3.1-3.6, 3.8-3.10)

---

### Task 3.8: Create Server Action - addEquipmentEntry
- [ ] Create file: `lib/actions/daily-reports/entries/add-equipment-entry.ts`
- [ ] Implement validation: equipment_type, hours_used required
- [ ] Check daily report is in "draft" status
- [ ] Insert into `daily_report_equipment_entries`
- [ ] Return EquipmentEntry or error
- [ ] **Validation**: Write unit test for addEquipmentEntry

**Dependencies**: Phase 1 complete
**Parallelizable**: Yes (parallel with Task 3.1-3.7, 3.9-3.10)

---

### Task 3.9: Create Server Action - addMaterialEntry
- [ ] Create file: `lib/actions/daily-reports/entries/add-material-entry.ts`
- [ ] Implement validation: material_description, quantity, unit required
- [ ] Check daily report is in "draft" status
- [ ] Insert into `daily_report_material_entries`
- [ ] Return MaterialEntry or error
- [ ] **Validation**: Write unit test for addMaterialEntry

**Dependencies**: Phase 1 complete
**Parallelizable**: Yes (parallel with Task 3.1-3.8, 3.10)

---

### Task 3.10: Create Server Action - addIncident
- [ ] Create file: `lib/actions/daily-reports/entries/add-incident.ts`
- [ ] Implement validation: incident_type, description required
- [ ] Check daily report is in "draft" status
- [ ] Insert into `daily_report_incidents`
- [ ] If OSHA-recordable, send notification to safety manager
- [ ] Return Incident or error
- [ ] **Validation**: Write unit test for addIncident
- [ ] **Validation**: Test OSHA-recordable incident triggers notification

**Dependencies**: Phase 1 complete
**Parallelizable**: Yes (parallel with Task 3.1-3.9)

---

### Task 3.11: Create Server Actions for Entry Updates and Deletes
- [ ] Create files: `update-crew-entry.ts`, `delete-crew-entry.ts`
- [ ] Create files: `update-equipment-entry.ts`, `delete-equipment-entry.ts`
- [ ] Create files: `update-material-entry.ts`, `delete-material-entry.ts`
- [ ] Create files: `update-incident.ts`, `delete-incident.ts`
- [ ] All follow same pattern: check draft status, validate permissions, update/delete
- [ ] **Validation**: Write unit tests for all update/delete actions

**Dependencies**: Phase 1 complete, Tasks 3.7-3.10 complete
**Parallelizable**: Yes

---

## Phase 4: Photo Upload & Compression (Days 7-8)

### Task 4.1: Install and Configure Photo Libraries
- [ ] Install npm packages: `browser-image-compression`, `exifr`
- [ ] Configure TypeScript types for libraries
- [ ] **Validation**: TypeScript build succeeds

**Dependencies**: None
**Parallelizable**: Yes

---

### Task 4.2: Create Photo Compression Utility
- [ ] Create file: `lib/utils/photo-compression.ts`
- [ ] Implement `compressPhoto(file, options)` using browser-image-compression
- [ ] Default options: maxSizeMB: 0.5, maxWidthOrHeight: 1920, quality: 0.8
- [ ] Return compressed File object
- [ ] **Validation**: Write unit test with sample photo file
- [ ] **Validation**: Test compression reduces 5MB → <500KB

**Dependencies**: Task 4.1 complete
**Parallelizable**: Yes (parallel with Task 4.3)

---

### Task 4.3: Create EXIF Extraction Utility
- [ ] Create file: `lib/utils/exif-extraction.ts`
- [ ] Implement `extractExifData(file)` using exifr library
- [ ] Extract: GPS (latitude, longitude), DateTimeOriginal, Model, Orientation
- [ ] Return ExifData object or null if unavailable
- [ ] **Validation**: Write unit test with sample photos (with/without EXIF)
- [ ] **Validation**: Test with photo taken on phone with GPS enabled

**Dependencies**: Task 4.1 complete
**Parallelizable**: Yes (parallel with Task 4.2)

---

### Task 4.4: Create Server Action - uploadPhotos
- [ ] Create file: `lib/actions/daily-reports/attachments/upload-photos.ts`
- [ ] Accept array of File objects (bulk upload)
- [ ] Check daily report is in "draft" status
- [ ] Enforce max 50 photos per report
- [ ] For each photo:
  - Compress using photo compression utility (client-side, before server action)
  - Extract EXIF data
  - Upload to Supabase Storage bucket `daily-report-attachments/{reportId}/{uuid}.jpg`
  - Insert record into `daily_report_attachments`
- [ ] Return array of Attachment objects or errors
- [ ] **Validation**: Write unit test for uploadPhotos
- [ ] **Validation**: Test exceeding 50 photo limit (should fail)

**Dependencies**: Phase 1 complete, Task 4.2, 4.3 complete
**Parallelizable**: No

---

### Task 4.5: Create Server Action - deleteAttachment
- [ ] Create file: `lib/actions/daily-reports/attachments/delete-attachment.ts`
- [ ] Check daily report is in "draft" status
- [ ] Check user is uploader or admin
- [ ] Delete record from `daily_report_attachments`
- [ ] Delete file from Supabase Storage
- [ ] **Validation**: Write unit test for deleteAttachment
- [ ] **Validation**: Test on submitted report (should fail)

**Dependencies**: Phase 1 complete
**Parallelizable**: Yes

---

## Phase 5: UI Components (Days 9-12)

### Task 5.1: Create Daily Reports List Page
- [ ] Create file: `app/(dashboard)/[orgSlug]/projects/[projectId]/daily-reports/page.tsx`
- [ ] Implement server component: fetch daily reports for project
- [ ] Display reports in calendar view or table view (toggle)
- [ ] Add filters: date range, status, weather condition, submitter
- [ ] Add search: keyword in narrative, crew trades, incidents
- [ ] Show summary badges: weather icon, crew count, photo count
- [ ] Add "New Daily Report" button
- [ ] Implement pagination or infinite scroll
- [ ] **Validation**: Test with 30+ reports, verify performance
- [ ] **Validation**: Test filters and search

**Dependencies**: Phase 3 complete
**Parallelizable**: Yes (parallel with Task 5.2-5.8)

---

### Task 5.2: Create Daily Report Detail Page
- [ ] Create file: `app/(dashboard)/[orgSlug]/projects/[projectId]/daily-reports/[reportId]/page.tsx`
- [ ] Implement server component: fetch daily report with all entries and attachments
- [ ] Display sections:
  - Header: date, status, weather summary, submitter
  - Weather: detailed conditions with icon
  - Crew: table of crew entries, summary stats
  - Equipment: table of equipment entries, summary stats
  - Materials: table of material entries
  - Incidents: list of incidents with severity badges
  - Photos: gallery with thumbnails
  - Narrative: work summary, delays, visitors, inspections
  - Status timeline: audit history
- [ ] Add action buttons: Edit (if draft), Submit, Approve (if manager), Export PDF
- [ ] **Validation**: Test with report containing all entry types
- [ ] **Validation**: Verify correct permissions for action buttons

**Dependencies**: Phase 3 complete
**Parallelizable**: Yes (parallel with Task 5.1, 5.3-5.8)

---

### Task 5.3: Create Daily Report Form (Multi-Step Wizard)
- [ ] Create file: `components/daily-reports/daily-report-form.tsx`
- [ ] Implement client component with React Hook Form + Zod validation
- [ ] Step 1: Date selection, auto-fetch weather, show weather edit option
- [ ] Step 2: Work hours, narrative
- [ ] Step 3: Crew entries (add/edit/delete), show "Copy from Previous" button
- [ ] Step 4: Equipment entries (add/edit/delete)
- [ ] Step 5: Material entries (add/edit/delete)
- [ ] Step 6: Incidents (add/edit/delete)
- [ ] Step 7: Photo upload (bulk), show compression progress
- [ ] Step 8: Review all data, submit button
- [ ] Implement navigation: Next, Previous, Save Draft, Cancel
- [ ] Auto-save draft every 2 minutes
- [ ] **Validation**: Test complete workflow from start to submission
- [ ] **Validation**: Test validation errors on each step

**Dependencies**: Phase 3, 4 complete
**Parallelizable**: No (complex component)

---

### Task 5.4: Create Crew Entry Form Component
- [ ] Create file: `components/daily-reports/crew-entry-form.tsx`
- [ ] Implement client component for adding/editing crew entry
- [ ] Fields: trade (autocomplete), CSI division (dropdown), subcontractor (search)
- [ ] Fields: headcount (number input), hours_worked (number input), classification (dropdown)
- [ ] Fields: hourly_rate (optional, number), notes (textarea)
- [ ] Implement validation with Zod
- [ ] **Validation**: Test form submission, validation errors

**Dependencies**: Phase 3 complete
**Parallelizable**: Yes (parallel with Task 5.5-5.8)

---

### Task 5.5: Create Equipment Entry Form Component
- [ ] Create file: `components/daily-reports/equipment-entry-form.tsx`
- [ ] Implement client component for adding/editing equipment entry
- [ ] Fields: equipment_type (autocomplete), equipment_id (text), operator_name (text)
- [ ] Fields: hours_used (number), fuel_consumed (optional, number), rental_cost (optional, number)
- [ ] Fields: notes (textarea)
- [ ] Implement validation with Zod
- [ ] **Validation**: Test form submission, validation errors

**Dependencies**: Phase 3 complete
**Parallelizable**: Yes (parallel with Task 5.4, 5.6-5.8)

---

### Task 5.6: Create Material Entry Form Component
- [ ] Create file: `components/daily-reports/material-entry-form.tsx`
- [ ] Implement client component for adding/editing material entry
- [ ] Fields: material_description (text), supplier (text), quantity (number), unit (dropdown)
- [ ] Fields: delivery_time (time picker), delivery_ticket (text), location (text)
- [ ] Fields: notes (textarea)
- [ ] Implement validation with Zod
- [ ] **Validation**: Test form submission, validation errors

**Dependencies**: Phase 3 complete
**Parallelizable**: Yes (parallel with Task 5.4-5.5, 5.7-5.8)

---

### Task 5.7: Create Incident Entry Form Component
- [ ] Create file: `components/daily-reports/incident-entry-form.tsx`
- [ ] Implement client component for adding/editing incident
- [ ] Fields: incident_type (radio group), severity (radio group), time_occurred (time picker)
- [ ] Fields: description (textarea), involved_parties (text), corrective_action (textarea)
- [ ] Fields: reported_to (text), follow_up_required (checkbox), osha_recordable (checkbox)
- [ ] Show warning when osha_recordable is checked: "This will notify the safety manager"
- [ ] Implement validation with Zod
- [ ] **Validation**: Test form submission, validation errors

**Dependencies**: Phase 3 complete
**Parallelizable**: Yes (parallel with Task 5.4-5.6, 5.8)

---

### Task 5.8: Create Photo Gallery Component
- [ ] Create file: `components/daily-reports/photo-gallery.tsx`
- [ ] Implement client component for displaying photos
- [ ] Show thumbnail grid (200x200px thumbnails)
- [ ] Implement lazy loading for performance
- [ ] Click thumbnail opens lightbox modal (use shadcn/ui Dialog or similar)
- [ ] Lightbox features: prev/next navigation, zoom, download original, view EXIF data
- [ ] Show GPS map thumbnail if coordinates available
- [ ] Add description field below each thumbnail
- [ ] Implement bulk upload UI with progress indicators
- [ ] **Validation**: Test with 50 photos, verify lazy loading works
- [ ] **Validation**: Test lightbox navigation, zoom

**Dependencies**: Phase 4 complete
**Parallelizable**: Yes (parallel with Task 5.4-5.7)

---

### Task 5.9: Create Weather Display Component
- [ ] Create file: `components/daily-reports/weather-display.tsx`
- [ ] Implement client component for displaying weather conditions
- [ ] Show weather icon (sun, cloud, rain, snow, etc.) based on condition
- [ ] Display temperature range, precipitation, wind, humidity
- [ ] Show weather data source indicator: "Auto-fetched" or "Manually entered"
- [ ] Add "Edit Weather" button (if draft status) to toggle manual entry form
- [ ] **Validation**: Test with different weather conditions
- [ ] **Validation**: Test manual override

**Dependencies**: Phase 2 complete
**Parallelizable**: Yes

---

### Task 5.10: Create Calendar View Component
- [ ] Create file: `components/daily-reports/calendar-view.tsx`
- [ ] Implement client component for calendar display of daily reports
- [ ] Use a calendar library (e.g., react-day-picker or custom)
- [ ] Highlight days with reports (green), days without reports (gray)
- [ ] Show weather icon and crew count on each calendar day
- [ ] Click day navigates to report detail or prompts to create new report
- [ ] **Validation**: Test with full month of reports

**Dependencies**: Phase 3 complete
**Parallelizable**: Yes

---

## Phase 6: Export & Analytics (Days 13-14)

### Task 6.1: Create PDF Export Functionality
- [ ] Install npm package: `@react-pdf/renderer`
- [ ] Create file: `lib/pdf/daily-report-pdf.tsx`
- [ ] Implement PDF document component with sections:
  - Header: company logo, project name, report date
  - Weather: conditions, temperature, precipitation
  - Crew table: trade, headcount, hours, classification
  - Equipment table: type, hours, operator
  - Materials table: description, quantity, supplier
  - Incidents: type, severity, description, corrective action
  - Photos: thumbnail grid (max 12 per page)
  - Narrative: work summary, delays, visitors
  - Footer: submitted by, approved by, page numbers
- [ ] Create API route: `app/api/daily-reports/[id]/export/pdf/route.ts`
- [ ] Implement PDF generation with renderToStream
- [ ] Return PDF as downloadable file
- [ ] **Validation**: Test PDF generation with full report
- [ ] **Validation**: Verify PDF layout on printed page

**Dependencies**: Phase 3, 5 complete
**Parallelizable**: Yes (parallel with Task 6.2, 6.3)

---

### Task 6.2: Create QuickBooks Crew Hours Export
- [ ] Create file: `lib/export/quickbooks-crew-hours.ts`
- [ ] Implement `generateCrewHoursCSV(reportId)` function
- [ ] Format CSV in QuickBooks IIF format:
  - Header row: `!TIMEACT\tDATE\tJOB\tEMP\tITEM\tPITEM\tDURATION\tNOTE`
  - Data rows: one per crew entry with hours per worker
- [ ] Create API route: `app/api/daily-reports/[id]/export/quickbooks/route.ts`
- [ ] Return CSV as downloadable file
- [ ] **Validation**: Test CSV import into QuickBooks (manual test)

**Dependencies**: Phase 3 complete
**Parallelizable**: Yes (parallel with Task 6.1, 6.3)

---

### Task 6.3: Create Weather Analytics Dashboard
- [ ] Create file: `app/(dashboard)/[orgSlug]/projects/[projectId]/daily-reports/analytics/page.tsx`
- [ ] Implement server component: aggregate weather data across all reports
- [ ] Display charts:
  - Weather condition distribution (pie chart)
  - Temperature trends over time (line chart)
  - Rainy days vs clear days (bar chart)
  - Average crew hours by weather condition (bar chart)
  - Delay incidents correlated with weather (scatter plot)
- [ ] Use charting library: Recharts or similar
- [ ] **Validation**: Test with 60+ days of reports

**Dependencies**: Phase 3 complete
**Parallelizable**: Yes (parallel with Task 6.1, 6.2)

---

## Phase 7: Testing & Polish (Days 15-16)

### Task 7.1: Write Unit Tests for Server Actions
- [ ] Test all CRUD server actions (create, update, submit, approve, revert)
- [ ] Test all entry server actions (crew, equipment, material, incident)
- [ ] Test weather API client with mocked responses
- [ ] Test photo compression and EXIF extraction
- [ ] Achieve >80% code coverage for server actions
- [ ] **Validation**: Run `npm test` and verify all tests pass

**Dependencies**: Phase 3, 4 complete
**Parallelizable**: Yes

---

### Task 7.2: Write Integration Tests for RLS Policies
- [ ] Test daily reports RLS: users can only access reports in their projects
- [ ] Test entry RLS: entries inherit access from parent reports
- [ ] Test attachment RLS: users can only view attachments for accessible reports
- [ ] Test role-based permissions: managers can approve, admins can revert
- [ ] Use Supabase client with different user contexts
- [ ] **Validation**: Run SQL integration tests

**Dependencies**: Phase 1 complete
**Parallelizable**: Yes

---

### Task 7.3: Write E2E Tests for Critical Workflows
- [ ] Test: Create draft report → Add crew/equipment/materials → Upload photos → Submit
- [ ] Test: Copy from previous day → Modify entries → Submit
- [ ] Test: Submit report → Manager approves → Export PDF
- [ ] Test: Concurrent submissions for same date (one succeeds, others fail)
- [ ] Test: Filter reports by date range, status, weather
- [ ] Test: Search reports by keyword
- [ ] Use Playwright for E2E testing
- [ ] **Validation**: Run `npm run test:e2e` and verify all tests pass

**Dependencies**: Phase 5 complete
**Parallelizable**: Yes

---

### Task 7.4: Accessibility Audit
- [ ] Run axe-core or Lighthouse accessibility audit on all pages
- [ ] Fix keyboard navigation issues
- [ ] Add ARIA labels to all interactive elements
- [ ] Ensure form error messages are announced to screen readers
- [ ] Test with screen reader (VoiceOver or NVDA)
- [ ] **Validation**: Achieve Lighthouse accessibility score >90

**Dependencies**: Phase 5 complete
**Parallelizable**: Yes

---

### Task 7.5: Performance Optimization
- [ ] Optimize daily reports list query with proper indexes
- [ ] Implement pagination or infinite scroll for large report lists
- [ ] Lazy load photo thumbnails (use next/image with loading="lazy")
- [ ] Implement optimistic updates for entry additions/deletions
- [ ] Preload critical resources (fonts, icons)
- [ ] Run Lighthouse performance audit
- [ ] **Validation**: Achieve Lighthouse performance score >90
- [ ] **Validation**: List page loads in <1s for 100+ reports

**Dependencies**: Phase 5 complete
**Parallelizable**: Yes

---

### Task 7.6: User Documentation
- [ ] Write user guide: "How to Create a Daily Report"
- [ ] Write user guide: "How to Upload and Manage Photos"
- [ ] Write user guide: "How to Approve Daily Reports (Project Managers)"
- [ ] Write FAQ: Common issues and solutions
- [ ] Add tooltips and help text to complex form fields
- [ ] Create video walkthrough (optional, 5 minutes)
- [ ] **Validation**: Have a non-technical user follow the guide

**Dependencies**: Phase 5 complete
**Parallelizable**: Yes

---

### Task 7.7: Final QA and Bug Fixes
- [ ] Conduct manual QA testing with checklist of all features
- [ ] Test on multiple devices: desktop, tablet, mobile
- [ ] Test on multiple browsers: Chrome, Firefox, Safari, Edge
- [ ] Fix all critical and high-priority bugs
- [ ] Verify all acceptance criteria from proposal.md are met
- [ ] **Validation**: All acceptance criteria checked off

**Dependencies**: All phases complete
**Parallelizable**: No

---

## Deployment & Rollout (Day 17)

### Task 8.1: Run Database Migrations in Staging
- [ ] Deploy all migrations to staging environment
- [ ] Verify database schema matches design.md
- [ ] Seed staging with sample data (10+ daily reports with all entry types)
- [ ] **Validation**: Run `npm run db:status` and verify migrations applied

**Dependencies**: Phase 1 complete
**Parallelizable**: No

---

### Task 8.2: Deploy Application to Staging
- [ ] Deploy application code to staging environment (Vercel preview)
- [ ] Set environment variables: `OPENWEATHER_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, etc.
- [ ] Test all features in staging with real users
- [ ] **Validation**: Smoke test all critical workflows

**Dependencies**: All phases complete, Task 8.1 complete
**Parallelizable**: No

---

### Task 8.3: Run Database Migrations in Production
- [ ] Schedule maintenance window (off-hours, low traffic)
- [ ] Deploy all migrations to production environment
- [ ] Verify database schema
- [ ] Monitor for errors or performance issues
- [ ] **Validation**: Run `npm run db:status` in production

**Dependencies**: Task 8.2 complete, staging testing successful
**Parallelizable**: No

---

### Task 8.4: Deploy Application to Production
- [ ] Deploy application code to production environment
- [ ] Enable feature flag `ENABLE_DAILY_REPORTS=true` for pilot projects
- [ ] Monitor error rates, performance metrics via Sentry
- [ ] Gradually enable for all projects over 1 week
- [ ] **Validation**: Monitor Sentry for errors, PostHog for usage metrics

**Dependencies**: Task 8.3 complete
**Parallelizable**: No

---

### Task 8.5: User Announcement and Training
- [ ] Send email announcement to all users: "Daily Reports Now Available"
- [ ] Publish user documentation on help center
- [ ] Host live training webinar for field supervisors and project managers
- [ ] Provide in-app banner with link to video walkthrough
- [ ] **Validation**: Track adoption rate (PostHog analytics)

**Dependencies**: Task 8.4 complete
**Parallelizable**: Yes

---

## Success Criteria

- [ ] Field supervisors can create draft daily reports in <5 minutes
- [ ] Only one submitted/approved report allowed per project per date
- [ ] Weather data is automatically fetched and cached
- [ ] Photos are compressed to <500KB before upload
- [ ] EXIF GPS coordinates displayed on map
- [ ] Daily reports list loads in <1s for 100+ reports
- [ ] PDF export includes all report data and photos
- [ ] QuickBooks CSV export format matches IIF specification
- [ ] >80% code coverage on server actions
- [ ] All E2E tests pass
- [ ] Lighthouse scores: Performance >90, Accessibility >90
- [ ] >90% same-day report submission rate (measured via PostHog)

---

**Total Estimated Tasks**: 95 tasks
**Total Estimated Duration**: 16-17 days (2 weeks with parallelization)
