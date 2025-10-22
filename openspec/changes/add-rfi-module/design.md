# Design: RFI Module Architecture

## Overview

The RFI (Request for Information) module implements a structured workflow for managing clarification requests on construction drawings and specifications. The design balances construction-specific domain requirements (ball-in-court tracking, CSI spec sections, SLA monitoring) with technical constraints (RLS security, audit compliance, performance at scale).

## System Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  RFI List View          RFI Detail View       RFI Create    │
│  - Filters (status,     - Thread UI            Form         │
│    assignee, overdue)   - Attachments        - Auto-number  │
│  - Virtualized table    - Status timeline    - Validation   │
│  - Quick actions        - Ball-in-court      - File upload  │
│                                                              │
│  React Query Cache (optimistic updates, invalidation)       │
└──────────────────────┬──────────────────────────────────────┘
                       │ Server Actions
                       ├─ createRFI()
                       ├─ updateRFI()
                       ├─ addResponse()
                       ├─ assignRFI()
                       └─ closeRFI()
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                   Backend (Supabase)                         │
├─────────────────────────────────────────────────────────────┤
│  RLS Policies                                                │
│  - user_project_ids() filter                                │
│  - Role-based write: project managers can create/update     │
│                                                              │
│  Database (Postgres)                                         │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────────┐      │
│  │   rfis   │──│ rfi_responses│  │ rfi_attachments │      │
│  └──────────┘  └──────────────┘  └─────────────────┘      │
│  - Sequential numbering via sequence                        │
│  - Status enum with CHECK constraints                       │
│  - SLA timers: due_date, overdue_at                         │
│  - Audit triggers on INSERT/UPDATE/DELETE                   │
│                                                              │
│  Storage                                                     │
│  - /rfis/{project_id}/{rfi_id}/{file}                       │
│  - Max 10MB per file, signed URLs, compression              │
│                                                              │
│  Edge Functions                                              │
│  - Email-in webhook: Parse SendGrid inbound, create RFI     │
│  - AI routing: Suggest assignee based on spec section       │
└─────────────────────────────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│               External Services                              │
├─────────────────────────────────────────────────────────────┤
│  SendGrid (Email)                                            │
│  - Inbound parse webhook → create RFI from email            │
│  - Outbound: Assignment, response, overdue notifications    │
│                                                              │
│  OpenAI API (AI Routing - Phase 2)                          │
│  - Suggest assignee based on RFI description + spec section │
└─────────────────────────────────────────────────────────────┘
```

## Data Model

### Core Entities

#### `rfis` Table

```sql
CREATE TABLE rfis (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  number TEXT NOT NULL, -- Auto-generated: "RFI-001"

  -- Content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  discipline TEXT, -- "structural", "mechanical", "electrical", etc.
  spec_section TEXT, -- CSI MasterFormat: "03 30 00"
  drawing_reference TEXT, -- Comma-separated sheet numbers: "A-101, A-102"

  -- Status & Workflow
  status rfi_status NOT NULL DEFAULT 'draft',
  priority rfi_priority NOT NULL DEFAULT 'medium',

  -- Assignment (Ball-in-court)
  assigned_to_id UUID REFERENCES profiles(id), -- Individual user
  assigned_to_org UUID REFERENCES organizations(id), -- External A/E firm
  created_by UUID NOT NULL REFERENCES profiles(id),

  -- Timestamps & SLA
  submitted_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  response_due_date TIMESTAMPTZ,
  overdue_at TIMESTAMPTZ, -- Cached for fast queries
  answered_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  -- Impact Tracking
  cost_impact NUMERIC(12,2), -- Estimated $ impact
  schedule_impact INTEGER, -- Estimated days delay

  -- Extensibility
  custom_fields JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(project_id, number), -- Sequential numbering per project
  CHECK (status IN ('draft', 'submitted', 'under_review', 'answered', 'closed', 'cancelled')),
  CHECK (priority IN ('low', 'medium', 'high', 'critical'))
);

-- Indexes for common queries
CREATE INDEX idx_rfis_project_id ON rfis(project_id);
CREATE INDEX idx_rfis_status ON rfis(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_rfis_assigned_to_id ON rfis(assigned_to_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rfis_overdue ON rfis(overdue_at) WHERE overdue_at IS NOT NULL AND status NOT IN ('closed', 'cancelled');
CREATE INDEX idx_rfis_discipline ON rfis(discipline) WHERE deleted_at IS NULL;

-- Full-text search on title + description
CREATE INDEX idx_rfis_search ON rfis USING GIN(to_tsvector('english', title || ' ' || description));
```

#### `rfi_responses` Table

```sql
CREATE TABLE rfi_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_official_answer BOOLEAN NOT NULL DEFAULT false, -- Only one per RFI
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rfi_responses_rfi_id ON rfi_responses(rfi_id);
CREATE INDEX idx_rfi_responses_official ON rfi_responses(rfi_id, is_official_answer) WHERE is_official_answer = true;
```

#### `rfi_attachments` Table

```sql
CREATE TABLE rfi_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfi_id UUID NOT NULL REFERENCES rfis(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL, -- MIME type
  drawing_sheet TEXT, -- If linking to existing drawing
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rfi_attachments_rfi_id ON rfi_attachments(rfi_id);
```

### Sequences for Auto-Numbering

```sql
-- Function to generate next RFI number for a project
CREATE OR REPLACE FUNCTION next_rfi_number(p_project_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_num INTEGER;
  v_number TEXT;
BEGIN
  -- Get the highest existing number for this project
  SELECT COALESCE(MAX(CAST(SUBSTRING(number FROM 'RFI-(\d+)') AS INTEGER)), 0) + 1
  INTO v_next_num
  FROM rfis
  WHERE project_id = p_project_id
  AND deleted_at IS NULL;

  -- Format as RFI-001, RFI-002, etc.
  v_number := 'RFI-' || LPAD(v_next_num::TEXT, 3, '0');

  RETURN v_number;
END;
$$;
```

## State Machine

### RFI Status Workflow

```
┌────────┐
│ draft  │  Creator is working on RFI, not yet submitted
└───┬────┘
    │ submit()
    ↓
┌───────────┐
│ submitted │  RFI sent to assignee (ball-in-court transfers)
└─────┬─────┘
      │ startReview()
      ↓
┌───────────────┐
│ under_review  │  Assignee is investigating/drafting response
└───────┬───────┘
        │ respond(isOfficial=true)
        ↓
┌───────────┐
│ answered  │  Official response provided, awaiting creator to close
└─────┬─────┘
      │ close()
      ↓
┌────────┐
│ closed │  RFI resolved, no further action
└────────┘

(Any status except 'closed' can transition to 'cancelled')
```

### Ball-in-Court Rules

| Status | Ball-in-Court | Actions Available |
|--------|---------------|-------------------|
| `draft` | Creator | Edit, submit, delete |
| `submitted` | Assigned recipient | Start review, respond, reassign |
| `under_review` | Assigned recipient | Respond, reassign |
| `answered` | Creator | Close, request clarification |
| `closed` | N/A | Reopen (admin only) |
| `cancelled` | N/A | None |

## Security Model

### Row-Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfi_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfi_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view RFIs in projects they have access to
CREATE POLICY "Users can view RFIs in accessible projects"
  ON rfis FOR SELECT
  USING (project_id IN (SELECT project_id FROM user_project_ids()));

-- Policy: Project managers can create RFIs
CREATE POLICY "Project managers can create RFIs"
  ON rfis FOR INSERT
  WITH CHECK (
    project_id IN (SELECT project_id FROM user_project_ids())
    AND is_project_manager(auth.uid(), project_id)
  );

-- Policy: Users can update RFIs they created (draft) or are assigned to
CREATE POLICY "Users can update own or assigned RFIs"
  ON rfis FOR UPDATE
  USING (
    project_id IN (SELECT project_id FROM user_project_ids())
    AND (created_by = auth.uid() OR assigned_to_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT project_id FROM user_project_ids())
    AND (created_by = auth.uid() OR assigned_to_id = auth.uid())
  );

-- Policy: Responses inherit RFI access
CREATE POLICY "Users can view responses for accessible RFIs"
  ON rfi_responses FOR SELECT
  USING (rfi_id IN (SELECT id FROM rfis WHERE project_id IN (SELECT project_id FROM user_project_ids())));

-- Policy: Users can add responses to RFIs they have access to
CREATE POLICY "Users can respond to accessible RFIs"
  ON rfi_responses FOR INSERT
  WITH CHECK (rfi_id IN (SELECT id FROM rfis WHERE project_id IN (SELECT project_id FROM user_project_ids())));
```

### Authorization Logic (Server Actions)

```typescript
// Server Action: createRFI()
export async function createRFI(data: CreateRFIInput): Promise<ActionResponse<RFI>> {
  const supabase = await createClient()

  // 1. Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new UnauthorizedError()

  // 2. Verify user is project manager
  const isManager = await supabase.rpc('is_project_manager', {
    user_uuid: user.id,
    check_project_id: data.projectId
  })
  if (!isManager) throw new ForbiddenError('Only project managers can create RFIs')

  // 3. Generate next RFI number
  const number = await supabase.rpc('next_rfi_number', { p_project_id: data.projectId })

  // 4. Create RFI (RLS enforces project access)
  const { data: rfi, error } = await supabase
    .from('rfis')
    .insert({
      ...data,
      number,
      created_by: user.id,
      status: 'draft'
    })
    .select()
    .single()

  if (error) throw error
  return success(rfi)
}
```

## Performance Optimizations

### Database Indexes

Critical indexes for common query patterns:

1. **RFI List (by project)**: `idx_rfis_project_id`
2. **Overdue RFIs**: `idx_rfis_overdue` (partial index on `overdue_at`)
3. **By Assignee**: `idx_rfis_assigned_to_id` (partial index, excludes soft-deleted)
4. **By Discipline**: `idx_rfis_discipline` (for analytics)
5. **Full-text search**: `idx_rfis_search` (GIN index on title + description)

### Caching Strategy

**React Query**:
- **List queries**: 5-minute stale time, background refetch on window focus
- **Detail queries**: 1-minute stale time, optimistic updates on mutations
- **Infinite scroll**: Cursor-based pagination (keyset pagination on `created_at`)

**Supabase Realtime** (Phase 2):
- Subscribe to RFI updates for open detail views
- Broadcast new responses in real-time (WebSocket)

### Virtualization

For large RFI lists (1,000+ items):
- Use TanStack Virtual for windowed rendering
- Render only visible rows (50 at a time)
- Lazy-load attachments and responses on detail view open

## SLA Calculation

### Business Hours Logic

```typescript
// Calculate overdue timestamp based on response_due_date
function calculateOverdueAt(responseDueDate: Date, businessHours: BusinessHours): Date {
  // Simple calendar days for MVP
  // Phase 2: Exclude weekends and holidays
  return responseDueDate
}

// Check if RFI is overdue
function isOverdue(rfi: RFI): boolean {
  if (rfi.status === 'closed' || rfi.status === 'cancelled') return false
  if (!rfi.overdue_at) return false
  return new Date() > new Date(rfi.overdue_at)
}
```

### SLA Tracking Metrics

```sql
-- Average response time by discipline
SELECT
  discipline,
  AVG(EXTRACT(EPOCH FROM (answered_at - submitted_at)) / 3600) AS avg_response_hours,
  COUNT(*) FILTER (WHERE answered_at <= response_due_date) AS on_time_count,
  COUNT(*) FILTER (WHERE answered_at > response_due_date) AS late_count
FROM rfis
WHERE status = 'answered'
  AND project_id = :project_id
  AND deleted_at IS NULL
GROUP BY discipline;
```

## Email Integration

### Email-In (Inbound Parse)

**Flow**:
1. User sends email to `rfi+{project_id}@construction-work-os.com`
2. SendGrid forwards to Supabase Edge Function via webhook
3. Edge Function parses email:
   - Subject → RFI title
   - Body → RFI description
   - Attachments → Upload to Storage
4. Create RFI with status `draft`
5. Send confirmation email to sender

**Edge Function** (`supabase/functions/email-in-rfi/index.ts`):
```typescript
import { serve } from 'std/server'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const { to, from, subject, text, html, attachments } = await req.json()

  // Parse project ID from email address: rfi+{project_id}@...
  const match = to.match(/rfi\+([a-f0-9-]+)@/)
  if (!match) return new Response('Invalid recipient', { status: 400 })

  const projectId = match[1]

  // Create RFI
  const supabase = createClient(...)
  const { data: rfi, error } = await supabase
    .from('rfis')
    .insert({
      project_id: projectId,
      title: subject,
      description: text,
      status: 'draft',
      created_by: from.email // Lookup user by email
    })

  // Upload attachments to Storage
  for (const attachment of attachments) {
    const { data, error } = await supabase.storage
      .from('rfis')
      .upload(`${projectId}/${rfi.id}/${attachment.filename}`, attachment.content)
  }

  return new Response('RFI created', { status: 200 })
})
```

### Email-Out (Notifications)

**Triggers**:
- **Assignment**: When RFI is assigned to a user
- **Response**: When a new response is added
- **Overdue**: When RFI passes `response_due_date`
- **Closure**: When RFI is closed

**Template** (SendGrid dynamic template):
```html
<h2>RFI-{{rfi.number}}: {{rfi.title}}</h2>
<p><strong>Status:</strong> {{rfi.status}}</p>
<p><strong>Ball-in-court:</strong> {{rfi.assigned_to.name}}</p>
<p><strong>Due date:</strong> {{rfi.response_due_date}}</p>
<a href="{{app_url}}/{{org.slug}}/projects/{{project.id}}/rfis/{{rfi.id}}">View RFI</a>
```

## AI Routing (Phase 2)

### Smart Assignment Suggestions

**Approach**:
1. Extract keywords from RFI title + description
2. Match against spec section → discipline mapping
3. Lookup common assignees for that discipline in project
4. Suggest top 3 candidates with confidence score

**Example**:
```typescript
async function suggestAssignee(rfi: RFI): Promise<Suggestion[]> {
  // Extract spec section: "03 30 00" → "Concrete"
  const discipline = specSectionToDiscipline(rfi.spec_section)

  // Find users who frequently handle this discipline
  const candidates = await db.query(`
    SELECT
      assigned_to_id,
      COUNT(*) AS handled_count,
      AVG(EXTRACT(EPOCH FROM (answered_at - submitted_at)) / 3600) AS avg_response_hours
    FROM rfis
    WHERE project_id = :project_id
      AND discipline = :discipline
      AND status = 'answered'
    GROUP BY assigned_to_id
    ORDER BY handled_count DESC, avg_response_hours ASC
    LIMIT 3
  `, { project_id: rfi.project_id, discipline })

  return candidates.map(c => ({
    user_id: c.assigned_to_id,
    confidence: c.handled_count / totalRFIs,
    reason: `Handled ${c.handled_count} ${discipline} RFIs, avg ${c.avg_response_hours}h response time`
  }))
}
```

## Migration Strategy

### Data Migration

No existing RFI data to migrate (greenfield).

### Code Migration

Enable RFI navigation menu item:
```typescript
// components/app-sidebar.tsx
{
  title: 'RFIs',
  icon: FileText,
  href: `/${orgSlug}/projects/${projectId}/rfis`,
  disabled: false, // Change from true → false
}
```

### User Migration

**Pilot Phase** (Week 5-6):
- Select 2-3 early-adopter projects
- Import historical RFIs from spreadsheets (manual CSV import)
- Train project managers on new workflow (30-minute onboarding)

**Rollout Phase** (Week 7-8):
- Enable for all new projects by default
- Gradual migration for existing projects (self-service)

## Monitoring & Observability

### Key Metrics

1. **RFI creation rate**: RFIs created per project per week
2. **Response time**: Median/p95 time from submitted → answered
3. **SLA compliance**: % of RFIs answered within due date
4. **Ball-in-court distribution**: % time in each status
5. **Error rates**: Failed RFI creations, email-in parse errors

### Alerts

- **Overdue RFIs**: Daily digest to project managers
- **Email-in failures**: Sentry alert on parse errors
- **High response time**: Alert if p95 > 5 days for a project

### Dashboards

**Project Dashboard**:
- Total RFIs (all time, this month)
- Open RFIs by status (pie chart)
- Overdue count (red badge)
- Recent activity feed

**Admin Dashboard**:
- RFI volume trends (line chart)
- Response time by discipline (bar chart)
- Top assignees by volume (table)

## Trade-Offs & Future Considerations

### Decisions Made

| Decision | Rationale | Trade-Off |
|----------|-----------|-----------|
| Single assignee per RFI | Simplifies ball-in-court logic | Can't split responsibility (e.g., GC + A/E) |
| Calendar days for SLA | Avoids complexity of business hours | Less accurate for weekends/holidays |
| Email-in via SendGrid | Fast implementation, proven API | Vendor lock-in, parsing fragility |
| No offline support (MVP) | RFIs require collaboration, async OK | Field users must be online |
| JSONB custom fields | Extensibility without schema changes | Query performance penalty for large projects |

### Future Enhancements

1. **Multi-recipient RFIs**: Support co-assignees (e.g., GC + A/E review)
2. **Business hours SLA**: Exclude weekends/holidays from calculations
3. **RFI templates**: Pre-populate common RFI types (spec clarification, product substitution)
4. **Drawing markup**: Annotate PDF sheets directly in RFI context
5. **Offline creation**: Queue RFIs locally, sync when online
6. **External integrations**: Procore RFI import, ACC sync
7. **AI copilot**: Auto-draft responses based on spec Q&A

## References

- **AIA G716**: Standard RFI form (industry reference)
- **CSI MasterFormat**: Spec section numbering (01-50 divisions)
- **Procore RFI Documentation**: Feature comparison
- **SendGrid Inbound Parse API**: Email-in webhook spec
- **Supabase RLS Guides**: Security model patterns
