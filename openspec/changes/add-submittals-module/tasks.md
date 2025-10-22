# Implementation Tasks: Submittals Module

**Change ID**: `add-submittals-module`
**Status**: Proposed
**Estimated Duration**: 3-4 weeks (Weeks 7-10)

---

## Phase 1: Database Foundation & CSI Reference Data (Days 1-3)

### Task 1.1: Import CSI MasterFormat Reference Data
- [ ] Download CSI MasterFormat spec section list (Divisions 00-49)
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_csi_spec_sections_table.sql`
- [ ] Define `csi_spec_sections` table with section_code, section_title, division columns
- [ ] Create GIN index for full-text search on section titles
- [ ] Create seed data file with all CSI sections
- [ ] **Validation**: Run `npm run db:reset` and verify 500+ CSI sections imported
- [ ] **Validation**: Query sections by division to verify hierarchy

**Dependencies**: None
**Parallelizable**: Can run in parallel with Task 1.2

---

### Task 1.2: Create Submittals Core Schema Migration
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_submittals_table.sql`
- [ ] Define `submittal_type` enum (product_data, shop_drawings, samples, mixed)
- [ ] Define `submittal_status` enum (draft, submitted, gc_review, ae_review, owner_review, approved, approved_as_noted, revise_resubmit, rejected, cancelled)
- [ ] Define `review_stage` enum (draft, gc_review, ae_review, owner_review, complete)
- [ ] Define `submittals` table with all columns from design.md
- [ ] Add CHECK constraints for status, lead_time_days, version_number
- [ ] Create UNIQUE constraint on (project_id, spec_section, number)
- [ ] Create generated column for `procurement_deadline` calculation
- [ ] Create GIN index on search vector (title + description)
- [ ] Create indexes on: project_id, status, current_stage, spec_section, current_reviewer_id, procurement_deadline, parent_submittal_id
- [ ] Add trigger for `updated_at` auto-update
- [ ] **Validation**: Run `npm run db:reset` and verify table created
- [ ] **Validation**: Check indexes with `\d submittals` in psql
- [ ] **Validation**: Test procurement_deadline calculation with sample data

**Dependencies**: None
**Parallelizable**: Can run in parallel with Task 1.1

---

### Task 1.3: Create Submittal Reviews Schema Migration
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_submittal_reviews_table.sql`
- [ ] Define `review_action` enum (approved, approved_as_noted, revise_resubmit, rejected, forwarded)
- [ ] Define `submittal_reviews` table with submittal_id FK
- [ ] Add columns: version_number, stage, reviewer_id, action, comments, reviewed_at
- [ ] Create indexes on: submittal_id, (submittal_id, stage, version_number), reviewer_id
- [ ] Add audit logging trigger
- [ ] **Validation**: Run `npm run db:reset` and verify table created

**Dependencies**: Task 1.2 must be complete (FK to submittals)
**Parallelizable**: No

---

### Task 1.4: Create Submittal Versions Schema Migration
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_submittal_versions_table.sql`
- [ ] Define `submittal_versions` table with submittal_id FK
- [ ] Add columns: version, version_number, uploaded_by, uploaded_at, notes
- [ ] Add UNIQUE constraint on (submittal_id, version_number)
- [ ] Create indexes on: submittal_id, (submittal_id, version_number)
- [ ] **Validation**: Run `npm run db:reset` and verify table created

**Dependencies**: Task 1.2 must be complete
**Parallelizable**: Can run in parallel with Task 1.3

---

### Task 1.5: Create Submittal Attachments Schema Migration
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_submittal_attachments_table.sql`
- [ ] Define `attachment_type` enum (product_data, shop_drawing, sample_photo, specification, other)
- [ ] Define `submittal_attachments` table with submittal_id FK
- [ ] Add columns: version_number, file_path, file_name, file_size, file_type, attachment_type, uploaded_by
- [ ] Create indexes on: submittal_id, (submittal_id, version_number), attachment_type
- [ ] **Validation**: Run `npm run db:reset` and verify table created

**Dependencies**: Task 1.2 must be complete
**Parallelizable**: Can run in parallel with Task 1.3, 1.4

---

### Task 1.6: Create Sequential Numbering Function per Spec Section
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_next_submittal_number_function.sql`
- [ ] Implement `next_submittal_number(project_id UUID, spec_section TEXT)` function
- [ ] Format as: "{spec_section}-{###}" (e.g., "03 30 00-001")
- [ ] Mark function as SECURITY DEFINER
- [ ] Add locking mechanism (`FOR UPDATE`) to prevent race conditions
- [ ] **Validation**: Test function with `SELECT next_submittal_number('test-uuid', '03 30 00');`
- [ ] **Validation**: Create concurrent requests to verify no duplicate numbers
- [ ] **Validation**: Test with different spec sections to verify independent numbering

**Dependencies**: Task 1.2 must be complete
**Parallelizable**: No

---

### Task 1.7: Create RLS Policies for Submittals
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_submittal_rls_policies.sql`
- [ ] Enable RLS on `submittals` table
- [ ] Create policy: "Users can view submittals in accessible projects" (SELECT)
- [ ] Create policy: "Users can create submittals in accessible projects" (INSERT with created_by check)
- [ ] Create policy: "Creators can update drafts, reviewers can update assigned submittals" (UPDATE)
- [ ] Create policy: "Admins can soft-delete submittals" (DELETE)
- [ ] **Validation**: Test with different user roles via SQL queries
- [ ] **Validation**: Verify unauthorized users cannot access submittals from other projects
- [ ] **Validation**: Test creator can update draft, but not submitted submittals

**Dependencies**: Task 1.2 complete, `user_project_ids()` helper exists
**Parallelizable**: Can run in parallel with Task 1.8, 1.9, 1.10

---

### Task 1.8: Create RLS Policies for Submittal Reviews
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_submittal_reviews_rls_policies.sql`
- [ ] Enable RLS on `submittal_reviews` table
- [ ] Create policy: "Users can view reviews in accessible projects" (SELECT via submittal.project_id)
- [ ] Create policy: "Current reviewer can create reviews" (INSERT with reviewer_id check)
- [ ] **Validation**: Test review creation with different user roles
- [ ] **Validation**: Verify non-reviewer cannot create reviews

**Dependencies**: Task 1.3 complete
**Parallelizable**: Yes (parallel with Task 1.7, 1.9, 1.10)

---

### Task 1.9: Create RLS Policies for Submittal Versions
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_submittal_versions_rls_policies.sql`
- [ ] Enable RLS on `submittal_versions` table
- [ ] Create policy: "Users can view versions in accessible projects" (SELECT via submittal.project_id)
- [ ] Create policy: "Creators can create version records" (INSERT)
- [ ] **Validation**: Test version history access

**Dependencies**: Task 1.4 complete
**Parallelizable**: Yes (parallel with Task 1.7, 1.8, 1.10)

---

### Task 1.10: Create RLS Policies for Submittal Attachments
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_submittal_attachments_rls_policies.sql`
- [ ] Enable RLS on `submittal_attachments` table
- [ ] Create policy: "Users can view attachments in accessible projects" (SELECT via submittal.project_id)
- [ ] Create policy: "Users can upload attachments to accessible submittals" (INSERT)
- [ ] Create policy: "Creators can delete attachments from draft submittals" (DELETE)
- [ ] **Validation**: Test attachment upload with different user roles
- [ ] **Validation**: Verify cannot delete attachments from submitted submittals

**Dependencies**: Task 1.5 complete
**Parallelizable**: Yes (parallel with Task 1.7, 1.8, 1.9)

---

## Phase 2: Backend Server Actions (Days 4-7)

### Task 2.1: Implement createSubmittal Server Action
- [ ] Create file: `lib/actions/submittals/create-submittal.ts`
- [ ] Define `CreateSubmittalInput` Zod schema
- [ ] Implement validation: projectId, title, spec_section, submittal_type required
- [ ] Call `next_submittal_number()` function to generate number
- [ ] Insert submittal record with status = 'draft', version = 'Rev 0', version_number = 0
- [ ] Return created submittal with full metadata
- [ ] **Validation**: Write unit test for successful creation
- [ ] **Validation**: Write unit test for validation errors
- [ ] **Validation**: Test sequential numbering per spec section

**Dependencies**: Phase 1 database tasks complete
**Parallelizable**: Can run in parallel with Task 2.2, 2.3

---

### Task 2.2: Implement updateSubmittal Server Action
- [ ] Create file: `lib/actions/submittals/update-submittal.ts`
- [ ] Define `UpdateSubmittalInput` Zod schema
- [ ] Implement permission check: creator can update drafts, reviewer can update assigned
- [ ] Allow updates to: title, description, required_on_site, lead_time_days
- [ ] Recalculate procurement_deadline if dates change
- [ ] **Validation**: Test creator can update draft
- [ ] **Validation**: Test cannot update submitted submittal without permissions
- [ ] **Validation**: Test procurement_deadline recalculates correctly

**Dependencies**: Phase 1 complete, Task 2.1 helpful but not required
**Parallelizable**: Yes (parallel with Task 2.1, 2.3)

---

### Task 2.3: Implement submitForReview Server Action
- [ ] Create file: `lib/actions/submittals/submit-for-review.ts`
- [ ] Define `SubmitForReviewInput` Zod schema (submittalId, reviewerId)
- [ ] Validate submittal is in 'draft' status
- [ ] Validate at least one attachment exists
- [ ] Update status to 'submitted', current_stage to 'gc_review'
- [ ] Set current_reviewer_id to reviewerId
- [ ] Set submitted_at timestamp
- [ ] Send email notification to reviewer (use email service)
- [ ] Return updated submittal
- [ ] **Validation**: Test successful submission
- [ ] **Validation**: Test blocked without attachments
- [ ] **Validation**: Test email notification sent

**Dependencies**: Task 2.1 complete, email service configured
**Parallelizable**: Can run in parallel with Task 2.2

---

### Task 2.4: Implement reviewSubmittal Server Action
- [ ] Create file: `lib/actions/submittals/review-submittal.ts`
- [ ] Define `ReviewSubmittalInput` Zod schema (submittalId, action, comments, nextReviewerId)
- [ ] Validate user is current_reviewer
- [ ] Create review record in `submittal_reviews` table
- [ ] Implement state transition logic:
  - `approved`: status = 'approved', current_stage = 'complete', set closed_at
  - `approved_as_noted`: status = 'approved_as_noted', current_stage = 'complete', set closed_at
  - `revise_resubmit`: status = 'revise_resubmit', current_stage = 'complete', clear current_reviewer_id, set closed_at
  - `rejected`: status = 'rejected', current_stage = 'complete', set closed_at
  - `forwarded`: advance current_stage (gc_review → ae_review → owner_review), update current_reviewer_id
- [ ] Set reviewed_at timestamp
- [ ] Send email notifications to relevant parties
- [ ] Return updated submittal with new review
- [ ] **Validation**: Test all 5 review actions with unit tests
- [ ] **Validation**: Test unauthorized user cannot review
- [ ] **Validation**: Test email notifications sent correctly

**Dependencies**: Task 2.3 complete
**Parallelizable**: No (depends on Task 2.3)

---

### Task 2.5: Implement createResubmittal Server Action
- [ ] Create file: `lib/actions/submittals/create-resubmittal.ts`
- [ ] Define `CreateResubmittalInput` Zod schema (parentSubmittalId, notes)
- [ ] Validate parent submittal has status 'revise_resubmit' or 'rejected'
- [ ] Fetch parent submittal metadata
- [ ] Calculate next version number and version text (Rev 0 → Rev A → Rev B)
- [ ] Create new submittal record:
  - Copy metadata from parent (project_id, title, spec_section, type, required_on_site, lead_time)
  - Set parent_submittal_id
  - Set new version and version_number
  - Reset status to 'draft', current_stage to 'draft'
- [ ] Create submittal_versions record with notes
- [ ] Return new submittal
- [ ] **Validation**: Test version increment logic (Rev 0 → Rev A → Rev B)
- [ ] **Validation**: Test metadata inheritance
- [ ] **Validation**: Test blocked if parent not in correct status

**Dependencies**: Task 2.1, 2.4 complete
**Parallelizable**: Can run in parallel with Task 2.6

---

### Task 2.6: Implement File Upload Server Action
- [ ] Create file: `lib/actions/submittals/upload-attachment.ts`
- [ ] Define `UploadAttachmentInput` Zod schema
- [ ] Validate file size (max 50MB)
- [ ] Validate file type (PDF, images, docs only)
- [ ] Generate storage path: `/submittals/{project_id}/{submittal_id}/{version}/{filename}`
- [ ] Upload file to Supabase Storage using TUS protocol (chunked for large files)
- [ ] Create attachment record in `submittal_attachments` table
- [ ] Return attachment metadata
- [ ] **Validation**: Test successful upload of various file types
- [ ] **Validation**: Test file size limit enforcement
- [ ] **Validation**: Test unsupported file type rejected

**Dependencies**: Supabase Storage configured
**Parallelizable**: Can run in parallel with Task 2.5

---

### Task 2.7: Implement Delete Attachment Server Action
- [ ] Create file: `lib/actions/submittals/delete-attachment.ts`
- [ ] Validate submittal is in 'draft' status
- [ ] Validate user is creator or has admin permissions
- [ ] Delete attachment record from database
- [ ] Delete file from Supabase Storage
- [ ] Return success confirmation
- [ ] **Validation**: Test successful deletion from draft
- [ ] **Validation**: Test blocked for submitted submittals

**Dependencies**: Task 2.6 complete
**Parallelizable**: No

---

### Task 2.8: Implement getSubmittalList Server Action with Filters
- [ ] Create file: `lib/actions/submittals/get-submittal-list.ts`
- [ ] Define filter parameters: status, current_stage, spec_section, overdue, assignedToMe
- [ ] Build dynamic query with RLS enforcement
- [ ] Implement pagination (limit, offset)
- [ ] Sort by spec_section ASC, number ASC
- [ ] Include aggregations: total count, overdue count
- [ ] **Validation**: Test filtering by status
- [ ] **Validation**: Test filtering by CSI division
- [ ] **Validation**: Test overdue filter
- [ ] **Validation**: Test pagination

**Dependencies**: Task 2.1 complete
**Parallelizable**: Can run in parallel with other get* actions

---

### Task 2.9: Implement getSubmittalDetail Server Action
- [ ] Create file: `lib/actions/submittals/get-submittal-detail.ts`
- [ ] Fetch submittal by ID with RLS enforcement
- [ ] Include related data: attachments, reviews, version history
- [ ] Calculate days pending if under review
- [ ] Include creator and current reviewer profile data
- [ ] Return full submittal object with all nested data
- [ ] **Validation**: Test successful fetch
- [ ] **Validation**: Test RLS blocks unauthorized access

**Dependencies**: Task 2.1 complete
**Parallelizable**: Yes (parallel with Task 2.8)

---

### Task 2.10: Implement getMyPendingReviews Server Action
- [ ] Create file: `lib/actions/submittals/get-my-pending-reviews.ts`
- [ ] Query submittals where current_reviewer_id = current user
- [ ] Calculate days pending for each
- [ ] Sort by days pending DESC (oldest first)
- [ ] Flag overdue (>7 days)
- [ ] Return list with urgency indicators
- [ ] **Validation**: Test returns only assigned submittals
- [ ] **Validation**: Test days pending calculation

**Dependencies**: Task 2.1 complete
**Parallelizable**: Yes (parallel with Task 2.8, 2.9)

---

## Phase 3: Frontend UI Components (Days 8-12)

### Task 3.1: Create Submittal List Page Component
- [ ] Create file: `app/(dashboard)/[orgSlug]/projects/[projectId]/submittals/page.tsx`
- [ ] Implement server component to fetch submittal list
- [ ] Create filter UI: status, stage, CSI section, overdue toggle
- [ ] Create search bar for keyword search
- [ ] Group submittals by CSI section
- [ ] Display table columns: number, title, type, status, stage, reviewer, days pending
- [ ] Add overdue badges (red for overdue, yellow for approaching deadline)
- [ ] Add "Create Submittal" button
- [ ] Implement pagination controls
- [ ] **Validation**: Test with sample data
- [ ] **Validation**: Test filters work correctly
- [ ] **Validation**: Test responsive design on tablet

**Dependencies**: Task 2.8 complete, shadcn/ui components available
**Parallelizable**: Can run in parallel with Task 3.2

---

### Task 3.2: Create Submittal Detail Page Component
- [ ] Create file: `app/(dashboard)/[orgSlug]/projects/[projectId]/submittals/[submittalId]/page.tsx`
- [ ] Implement server component to fetch submittal detail
- [ ] Display header: number, title, status badge, version
- [ ] Display metadata section: type, spec section, dates, lead time
- [ ] Display procurement deadline with warning badges
- [ ] Display current stage and ball-in-court (current reviewer)
- [ ] Create attachments section: list files with download buttons
- [ ] Create review history timeline component
- [ ] Create version history component (if resubmittals exist)
- [ ] Add action buttons based on permissions: Edit, Submit, Review, Create Resubmittal
- [ ] **Validation**: Test all sections render correctly
- [ ] **Validation**: Test action buttons show/hide based on status and permissions

**Dependencies**: Task 2.9 complete
**Parallelizable**: Can run in parallel with Task 3.1

---

### Task 3.3: Create Submittal Create/Edit Form Component
- [ ] Create file: `components/submittals/submittal-form.tsx`
- [ ] Use React Hook Form with Zod validation
- [ ] Create form fields: title, description, type, spec_section, required_on_site, lead_time
- [ ] Implement CSI spec section picker (searchable dropdown)
- [ ] Add file upload dropzone for attachments
- [ ] Show attachment list with delete buttons (drafts only)
- [ ] Calculate and display procurement deadline dynamically
- [ ] Implement optimistic updates with React Query
- [ ] Handle errors and display validation messages
- [ ] **Validation**: Test form validation
- [ ] **Validation**: Test CSI picker search
- [ ] **Validation**: Test file upload with progress

**Dependencies**: Task 2.1, 2.2, 2.6 complete
**Parallelizable**: Can run in parallel with Task 3.1, 3.2

---

### Task 3.4: Create Review Action Panel Component
- [ ] Create file: `components/submittals/review-action-panel.tsx`
- [ ] Display only if user is current reviewer
- [ ] Create action buttons: Approve, Approve as Noted, Forward to A/E, Request Revision, Reject
- [ ] Create modal for each action with comment textarea
- [ ] For "Forward" action: add reviewer selector dropdown
- [ ] Implement confirmation dialogs
- [ ] Call reviewSubmittal Server Action
- [ ] Show success/error toast notifications
- [ ] Invalidate React Query cache on success
- [ ] **Validation**: Test all 5 review actions
- [ ] **Validation**: Test only shown to current reviewer

**Dependencies**: Task 2.4, 3.2 complete
**Parallelizable**: Can run in parallel with Task 3.3

---

### Task 3.5: Create Resubmittal Creation Flow
- [ ] Create file: `components/submittals/create-resubmittal-modal.tsx`
- [ ] Display parent submittal details (read-only)
- [ ] Show review comments that triggered revision request
- [ ] Create form: notes textarea (what changed), file upload for new attachments
- [ ] Call createResubmittal Server Action
- [ ] Navigate to new submittal draft on success
- [ ] **Validation**: Test resubmittal inherits parent metadata
- [ ] **Validation**: Test version increments correctly

**Dependencies**: Task 2.5, 3.3 complete
**Parallelizable**: Can run in parallel with Task 3.4

---

### Task 3.6: Create Review History Timeline Component
- [ ] Create file: `components/submittals/review-timeline.tsx`
- [ ] Display all reviews in chronological order
- [ ] Show for each review: reviewer name, action, comments, timestamp
- [ ] Use color coding: green (approved), yellow (forwarded), red (rejected/revision)
- [ ] Show stage transitions (draft → gc_review → ae_review → complete)
- [ ] Add version separators if multiple versions exist
- [ ] **Validation**: Test with multi-stage submittal
- [ ] **Validation**: Test with resubmittals

**Dependencies**: Task 3.2 complete
**Parallelizable**: Can run in parallel with other component tasks

---

### Task 3.7: Create Version History Component
- [ ] Create file: `components/submittals/version-history.tsx`
- [ ] Display all versions (Rev 0, Rev A, Rev B, etc.)
- [ ] Show for each version: version, submission date, final status, notes
- [ ] Add links to view each version's detail page
- [ ] Highlight current version
- [ ] Show "Superseded by Rev X" notice on old versions
- [ ] **Validation**: Test with 3+ versions
- [ ] **Validation**: Test navigation between versions

**Dependencies**: Task 3.2 complete
**Parallelizable**: Yes (parallel with Task 3.6)

---

### Task 3.8: Create My Reviews Dashboard Widget
- [ ] Create file: `components/dashboard/my-pending-reviews-widget.tsx`
- [ ] Display count of pending reviews
- [ ] List urgent items (>7 days pending)
- [ ] Show days pending for each
- [ ] Add "Review" button linking to submittal detail
- [ ] Highlight overdue items in red
- [ ] **Validation**: Test with multiple pending reviews
- [ ] **Validation**: Test urgency calculations

**Dependencies**: Task 2.10 complete
**Parallelizable**: Can run in parallel with other UI tasks

---

### Task 3.9: Create CSI Spec Section Picker Component
- [ ] Create file: `components/submittals/csi-spec-section-picker.tsx`
- [ ] Implement searchable dropdown (Combobox from shadcn/ui)
- [ ] Fetch CSI sections from database
- [ ] Group by division
- [ ] Support search by code or title
- [ ] Display selected section with title
- [ ] **Validation**: Test search functionality
- [ ] **Validation**: Test division grouping

**Dependencies**: Task 1.1 complete (CSI data imported)
**Parallelizable**: Can run in parallel with other component tasks

---

### Task 3.10: Create Submittal Pipeline Dashboard
- [ ] Create file: `app/(dashboard)/[orgSlug]/projects/[projectId]/submittals/pipeline/page.tsx`
- [ ] Display visual pipeline: Draft → GC Review → A/E Review → Owner Review → Approved
- [ ] Show count at each stage
- [ ] Show average days at each stage
- [ ] Highlight bottleneck stage (highest avg days or most items)
- [ ] Add click-through to filtered list
- [ ] **Validation**: Test with sample data
- [ ] **Validation**: Test bottleneck detection

**Dependencies**: Task 2.8 complete
**Parallelizable**: Can run in parallel with other UI tasks

---

## Phase 4: Email Notifications & Analytics (Days 13-15)

### Task 4.1: Implement Email Notification Templates
- [ ] Create email templates using React Email or similar
- [ ] Template 1: "Submittal assigned for review"
- [ ] Template 2: "Submittal approved"
- [ ] Template 3: "Submittal approved with notes"
- [ ] Template 4: "Revision requested"
- [ ] Template 5: "Submittal rejected"
- [ ] Template 6: "Reminder: Submittal pending review for 7 days"
- [ ] Include submittal details, links, and relevant metadata in each template
- [ ] **Validation**: Preview all templates
- [ ] **Validation**: Test rendering with sample data

**Dependencies**: Email service (SendGrid/Postmark) configured
**Parallelizable**: Can run in parallel with Task 4.2

---

### Task 4.2: Implement Email Sending Logic
- [ ] Create file: `lib/emails/submittal-notifications.ts`
- [ ] Implement `sendSubmittalAssignedEmail(submittalId, reviewerId)`
- [ ] Implement `sendSubmittalApprovedEmail(submittalId, creatorId)`
- [ ] Implement `sendRevisionRequestedEmail(submittalId, creatorId, comments)`
- [ ] Implement `sendReminderEmail(submittalId, reviewerId, daysPending)`
- [ ] Integrate with SendGrid/Postmark API
- [ ] Handle errors gracefully (log, don't fail main operation)
- [ ] **Validation**: Test emails send successfully
- [ ] **Validation**: Test error handling

**Dependencies**: Task 4.1 complete
**Parallelizable**: No (depends on Task 4.1)

---

### Task 4.3: Create Daily Reminder Job for Overdue Reviews
- [ ] Create file: `lib/jobs/submittal-review-reminders.ts`
- [ ] Query submittals where current_stage in (gc_review, ae_review, owner_review)
- [ ] Calculate days pending since submitted_at or last review
- [ ] Send reminder emails for submittals pending >7 days
- [ ] CC project manager on overdue reminders
- [ ] Log reminder sent to prevent duplicate sends
- [ ] **Validation**: Test job logic with sample data
- [ ] **Validation**: Schedule job to run daily via Vercel Cron or Supabase pg_cron

**Dependencies**: Task 4.2 complete
**Parallelizable**: Can run in parallel with Task 4.4

---

### Task 4.4: Implement Procurement Deadline Alert Job
- [ ] Create file: `lib/jobs/submittal-procurement-alerts.ts`
- [ ] Query submittals where procurement_deadline < TODAY
- [ ] Filter for status NOT IN (approved, approved_as_noted, rejected, cancelled)
- [ ] Send alert emails to project managers
- [ ] Include days overdue, current stage, required on-site date
- [ ] Flag critical-path items as urgent
- [ ] **Validation**: Test alert logic
- [ ] **Validation**: Schedule job to run daily

**Dependencies**: Task 4.2 complete
**Parallelizable**: Yes (parallel with Task 4.3)

---

### Task 4.5: Implement Analytics Queries
- [ ] Create file: `lib/actions/submittals/analytics.ts`
- [ ] Implement `getSubmittalPipelineStats(projectId)`: counts by stage
- [ ] Implement `getAverageCycleTimes(projectId)`: avg days from submit to approval
- [ ] Implement `getResubmittalRate(projectId)`: % requiring revision
- [ ] Implement `getCycleTimesByDivision(projectId)`: avg approval time by CSI division
- [ ] Implement `getOverdueSubmittals(projectId)`: list with days overdue
- [ ] **Validation**: Test queries with sample data
- [ ] **Validation**: Verify performance with 1000+ submittals

**Dependencies**: Database queries optimized (indexes in place)
**Parallelizable**: Can run in parallel with Task 4.6

---

### Task 4.6: Create Analytics Dashboard Page
- [ ] Create file: `app/(dashboard)/[orgSlug]/projects/[projectId]/submittals/analytics/page.tsx`
- [ ] Display key metrics: total submittals, approved count, pending count, avg cycle time
- [ ] Create chart: Approval times by CSI division (bar chart)
- [ ] Create chart: Pipeline status (funnel chart)
- [ ] Display resubmittal rate with target comparison
- [ ] List overdue submittals table
- [ ] Add export button (PDF/CSV)
- [ ] **Validation**: Test with sample data
- [ ] **Validation**: Test charts render correctly

**Dependencies**: Task 4.5 complete
**Parallelizable**: No (depends on Task 4.5)

---

## Phase 5: Testing & Polish (Days 16-18)

### Task 5.1: Write Unit Tests for Server Actions
- [ ] Test `createSubmittal`: success, validation errors, numbering
- [ ] Test `submitForReview`: success, blocked without attachments
- [ ] Test `reviewSubmittal`: all 5 actions, unauthorized access
- [ ] Test `createResubmittal`: version increment, metadata inheritance
- [ ] Test `uploadAttachment`: file size limit, unsupported types
- [ ] Use Vitest with mocked Supabase client
- [ ] Target 80% code coverage for server actions
- [ ] **Validation**: Run `npm test` and verify all tests pass

**Dependencies**: All Phase 2 tasks complete
**Parallelizable**: Can run in parallel with Task 5.2

---

### Task 5.2: Write Integration Tests for RLS Policies
- [ ] Create file: `supabase/tests/submittals_rls.test.sql`
- [ ] Test submittals SELECT: user can view in accessible projects only
- [ ] Test submittals INSERT: user can create with valid permissions
- [ ] Test submittals UPDATE: creator can update draft, reviewer can update assigned
- [ ] Test submittal_reviews INSERT: only current reviewer can add reviews
- [ ] Test submittal_attachments: proper access control
- [ ] Run tests with `npm run db:test`
- [ ] **Validation**: All RLS tests pass

**Dependencies**: Phase 1 RLS policies complete
**Parallelizable**: Yes (parallel with Task 5.1)

---

### Task 5.3: Write E2E Test for Complete Submittal Flow
- [ ] Create file: `e2e/submittal-workflow.spec.ts`
- [ ] Test flow:
  1. Subcontractor creates draft submittal
  2. Uploads attachments
  3. Submits for GC review
  4. GC forwards to A/E
  5. A/E approves
  6. Creator sees approval notification
- [ ] Use Playwright for E2E testing
- [ ] **Validation**: Full flow completes successfully

**Dependencies**: All Phase 3 UI tasks complete
**Parallelizable**: Can run in parallel with Task 5.4

---

### Task 5.4: Write E2E Test for Resubmittal Flow
- [ ] Create file: `e2e/submittal-resubmittal.spec.ts`
- [ ] Test flow:
  1. Create and submit submittal (Rev 0)
  2. GC requests revision
  3. Creator creates resubmittal (Rev A)
  4. Uploads revised attachments
  5. Submits Rev A
  6. GC approves Rev A
- [ ] Verify version history displays correctly
- [ ] **Validation**: Resubmittal flow works end-to-end

**Dependencies**: Task 5.3 complete
**Parallelizable**: Yes (parallel with Task 5.3)

---

### Task 5.5: Performance Testing with Large Datasets
- [ ] Seed database with 10,000 submittals across 10 projects
- [ ] Test submittal list page load time: target <500ms
- [ ] Test submittal detail page load time: target <300ms
- [ ] Test analytics queries: target <1s
- [ ] Test file upload for 50MB PDF: target <30s
- [ ] Identify and fix slow queries (add indexes if needed)
- [ ] **Validation**: All performance targets met

**Dependencies**: All features implemented
**Parallelizable**: No (requires full system)

---

### Task 5.6: Accessibility Audit
- [ ] Run Lighthouse accessibility audit on all pages
- [ ] Ensure keyboard navigation works (tab through forms, modals)
- [ ] Add proper ARIA labels to interactive elements
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Ensure color contrast meets WCAG AA standards
- [ ] Fix any accessibility issues found
- [ ] **Validation**: Lighthouse score >90 for accessibility

**Dependencies**: All UI components complete
**Parallelizable**: Can run in parallel with Task 5.5

---

### Task 5.7: Mobile/Tablet Responsiveness Testing
- [ ] Test submittal list page on tablet (iPad 10")
- [ ] Test submittal detail page on tablet
- [ ] Test create/edit form on tablet
- [ ] Test review action panel on tablet
- [ ] Ensure touch targets are ≥48px
- [ ] Test file upload on tablet (camera photo)
- [ ] Fix any layout issues
- [ ] **Validation**: All pages usable on tablet

**Dependencies**: Phase 3 UI complete
**Parallelizable**: Yes (parallel with Task 5.6)

---

### Task 5.8: Create User Documentation
- [ ] Write user guide: "Creating and Submitting Submittals"
- [ ] Write user guide: "Reviewing Submittals"
- [ ] Write user guide: "Handling Resubmittals"
- [ ] Create video walkthrough (5 minutes)
- [ ] Document CSI spec section picker usage
- [ ] Document lead time tracking
- [ ] Add inline help tooltips to UI
- [ ] **Validation**: Docs reviewed by construction SME

**Dependencies**: All features complete
**Parallelizable**: Can run in parallel with testing tasks

---

### Task 5.9: Conduct User Acceptance Testing (UAT)
- [ ] Recruit 3-5 pilot users (GC, subcontractor, A/E)
- [ ] Provide UAT environment with sample data
- [ ] Have users complete key workflows
- [ ] Collect feedback via survey
- [ ] Prioritize bugs and improvements
- [ ] Fix critical issues before launch
- [ ] **Validation**: UAT feedback NPS >50

**Dependencies**: All features complete, Task 5.8 docs ready
**Parallelizable**: No (requires complete system)

---

### Task 5.10: Code Review and Refactoring
- [ ] Request code review from senior engineer
- [ ] Review for: code quality, security, performance, maintainability
- [ ] Refactor any problematic code
- [ ] Ensure TypeScript strict mode compliance
- [ ] Add JSDoc comments to exported functions
- [ ] Remove any console.logs or debug code
- [ ] **Validation**: Code review approved

**Dependencies**: All code complete
**Parallelizable**: No (requires complete codebase)

---

## Phase 6: Launch Preparation (Days 19-21)

### Task 6.1: Deploy to Staging Environment
- [ ] Run all migrations on staging database
- [ ] Deploy frontend to Vercel staging
- [ ] Configure staging environment variables
- [ ] Test all features on staging
- [ ] Run smoke tests
- [ ] **Validation**: Staging environment fully functional

**Dependencies**: All features tested and approved
**Parallelizable**: No

---

### Task 6.2: Create Migration Guide for Existing Projects
- [ ] Document migration process from email/spreadsheets
- [ ] Create CSV import template for existing submittal logs
- [ ] Write script to import historical submittals
- [ ] Test import with sample historical data
- [ ] **Validation**: Historical submittals import successfully

**Dependencies**: None
**Parallelizable**: Can run in parallel with Task 6.1

---

### Task 6.3: Production Database Migration
- [ ] Schedule maintenance window
- [ ] Backup production database
- [ ] Run all submittal migrations on production
- [ ] Verify all tables, indexes, functions created
- [ ] Test RLS policies on production
- [ ] **Validation**: Production database ready

**Dependencies**: Task 6.1 staging deployment successful
**Parallelizable**: No

---

### Task 6.4: Deploy to Production
- [ ] Deploy frontend to Vercel production
- [ ] Configure production environment variables
- [ ] Enable feature flag for submittals module
- [ ] Run smoke tests on production
- [ ] Monitor error logs for first hour
- [ ] **Validation**: Production deployment successful

**Dependencies**: Task 6.3 complete
**Parallelizable**: No

---

### Task 6.5: Launch Communication and Training
- [ ] Send launch announcement email to all users
- [ ] Schedule training webinar (optional)
- [ ] Post launch announcement in product updates
- [ ] Update help center with new docs
- [ ] Monitor support tickets for common issues
- [ ] **Validation**: Users aware of new feature

**Dependencies**: Task 6.4 production deployment
**Parallelizable**: No

---

### Task 6.6: Monitor and Iterate
- [ ] Monitor Sentry for errors (first week)
- [ ] Track usage metrics: submittal creation rate, approval cycle times
- [ ] Collect user feedback via in-app feedback widget
- [ ] Create backlog for Phase 2 improvements
- [ ] Schedule retrospective with team
- [ ] **Validation**: Success metrics tracked

**Dependencies**: Launch complete
**Parallelizable**: Ongoing

---

## Summary

**Total Tasks**: 66 tasks across 6 phases
**Estimated Duration**: 18-21 working days (3-4 weeks)
**Team Size**: 2-3 engineers (1 backend, 1 frontend, 0.5 DevOps)

**Critical Path**:
1. Database schema (Phase 1: Days 1-3)
2. Core server actions (Phase 2: Days 4-7)
3. UI components (Phase 3: Days 8-12)
4. Testing and polish (Phase 5: Days 16-18)
5. Launch (Phase 6: Days 19-21)

**Parallelizable Work**:
- Phase 1: Many database tasks can run in parallel after core tables created
- Phase 2: Several server actions can be built simultaneously
- Phase 3: UI components can be built by separate frontend engineers
- Phase 5: Testing can run in parallel across unit, integration, and E2E tests

**Success Criteria**:
- All 66 tasks completed and validated
- 80% test coverage on server actions
- All E2E flows passing
- Performance targets met (<500ms list, <300ms detail)
- UAT feedback NPS >50
- Zero critical bugs on launch
