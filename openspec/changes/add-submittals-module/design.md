# Design: Submittals Module Architecture

## Overview

The Submittals module implements a multi-stage review workflow for managing product data, shop drawings, and samples through the construction approval process. The design balances construction-specific requirements (CSI spec section mapping, multi-stage approvals, version tracking) with technical constraints (RLS security, audit compliance, large file handling).

## System Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  Submittal List      Submittal Detail    Submittal Create   │
│  - CSI section       - Version history   Form                │
│    grouping          - Review timeline   - CSI picker        │
│  - Stage filters     - Attachments       - Type selection    │
│  - Overdue badge     - Review actions    - File upload       │
│  - Lead time alert   - Ball-in-court     - Lead time calc    │
│                                                              │
│  React Query Cache (optimistic updates, invalidation)       │
└──────────────────────┬──────────────────────────────────────┘
                       │ Server Actions
                       ├─ createSubmittal()
                       ├─ submitForReview()
                       ├─ reviewSubmittal()
                       ├─ createResubmittal()
                       └─ updateSubmittal()
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                   Backend (Supabase)                         │
├─────────────────────────────────────────────────────────────┤
│  RLS Policies                                                │
│  - user_project_ids() filter                                │
│  - Role-based write: GC can review, subs can create         │
│                                                              │
│  Database (Postgres)                                         │
│  ┌─────────────┐  ┌───────────────────┐  ┌──────────────┐ │
│  │ submittals  │──│ submittal_reviews │  │ submittal_   │ │
│  │             │  │                   │  │ attachments  │ │
│  └──────┬──────┘  └───────────────────┘  └──────────────┘ │
│         │                                                   │
│  ┌──────┴─────────────┐                                    │
│  │ submittal_versions │                                    │
│  └────────────────────┘                                    │
│  - Sequential numbering per spec section                   │
│  - Status enum with CHECK constraints                      │
│  - Multi-stage workflow tracking                           │
│  - Version tracking for resubmittals                       │
│  - Audit triggers on all mutations                         │
│                                                              │
│  Storage                                                     │
│  - /submittals/{project_id}/{submittal_id}/{version}/      │
│  - Max 50MB per file, signed URLs, PDF optimization         │
│                                                              │
│  Edge Functions (Future)                                     │
│  - AI compliance check: Match submittal to spec (Phase 2)  │
│  - Lead time notifications: Alert on procurement deadlines │
└─────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│               External Services                              │
├─────────────────────────────────────────────────────────────┤
│  SendGrid (Email)                                            │
│  - Stage transition notifications                           │
│  - Approval/rejection alerts                                │
│  - Overdue reminders                                        │
│                                                              │
│  CSI MasterFormat Data (Static)                             │
│  - Reference table for spec sections and titles            │
│  - Division/section hierarchy                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Model

### Core Entities

#### `submittals` Table

```sql
CREATE TYPE submittal_type AS ENUM (
  'product_data',
  'shop_drawings',
  'samples',
  'mixed'
);

CREATE TYPE submittal_status AS ENUM (
  'draft',
  'submitted',
  'gc_review',
  'ae_review',
  'owner_review',
  'approved',
  'approved_as_noted',
  'revise_resubmit',
  'rejected',
  'cancelled'
);

CREATE TYPE review_stage AS ENUM (
  'draft',
  'gc_review',
  'ae_review',
  'owner_review',
  'complete'
);

CREATE TABLE submittals (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  number TEXT NOT NULL, -- Auto-generated: "03 30 00-001"

  -- Content
  title TEXT NOT NULL,
  description TEXT,
  submittal_type submittal_type NOT NULL,
  spec_section TEXT NOT NULL, -- CSI MasterFormat: "03 30 00"
  spec_section_title TEXT, -- "Cast-in-Place Concrete"

  -- Status & Workflow
  status submittal_status NOT NULL DEFAULT 'draft',
  current_stage review_stage NOT NULL DEFAULT 'draft',

  -- Version Tracking
  version TEXT NOT NULL DEFAULT 'Rev 0', -- "Rev 0", "Rev A", "Rev B"
  version_number INTEGER NOT NULL DEFAULT 0, -- For sorting
  parent_submittal_id UUID REFERENCES submittals(id), -- For resubmittals

  -- Assignment
  created_by UUID NOT NULL REFERENCES profiles(id),
  submitted_by_org UUID REFERENCES organizations(id), -- Subcontractor org
  current_reviewer_id UUID REFERENCES profiles(id), -- Ball-in-court

  -- Timestamps & Lead Time
  submitted_at TIMESTAMPTZ,
  required_on_site DATE, -- When material must be on site
  lead_time_days INTEGER, -- Procurement lead time
  procurement_deadline DATE GENERATED ALWAYS AS (
    CASE
      WHEN required_on_site IS NOT NULL AND lead_time_days IS NOT NULL
      THEN required_on_site - lead_time_days
      ELSE NULL
    END
  ) STORED, -- Calculated deadline
  reviewed_at TIMESTAMPTZ, -- Last review action timestamp
  closed_at TIMESTAMPTZ,

  -- Extensibility
  custom_fields JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(project_id, spec_section, number), -- Per spec section numbering
  CHECK (lead_time_days >= 0),
  CHECK (version_number >= 0)
);

-- Indexes for common queries
CREATE INDEX idx_submittals_project_id ON submittals(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_submittals_status ON submittals(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_submittals_current_stage ON submittals(current_stage) WHERE deleted_at IS NULL;
CREATE INDEX idx_submittals_spec_section ON submittals(spec_section) WHERE deleted_at IS NULL;
CREATE INDEX idx_submittals_current_reviewer ON submittals(current_reviewer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_submittals_overdue ON submittals(procurement_deadline)
  WHERE procurement_deadline < CURRENT_DATE AND status NOT IN ('approved', 'approved_as_noted', 'rejected', 'cancelled');
CREATE INDEX idx_submittals_parent ON submittals(parent_submittal_id) WHERE parent_submittal_id IS NOT NULL;

-- Full-text search on title + description
CREATE INDEX idx_submittals_search ON submittals
  USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Trigger for updated_at
CREATE TRIGGER set_submittals_updated_at
  BEFORE UPDATE ON submittals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

#### `submittal_reviews` Table

```sql
CREATE TYPE review_action AS ENUM (
  'approved',
  'approved_as_noted',
  'revise_resubmit',
  'rejected',
  'forwarded' -- Forwarded to next stage without full approval
);

CREATE TABLE submittal_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submittal_id UUID NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL, -- Which version was reviewed
  stage review_stage NOT NULL, -- Which stage performed this review
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  action review_action NOT NULL,
  comments TEXT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submittal_reviews_submittal_id ON submittal_reviews(submittal_id);
CREATE INDEX idx_submittal_reviews_stage ON submittal_reviews(submittal_id, stage, version_number);
CREATE INDEX idx_submittal_reviews_reviewer ON submittal_reviews(reviewer_id);

-- Trigger for audit logging
CREATE TRIGGER audit_submittal_reviews
  AFTER INSERT OR UPDATE OR DELETE ON submittal_reviews
  FOR EACH ROW
  EXECUTE FUNCTION log_audit();
```

#### `submittal_versions` Table

```sql
CREATE TABLE submittal_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submittal_id UUID NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,
  version TEXT NOT NULL, -- "Rev 0", "Rev A", "Rev B"
  version_number INTEGER NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT, -- What changed in this version

  UNIQUE(submittal_id, version_number)
);

CREATE INDEX idx_submittal_versions_submittal_id ON submittal_versions(submittal_id);
CREATE INDEX idx_submittal_versions_version_number ON submittal_versions(submittal_id, version_number);
```

#### `submittal_attachments` Table

```sql
CREATE TYPE attachment_type AS ENUM (
  'product_data',
  'shop_drawing',
  'sample_photo',
  'specification',
  'other'
);

CREATE TABLE submittal_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submittal_id UUID NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL, -- Which version this belongs to
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL, -- MIME type
  attachment_type attachment_type NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submittal_attachments_submittal_id ON submittal_attachments(submittal_id);
CREATE INDEX idx_submittal_attachments_version ON submittal_attachments(submittal_id, version_number);
CREATE INDEX idx_submittal_attachments_type ON submittal_attachments(attachment_type);
```

#### `csi_spec_sections` Reference Table (Static Data)

```sql
CREATE TABLE csi_spec_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_code TEXT NOT NULL UNIQUE, -- "03 30 00"
  section_title TEXT NOT NULL, -- "Cast-in-Place Concrete"
  division INTEGER NOT NULL, -- 3
  division_title TEXT NOT NULL, -- "Concrete"
  parent_section TEXT, -- For hierarchical structure
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_csi_spec_sections_division ON csi_spec_sections(division);
CREATE INDEX idx_csi_spec_sections_code ON csi_spec_sections(section_code);

-- Full-text search on titles
CREATE INDEX idx_csi_spec_sections_search ON csi_spec_sections
  USING GIN(to_tsvector('english', section_title || ' ' || division_title));
```

### Relationships

```
submittals (parent) ──1:N──> submittal_reviews
                    ──1:N──> submittal_versions
                    ──1:N──> submittal_attachments
                    ──1:1──> csi_spec_sections (via spec_section)
                    ──1:1──> submittals (via parent_submittal_id for resubmittals)
```

## Workflow State Machine

### Status Transitions

```
draft
  ↓ submit()
submitted (current_stage = gc_review)
  ↓ reviewSubmittal(action: 'forwarded')
gc_review (current_stage = ae_review)
  ↓ reviewSubmittal(action: 'forwarded')
ae_review (current_stage = owner_review) [optional]
  ↓ reviewSubmittal(action: 'forwarded')
owner_review (current_stage = complete) [optional]
  ↓ reviewSubmittal(action: 'approved' | 'approved_as_noted')
approved / approved_as_noted (current_stage = complete)

[At any review stage]
  ↓ reviewSubmittal(action: 'revise_resubmit')
revise_resubmit → createResubmittal() → [new submittal, restart workflow]

[At any review stage]
  ↓ reviewSubmittal(action: 'rejected')
rejected (current_stage = complete)

[At any stage]
  ↓ cancelSubmittal()
cancelled (current_stage = complete)
```

### Stage Progression Logic

**GC Review Stage**:
- Ball-in-court: GC project engineer or superintendent
- Actions: Approve, Approve as Noted, Forward to A/E, Request Revision, Reject

**A/E Review Stage**:
- Ball-in-court: Architect or Engineer contact
- Actions: Approve, Approve as Noted, Forward to Owner (if required), Request Revision, Reject

**Owner Review Stage** (Optional):
- Ball-in-court: Owner representative
- Actions: Approve, Approve as Noted, Request Revision, Reject

**Revise & Resubmit**:
- Returns ball-in-court to original submitter (subcontractor)
- Submitter creates new version via `createResubmittal()`
- New version inherits metadata but restarts workflow from `submitted` status

## Sequential Numbering

### Numbering Format

Format: `{CSI-SECTION}-{###}`

Examples:
- "03 30 00-001" (first concrete submittal)
- "03 30 00-002" (second concrete submittal)
- "23 00 00-001" (first HVAC submittal)

### Numbering Function

```sql
CREATE OR REPLACE FUNCTION next_submittal_number(
  p_project_id UUID,
  p_spec_section TEXT
) RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  new_number TEXT;
BEGIN
  -- Lock the project to prevent race conditions
  PERFORM 1 FROM projects WHERE id = p_project_id FOR UPDATE;

  -- Get the highest number for this spec section
  SELECT COALESCE(
    MAX(
      CAST(
        SPLIT_PART(number, '-', 2) AS INTEGER
      )
    ), 0
  ) + 1
  INTO next_num
  FROM submittals
  WHERE project_id = p_project_id
    AND spec_section = p_spec_section
    AND deleted_at IS NULL;

  -- Format with leading zeros (e.g., 001, 002, ...)
  new_number := p_spec_section || '-' || LPAD(next_num::TEXT, 3, '0');

  RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Version Tracking

### Version Naming Convention

- **Initial submission**: "Rev 0" (version_number = 0)
- **First resubmittal**: "Rev A" (version_number = 1)
- **Second resubmittal**: "Rev B" (version_number = 2)
- **Continue**: "Rev C", "Rev D", etc.

### Resubmittal Process

1. User selects "Request Revision" on existing submittal
2. System creates new submittal record:
   - Copy metadata from parent (title, spec_section, etc.)
   - Set `parent_submittal_id` to original submittal ID
   - Increment `version_number` and update `version` text
   - Reset `status` to `draft`
   - Clear review history (reviews stay on parent)
3. User uploads new attachments for revised version
4. User submits for review, workflow restarts

### Version History View

When viewing a submittal, show:
- Current version information
- Link to all previous versions (via `parent_submittal_id` chain)
- Review history for each version
- Side-by-side version comparison (Phase 2)

## Lead Time Tracking

### Procurement Deadline Calculation

```
procurement_deadline = required_on_site - lead_time_days
```

Example:
- Material required on site: March 15, 2025
- Lead time: 45 days
- Procurement deadline: January 29, 2025

### Alerts

- **Yellow warning**: Procurement deadline within 14 days
- **Red alert**: Procurement deadline passed or within 7 days
- **Email notification**: Send reminder when submittal not approved within 7 days of deadline

## RLS Policies

### Submittals Table

```sql
-- SELECT: Users can view submittals in projects they have access to
CREATE POLICY submittals_select_policy ON submittals
  FOR SELECT
  USING (
    project_id IN (SELECT user_project_ids())
  );

-- INSERT: Authenticated users can create submittals in accessible projects
CREATE POLICY submittals_insert_policy ON submittals
  FOR INSERT
  WITH CHECK (
    project_id IN (SELECT user_project_ids())
    AND created_by = auth.uid()
  );

-- UPDATE: Creators can update drafts, reviewers can update assigned submittals
CREATE POLICY submittals_update_policy ON submittals
  FOR UPDATE
  USING (
    project_id IN (SELECT user_project_ids())
    AND (
      (status = 'draft' AND created_by = auth.uid())
      OR (current_reviewer_id = auth.uid())
      OR (user_has_project_role(project_id, 'admin'))
    )
  );

-- DELETE (soft): Only admins can soft-delete
CREATE POLICY submittals_delete_policy ON submittals
  FOR DELETE
  USING (
    project_id IN (SELECT user_project_ids())
    AND user_has_project_role(project_id, 'admin')
  );
```

### Submittal Reviews Table

```sql
-- SELECT: Inherit from parent submittal
CREATE POLICY submittal_reviews_select_policy ON submittal_reviews
  FOR SELECT
  USING (
    submittal_id IN (
      SELECT id FROM submittals WHERE project_id IN (SELECT user_project_ids())
    )
  );

-- INSERT: Only current reviewer can add reviews
CREATE POLICY submittal_reviews_insert_policy ON submittal_reviews
  FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid()
    AND submittal_id IN (
      SELECT id FROM submittals
      WHERE project_id IN (SELECT user_project_ids())
      AND current_reviewer_id = auth.uid()
    )
  );
```

## API Design

### Server Actions

#### `createSubmittal(data: CreateSubmittalInput)`

```typescript
type CreateSubmittalInput = {
  projectId: string;
  title: string;
  description?: string;
  submittalType: 'product_data' | 'shop_drawings' | 'samples' | 'mixed';
  specSection: string;
  specSectionTitle?: string;
  requiredOnSite?: Date;
  leadTimeDays?: number;
  attachments?: File[];
};
```

1. Validate user has project access
2. Generate submittal number: `next_submittal_number(projectId, specSection)`
3. Create submittal record with status = `draft`
4. Upload attachments to Supabase Storage
5. Create attachment records
6. Return created submittal with attachments

#### `submitForReview(submittalId: string, reviewerId: string)`

1. Validate submittal is in `draft` status
2. Update status to `submitted`, current_stage to `gc_review`
3. Set `current_reviewer_id` to reviewerId
4. Set `submitted_at` timestamp
5. Send email notification to reviewer
6. Return updated submittal

#### `reviewSubmittal(submittalId: string, action: ReviewAction, comments?: string)`

```typescript
type ReviewAction =
  | 'approved'
  | 'approved_as_noted'
  | 'revise_resubmit'
  | 'rejected'
  | 'forwarded';
```

1. Validate user is current reviewer
2. Create review record in `submittal_reviews`
3. Update submittal status and stage based on action:
   - `forwarded`: Advance to next stage (gc_review → ae_review → owner_review)
   - `approved` / `approved_as_noted`: Set status, mark complete
   - `revise_resubmit`: Set status, return ball-in-court to creator
   - `rejected`: Set status, mark complete
4. Update `current_reviewer_id` for next stage (if applicable)
5. Set `reviewed_at` timestamp
6. Send email notifications
7. Return updated submittal with new review

#### `createResubmittal(submittalId: string, notes: string, attachments: File[])`

1. Fetch parent submittal
2. Calculate next version number
3. Create new submittal record:
   - Copy metadata from parent
   - Set `parent_submittal_id`
   - Increment version
   - Reset status to `draft`
4. Upload new attachments
5. Create submittal_versions record
6. Return new submittal

## Storage Structure

```
submittals/
  {project_id}/
    {submittal_id}/
      rev-0/
        product-data-1.pdf
        shop-drawing-1.pdf
      rev-a/
        product-data-2.pdf (revised)
        shop-drawing-2.pdf (revised)
      rev-b/
        product-data-3.pdf (final)
```

## Performance Considerations

### Query Optimization

1. **Submittal list**: Indexed on `project_id`, `status`, `current_stage`, `spec_section`
2. **Overdue tracking**: Indexed on `procurement_deadline` for fast filtering
3. **Version history**: Indexed on `parent_submittal_id` for quick traversal
4. **Full-text search**: GIN indexes on title/description for search

### Caching Strategy

1. **CSI spec sections**: Cache in React Query (rarely changes)
2. **Submittal list**: Cache with 5-minute stale time, invalidate on mutations
3. **Submittal detail**: Cache with 30-second stale time, real-time updates via Supabase Realtime
4. **Review history**: Cache per submittal, invalidate on new reviews

### File Upload Optimization

1. **Client-side compression**: Compress images before upload (80% quality JPEG)
2. **Chunked uploads**: Use TUS protocol for files >5MB
3. **File size limits**: 50MB max per file, warn at 25MB
4. **Progress indication**: Show upload progress for large files

## Security Considerations

### RLS Enforcement

- All queries MUST go through RLS (no SECURITY DEFINER bypasses except numbering function)
- Test RLS policies with different user roles in SQL integration tests
- Audit logs for all submittal and review mutations

### File Access Control

- Generate signed URLs with 1-hour expiration
- Verify user has project access before generating signed URL
- Store files with UUID filenames to prevent guessing

### Input Validation

- Validate CSI spec section format: `\d{2} \d{2} \d{2}`
- Sanitize file names to prevent directory traversal
- Validate lead time days: 0-365 range
- Validate submittal type enum values

## Extensibility

### Custom Fields (JSONB)

Allow per-org custom fields without schema migrations:

```json
{
  "manufacturer": "ACME Concrete Co.",
  "model_number": "CC-3000",
  "color": "Gray",
  "custom_field_1": "value"
}
```

### Future Enhancements

1. **AI Compliance Checking** (Phase 2): Use GPT-4 to match submittal content to spec requirements
2. **Drawing Markup** (Phase 2): Annotate shop drawings with review comments
3. **External Portal** (Phase 3): Give subcontractors limited access without full user accounts
4. **Analytics Dashboard** (Phase 3): Cycle time analysis, bottleneck detection

## Migration Strategy

### From Email/Spreadsheets

1. Import existing submittal log from Excel
2. Map CSI spec sections to standard format
3. Upload historical files to storage
4. Mark historical submittals as `closed` (no workflow)

### Backward Compatibility

- Sequential numbering continues from existing logs
- Support both letter-based (Rev A) and numeric (Rev 1) versions via UI
- Export submittal log to CSV for external tools

## Testing Strategy

### Unit Tests

- `next_submittal_number()`: Test concurrent calls, spec section grouping
- Version increment logic: Rev 0 → Rev A → Rev B
- Procurement deadline calculation
- Status transition validation

### Integration Tests

- RLS policies: Test with different user roles
- Multi-stage workflow: GC → A/E → Owner
- File upload and signed URL generation
- Email notifications on status changes

### E2E Tests

- Create submittal → Submit → Review → Approve flow
- Resubmittal creation and versioning
- Lead time alert display
- Filter by CSI section and status

### Performance Tests

- 10,000 submittals list query: <500ms
- Large file upload (50MB): <30s
- Concurrent review actions: No conflicts

## Rollout Plan

See proposal.md for detailed rollout phases.
