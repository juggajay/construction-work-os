# Implementation Tasks: RFI Module

**Change ID**: `add-rfi-module`
**Status**: Proposed
**Estimated Duration**: 2 weeks (Weeks 5-6)

---

## Phase 1: Database Foundation (Days 1-2)

### Task 1.1: Create RFI Core Schema Migration
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_rfis_table.sql`
- [ ] Define `rfis` table with all columns from design.md
- [ ] Add CHECK constraint for status enum validation
- [ ] Add CHECK constraint for assignment validation (user XOR org)
- [ ] Create GIN index on `search_vector` for full-text search
- [ ] Create index on `project_id, number` for uniqueness
- [ ] Create index on `assigned_to_id` for assignee queries
- [ ] Create index on `status, response_due_date` for overdue detection
- [ ] Add trigger for `updated_at` auto-update
- [ ] **Validation**: Run `npm run db:reset` and verify table created
- [ ] **Validation**: Check indexes with `\d rfis` in psql

**Dependencies**: Foundation database schema must exist
**Parallelizable**: Can run in parallel with Task 1.2

---

### Task 1.2: Create RFI Responses Schema Migration
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_rfi_responses_table.sql`
- [ ] Define `rfi_responses` table with rfi_id FK
- [ ] Add `is_official_answer` boolean for answer tracking
- [ ] Create index on `rfi_id, created_at` for response threads
- [ ] Add trigger for `updated_at` auto-update
- [ ] **Validation**: Run `npm run db:reset` and verify table created

**Dependencies**: Task 1.1 must be complete (FK to rfis)
**Parallelizable**: No

---

### Task 1.3: Create RFI Attachments Schema Migration
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_rfi_attachments_table.sql`
- [ ] Define `rfi_attachments` table with rfi_id and response_id FKs
- [ ] Add columns: file_path, file_name, file_size, file_type, uploaded_by
- [ ] Create index on `rfi_id` for attachment queries
- [ ] Add trigger for `updated_at` auto-update
- [ ] **Validation**: Run `npm run db:reset` and verify table created

**Dependencies**: Task 1.1 and 1.2 must be complete (FKs)
**Parallelizable**: No

---

### Task 1.4: Create Sequential Numbering Function
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_next_rfi_number_function.sql`
- [ ] Implement `next_rfi_number(project_id UUID)` function from design.md
- [ ] Mark function as SECURITY DEFINER
- [ ] Add locking mechanism to prevent race conditions
- [ ] **Validation**: Test function with `SELECT next_rfi_number('test-uuid');`
- [ ] **Validation**: Create concurrent requests to verify no duplicates

**Dependencies**: Task 1.1 must be complete
**Parallelizable**: No

---

### Task 1.5: Create RLS Policies for RFIs
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_rfi_rls_policies.sql`
- [ ] Enable RLS on `rfis` table
- [ ] Create policy: "Users can view RFIs in accessible projects" (SELECT)
- [ ] Create policy: "Project managers can create RFIs" (INSERT)
- [ ] Create policy: "Creators and assignees can update draft RFIs" (UPDATE)
- [ ] Create policy: "Admins can soft-delete RFIs" (DELETE)
- [ ] **Validation**: Test with different user roles via SQL queries
- [ ] **Validation**: Verify unauthorized users cannot access RFIs

**Dependencies**: Task 1.1 complete, `user_project_ids()` helper exists
**Parallelizable**: Can run in parallel with Task 1.6, 1.7

---

### Task 1.6: Create RLS Policies for RFI Responses
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_rfi_responses_rls_policies.sql`
- [ ] Enable RLS on `rfi_responses` table
- [ ] Create policy: "Users can view responses in accessible RFIs" (SELECT)
- [ ] Create policy: "Assignees can create responses" (INSERT)
- [ ] Create policy: "Response authors can update within 15 min" (UPDATE)
- [ ] **Validation**: Test response creation with different user roles

**Dependencies**: Task 1.2 complete
**Parallelizable**: Yes (parallel with Task 1.5, 1.7)

---

### Task 1.7: Create RLS Policies for RFI Attachments
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_rfi_attachments_rls_policies.sql`
- [ ] Enable RLS on `rfi_attachments` table
- [ ] Create policy: "Users can view attachments in accessible RFIs" (SELECT)
- [ ] Create policy: "Users can upload attachments to accessible RFIs" (INSERT)
- [ ] Create policy: "Uploaders can delete attachments from draft RFIs" (DELETE)
- [ ] **Validation**: Test attachment access with different user roles

**Dependencies**: Task 1.3 complete
**Parallelizable**: Yes (parallel with Task 1.5, 1.6)

---

### Task 1.8: Create Audit Log Triggers
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_rfi_audit_triggers.sql`
- [ ] Create trigger for `rfis` INSERT/UPDATE/DELETE
- [ ] Create trigger for `rfi_responses` INSERT/UPDATE/DELETE
- [ ] Create trigger for `rfi_attachments` INSERT/UPDATE/DELETE
- [ ] Log: action type, user_id, timestamp, old/new values
- [ ] **Validation**: Perform mutations and verify audit log entries

**Dependencies**: Tasks 1.1, 1.2, 1.3 complete, audit_logs table exists
**Parallelizable**: No

---

### Task 1.9: Generate TypeScript Types from Schema
- [ ] Run `npm run db:types` to generate types
- [ ] Verify types in `types/supabase.ts` include RFI tables
- [ ] Create type guards for RFI status enum
- [ ] **Validation**: TypeScript build succeeds with new types

**Dependencies**: Tasks 1.1-1.8 complete
**Parallelizable**: No

---

## Phase 2: Server Actions & Business Logic (Days 3-5)

### Task 2.1: Create RFI Server Action - createRFI
- [ ] Create file: `app/actions/rfis/create-rfi.ts`
- [ ] Implement validation: title required, project access check
- [ ] Call `next_rfi_number()` to generate RFI number
- [ ] Insert into `rfis` table with status "draft"
- [ ] Return RFI object or error
- [ ] **Validation**: Write unit test for createRFI
- [ ] **Validation**: Test with missing title (should fail)

**Dependencies**: Task 1.1-1.9 complete
**Parallelizable**: Yes (parallel with Tasks 2.2-2.6)

---

### Task 2.2: Create RFI Server Action - updateRFI
- [ ] Create file: `app/actions/rfis/update-rfi.ts`
- [ ] Implement validation: only draft RFIs can be edited
- [ ] Check user is creator or admin
- [ ] Update `rfis` table
- [ ] **Validation**: Write unit test for updateRFI
- [ ] **Validation**: Test updating submitted RFI (should fail)

**Dependencies**: Task 1.1-1.9 complete
**Parallelizable**: Yes (parallel with Tasks 2.1, 2.3-2.6)

---

### Task 2.3: Create RFI Server Action - submitRFI
- [ ] Create file: `app/actions/rfis/submit-rfi.ts`
- [ ] Validate assignee is set
- [ ] Update status from "draft" to "submitted"
- [ ] Set `submitted_at` timestamp
- [ ] Trigger email notification to assignee (Task 3.2)
- [ ] **Validation**: Write unit test for submitRFI
- [ ] **Validation**: Test submitting without assignee (should fail)

**Dependencies**: Task 1.1-1.9 complete
**Parallelizable**: Yes (parallel with Tasks 2.1-2.2, 2.4-2.6)

---

### Task 2.4: Create RFI Server Action - assignRFI
- [ ] Create file: `app/actions/rfis/assign-rfi.ts`
- [ ] Validate user XOR org assignment
- [ ] Update `assigned_to_id` or `assigned_to_org`
- [ ] Log assignment change in audit log
- [ ] Trigger email notification if submitted (Task 3.2)
- [ ] **Validation**: Write unit test for assignRFI
- [ ] **Validation**: Test assigning to both user and org (should fail)

**Dependencies**: Task 1.1-1.9 complete
**Parallelizable**: Yes (parallel with Tasks 2.1-2.3, 2.5-2.6)

---

### Task 2.5: Create RFI Server Action - addResponse
- [ ] Create file: `app/actions/rfis/add-response.ts`
- [ ] Validate user is assignee or creator
- [ ] Insert into `rfi_responses` table
- [ ] If `is_official_answer`, update RFI status to "answered" and set `answered_at`
- [ ] Trigger email notification to creator (Task 3.2)
- [ ] **Validation**: Write unit test for addResponse
- [ ] **Validation**: Test unauthorized user adding response (should fail)

**Dependencies**: Task 1.2, 1.9 complete
**Parallelizable**: Yes (parallel with Tasks 2.1-2.4, 2.6)

---

### Task 2.6: Create RFI Server Action - closeRFI
- [ ] Create file: `app/actions/rfis/close-rfi.ts`
- [ ] Validate RFI has official answer (status "answered")
- [ ] Validate user is creator or admin
- [ ] Update status to "closed" and set `closed_at`
- [ ] Clear ball-in-court (set assigned_to_id to null)
- [ ] **Validation**: Write unit test for closeRFI
- [ ] **Validation**: Test closing unanswered RFI (should fail)

**Dependencies**: Task 1.1-1.9 complete
**Parallelizable**: Yes (parallel with Tasks 2.1-2.5)

---

### Task 2.7: Create RFI Server Action - uploadAttachment
- [ ] Create file: `app/actions/rfis/upload-attachment.ts`
- [ ] Validate file size (<10 MB)
- [ ] Validate MIME type (PDF, JPG, PNG, DOCX, XLSX)
- [ ] Upload to Supabase Storage: `/rfis/{project_id}/{rfi_id}/{filename}`
- [ ] Insert into `rfi_attachments` table with metadata
- [ ] **Validation**: Write unit test for uploadAttachment
- [ ] **Validation**: Test uploading 50MB file (should fail)
- [ ] **Validation**: Test uploading .exe file (should fail)

**Dependencies**: Task 1.3, 1.9 complete, Supabase Storage bucket exists
**Parallelizable**: Yes (parallel with Tasks 2.1-2.6, 2.8)

---

### Task 2.8: Create RFI Server Action - deleteAttachment
- [ ] Create file: `app/actions/rfis/delete-attachment.ts`
- [ ] Validate RFI is in draft status
- [ ] Validate user is uploader
- [ ] Delete file from Supabase Storage
- [ ] Delete record from `rfi_attachments` table
- [ ] **Validation**: Write unit test for deleteAttachment
- [ ] **Validation**: Test deleting from submitted RFI (should fail)

**Dependencies**: Task 1.3, 1.9 complete
**Parallelizable**: Yes (parallel with Tasks 2.1-2.7)

---

### Task 2.9: Create Ball-in-Court Calculation Utility
- [ ] Create file: `lib/rfis/ball-in-court.ts`
- [ ] Implement `getBallInCourt(rfi)` function
- [ ] Return assignee for "submitted", creator for "answered", null for "closed"
- [ ] Include suggested actions per status
- [ ] **Validation**: Write unit tests for all status scenarios

**Dependencies**: Task 1.9 complete (types)
**Parallelizable**: Yes (parallel with all Task 2.x)

---

### Task 2.10: Create SLA Calculation Utility
- [ ] Create file: `lib/rfis/sla-calculations.ts`
- [ ] Implement `isOverdue(rfi)` function
- [ ] Implement `calculateResponseTime(rfi)` function
- [ ] Implement `getSLACompliance(rfis[])` function
- [ ] **Validation**: Write unit tests with mock data

**Dependencies**: Task 1.9 complete
**Parallelizable**: Yes (parallel with all Task 2.x)

---

## Phase 3: Email Integration (Days 4-5, parallel with Task 2.x)

### Task 3.1: Set Up SendGrid Account and API Key
- [x] Create SendGrid account (or use existing)
- [x] Generate API key with send permissions
- [x] Add `SENDGRID_API_KEY` to `.env.local`
- [x] Add `SENDGRID_FROM_EMAIL` to `.env.local`
- [x] **Validation**: Send test email via SendGrid API

**Dependencies**: None
**Parallelizable**: Yes

---

### Task 3.2: Create Email Service - Assignment Notification
- [x] Create file: `lib/email/templates/rfi-assignment.tsx`
- [x] Design email template with RFI title, description, assignor, due date
- [x] Include "View RFI" CTA link
- [x] Create file: `lib/email/send-rfi-assignment.ts`
- [x] Integrate with SendGrid API
- [x] **Validation**: Send test email and verify rendering

**Dependencies**: Task 3.1 complete
**Parallelizable**: Yes (parallel with Task 3.3-3.5)

---

### Task 3.3: Create Email Service - Response Notification
- [x] Create file: `lib/email/templates/rfi-response.tsx`
- [x] Design email template with response text, responder name
- [x] Include "View RFI" CTA link
- [x] Create file: `lib/email/send-rfi-response.ts`
- [x] Integrate with SendGrid API
- [x] **Validation**: Send test email and verify rendering

**Dependencies**: Task 3.1 complete
**Parallelizable**: Yes (parallel with Task 3.2, 3.4-3.5)

---

### Task 3.4: Create Email Service - Overdue Alert
- [x] Create file: `lib/email/templates/rfi-overdue.tsx`
- [x] Design email template with overdue RFIs list, days overdue
- [x] Include "View RFI" CTA links
- [x] Create file: `lib/email/send-rfi-overdue.ts`
- [x] Integrate with SendGrid API
- [x] **Validation**: Send test email with multiple overdue RFIs

**Dependencies**: Task 3.1 complete
**Parallelizable**: Yes (parallel with Task 3.2-3.3, 3.5)

---

### Task 3.5: Create Cron Job - Daily Overdue Digest
- [x] Create file: `app/api/cron/rfi-overdue-digest/route.ts`
- [x] Query all overdue RFIs grouped by assignee
- [x] Send email to each assignee with their overdue list
- [x] Send project manager digest with all project overdue RFIs
- [x] **Validation**: Trigger cron manually and verify emails sent
- [x] **Validation**: Set up Vercel Cron or similar for production

**Dependencies**: Task 3.4, 2.10 complete
**Parallelizable**: No

---

## Phase 4: UI Components (Days 6-8)

### Task 4.1: Create RFI List Page Component
- [x] Create file: `app/(app)/projects/[projectId]/rfis/page.tsx`
- [x] Fetch RFIs via Supabase query with React Query
- [x] Display table with columns: Number, Title, Status, Assignee, Due Date
- [x] Add filters: status, assignee, overdue
- [x] Add search input for title/number
- [x] Add "Create RFI" button
- [x] **Validation**: Render with mock data, verify filters work

**Dependencies**: Task 2.1-2.10 complete
**Parallelizable**: Yes (parallel with Task 4.2-4.6)

---

### Task 4.2: Create RFI Detail Page Component
- [x] Create file: `app/(app)/projects/[projectId]/rfis/[rfiId]/page.tsx`
- [x] Fetch RFI with responses and attachments via Supabase query
- [x] Display RFI header with number, title, status, metadata
- [x] Display ball-in-court indicator (Task 2.9)
- [x] Display responses thread in chronological order
- [x] Display attachments list with download links
- [x] Display status timeline
- [x] **Validation**: Render with mock RFI data

**Dependencies**: Task 2.1-2.10 complete
**Parallelizable**: Yes (parallel with Task 4.1, 4.3-4.6)

---

### Task 4.3: Create RFI Create/Edit Form Component
- [x] Create file: `components/rfis/rfi-form.tsx`
- [x] Add fields: title, description, discipline, spec_section, drawing_reference
- [x] Add assignee selector (users + orgs)
- [x] Add response_due_date picker
- [x] Add priority selector
- [x] Integrate with createRFI/updateRFI actions (Task 2.1, 2.2)
- [x] **Validation**: Submit form and verify RFI created

**Dependencies**: Task 2.1, 2.2 complete
**Parallelizable**: Yes (parallel with Task 4.1-4.2, 4.4-4.6)

---

### Task 4.4: Create Response Form Component
- [x] Create file: `components/rfis/response-form.tsx`
- [x] Add textarea for response text
- [x] Add checkbox: "This is the official answer"
- [x] Add file upload for response attachments (Task 2.7)
- [x] Integrate with addResponse action (Task 2.5)
- [x] **Validation**: Submit response and verify it appears in thread

**Dependencies**: Task 2.5, 2.7 complete
**Parallelizable**: Yes (parallel with Task 4.1-4.3, 4.5-4.6)

---

### Task 4.5: Create File Upload Component
- [x] Create file: `components/rfis/file-upload.tsx`
- [x] Add drag-and-drop zone
- [x] Add file picker
- [x] Show upload progress
- [x] Show file list with delete button (draft only)
- [x] Client-side validation: file size, MIME type
- [x] Integrate with uploadAttachment/deleteAttachment (Task 2.7, 2.8)
- [x] **Validation**: Upload file and verify storage + database record

**Dependencies**: Task 2.7, 2.8 complete
**Parallelizable**: Yes (parallel with Task 4.1-4.4, 4.6)

---

### Task 4.6: Create RFI Status Badge Component
- [x] Create file: `components/rfis/rfi-status-badge.tsx`
- [x] Design badges for each status: draft, submitted, under_review, answered, closed, cancelled
- [x] Color-code by status (draft: gray, submitted: blue, overdue: red, closed: green)
- [x] Show "Overdue" badge if past due date
- [x] **Validation**: Render with all status variants

**Dependencies**: Task 1.9 complete (types)
**Parallelizable**: Yes (parallel with all Task 4.x)

---

### Task 4.7: Create RFI Dashboard Widget Component
- [x] Create file: `components/projects/rfi-dashboard-widget.tsx`
- [x] Query RFI summary: total, open, overdue, closed counts
- [x] Display as summary card with badges
- [x] Show "Recent RFI Activity" (last 3 events)
- [x] Add "View All RFIs" link
- [x] Integrate into project dashboard page
- [x] **Validation**: Render with mock project data

**Dependencies**: Task 2.1-2.10 complete
**Parallelizable**: Yes (parallel with Task 4.1-4.6)

---

## Phase 5: Analytics & Reporting (Days 9-10)

### Task 5.1: Create RFI Analytics Page
- [ ] Create file: `app/(app)/projects/[projectId]/rfis/analytics/page.tsx`
- [ ] Display SLA compliance rate with trend chart (Recharts)
- [ ] Display average response time by discipline (bar chart)
- [ ] Display top assignees table (name, count, avg response, SLA %)
- [ ] Display RFI volume trend chart (line chart by month)
- [ ] Display status distribution pie chart
- [ ] Add date range filter
- [ ] **Validation**: Render with mock analytics data

**Dependencies**: Task 2.10 complete
**Parallelizable**: Yes (parallel with Task 5.2-5.4)

---

### Task 5.2: Create CSV Export Utility
- [ ] Create file: `lib/rfis/export-csv.ts`
- [ ] Implement `exportRFIsToCSV(rfis[])` function
- [ ] Include all columns from spec (Number, Title, Status, Assignee, Dates, etc.)
- [ ] Generate filename: `RFIs-{project-name}-{date}.csv`
- [ ] Trigger browser download
- [ ] **Validation**: Export 100 RFIs and verify CSV format

**Dependencies**: Task 1.9 complete
**Parallelizable**: Yes (parallel with Task 5.1, 5.3-5.4)

---

### Task 5.3: Create QuickBooks Export Utility
- [ ] Create file: `lib/rfis/export-quickbooks.ts`
- [ ] Implement `exportRFIsToQuickBooks(rfis[])` function
- [ ] Format CSV columns: Date, Description, Amount, Account, Memo
- [ ] Only include RFIs with cost_impact values
- [ ] Generate filename: `RFIs-QuickBooks-{project-name}-{date}.csv`
- [ ] **Validation**: Export and verify QuickBooks CSV format

**Dependencies**: Task 1.9 complete
**Parallelizable**: Yes (parallel with Task 5.1-5.2, 5.4)

---

### Task 5.4: Create Overdue RFI Dashboard Page
- [ ] Create file: `app/(app)/projects/[projectId]/rfis/overdue/page.tsx`
- [ ] Query all overdue RFIs for project
- [ ] Display table: Number, Title, Assignee, Days Overdue
- [ ] Sort by days overdue (most overdue first)
- [ ] Add "Send Reminder" button per RFI
- [ ] Add "Send Reminders to All" bulk action
- [ ] **Validation**: Render with mock overdue RFIs

**Dependencies**: Task 2.10 complete
**Parallelizable**: Yes (parallel with Task 5.1-5.3)

---

## Phase 6: Testing (Days 11-12)

### Task 6.1: Write Unit Tests for Server Actions
- [ ] Create test file: `__tests__/actions/rfis/create-rfi.test.ts`
- [ ] Test createRFI with valid/invalid inputs
- [ ] Test sequential numbering
- [ ] Repeat for all server actions (Tasks 2.1-2.8)
- [ ] **Validation**: Run `npm test` and achieve >80% coverage

**Dependencies**: Task 2.1-2.8 complete
**Parallelizable**: Yes (parallel with Task 6.2-6.3)

---

### Task 6.2: Write Integration Tests for RFI Workflow
- [ ] Create test file: `__tests__/integration/rfi-lifecycle.test.ts`
- [ ] Test full workflow: create draft → submit → respond → answer → close
- [ ] Test reassignment workflow
- [ ] Test overdue detection
- [ ] Test RLS policies with different user roles
- [ ] **Validation**: Run integration tests against local Supabase

**Dependencies**: Task 2.1-2.8 complete
**Parallelizable**: Yes (parallel with Task 6.1, 6.3)

---

### Task 6.3: Write E2E Tests for RFI UI
- [ ] Create test file: `e2e/rfis/rfi-crud.spec.ts` (Playwright)
- [ ] Test: Create RFI → View list → Click detail → Submit
- [ ] Test: Filter RFIs by status
- [ ] Test: Search RFIs by keyword
- [ ] Test: Upload attachment → Download
- [ ] Test: Add response → Close RFI
- [ ] **Validation**: Run `npm run test:e2e` and verify all pass

**Dependencies**: Task 4.1-4.7 complete
**Parallelizable**: Yes (parallel with Task 6.1-6.2)

---

## Phase 7: Documentation & Deployment (Days 13-14)

### Task 7.1: Update API Documentation
- [ ] Document all server actions in `docs/api/rfis.md`
- [ ] Include request/response schemas
- [ ] Include example usage
- [ ] Document error codes
- [ ] **Validation**: Peer review documentation

**Dependencies**: Task 2.1-2.8 complete
**Parallelizable**: Yes (parallel with Task 7.2-7.3)

---

### Task 7.2: Update User Documentation
- [ ] Create user guide: `docs/user-guides/rfis.md`
- [ ] Include screenshots of RFI list, detail, create form
- [ ] Document RFI workflow (draft → submitted → answered → closed)
- [ ] Document best practices for SLA management
- [ ] **Validation**: User acceptance testing with stakeholders

**Dependencies**: Task 4.1-4.7 complete
**Parallelizable**: Yes (parallel with Task 7.1, 7.3)

---

### Task 7.3: Deploy to Staging and Production
- [ ] Run `npm run db:migrate` on staging database
- [ ] Deploy Next.js app to Vercel staging
- [ ] Run smoke tests on staging
- [ ] Create Supabase Storage bucket: `rfis` (production)
- [ ] Run `npm run db:migrate` on production database
- [ ] Deploy to production
- [ ] Monitor error logs for 24 hours
- [ ] **Validation**: Create test RFI in production

**Dependencies**: All tasks complete
**Parallelizable**: No (sequential staging → production)

---

## Success Criteria

- [ ] All database migrations applied without errors
- [ ] All RLS policies prevent unauthorized access
- [ ] All server actions have >80% unit test coverage
- [ ] All E2E tests pass in CI/CD pipeline
- [ ] RFI creation, submission, response, closure workflow works end-to-end
- [ ] Email notifications sent for assignments, responses, overdue alerts
- [ ] Analytics dashboard shows SLA compliance, response times, top assignees
- [ ] CSV export includes all required columns
- [ ] File uploads limited to 10MB and allowed MIME types
- [ ] Sequential RFI numbering has no conflicts under concurrent load
- [ ] User documentation complete and reviewed

---

## Rollback Plan

If critical issues are discovered after deployment:

1. **Database Rollback**: Revert migrations via Supabase dashboard (restore snapshot)
2. **Code Rollback**: Revert to previous Git commit and redeploy
3. **Feature Flag**: Disable RFI module access via environment variable `ENABLE_RFI_MODULE=false`
4. **Data Preservation**: All RFI data is soft-deleted, can be recovered

---

## Estimated Effort

- **Phase 1 (Database)**: 2 days
- **Phase 2 (Server Actions)**: 3 days
- **Phase 3 (Email)**: 2 days (parallel with Phase 2)
- **Phase 4 (UI)**: 3 days
- **Phase 5 (Analytics)**: 2 days
- **Phase 6 (Testing)**: 2 days
- **Phase 7 (Docs/Deploy)**: 2 days

**Total**: 14 days (2 weeks with some parallel work)

---

## Notes

- Tasks marked "Parallelizable: Yes" can be worked on concurrently by multiple developers
- Validation steps must pass before moving to dependent tasks
- All tests must be green before deployment (Phase 7.3)
- Email integration (Phase 3) can proceed in parallel with Server Actions (Phase 2)
- UI components (Phase 4) depend on Server Actions (Phase 2) being complete
