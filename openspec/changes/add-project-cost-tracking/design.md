# Design: Project Cost Tracking & Forecasting

## Architecture Overview

This feature extends the existing project management system with a comprehensive cost tracking layer that operates alongside the current budget field while adding granular category-level tracking, automated invoice processing, and predictive financial analytics.

```
┌─────────────────────────────────────────────────────────────────┐
│                     PROJECT COST TRACKING                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │   Project    │───▶│   Budget     │───▶│  Cost Tracking  │  │
│  │   Entity     │    │  Categories  │    │   Dashboard     │  │
│  └──────────────┘    └──────────────┘    └─────────────────┘  │
│         │                    │                      │           │
│         │                    │                      │           │
│         ▼                    ▼                      ▼           │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │   Invoice    │    │   Manual     │    │   Burn Rate     │  │
│  │  Management  │    │    Costs     │    │   Forecasting   │  │
│  │  + AI Parse  │    │              │    │                 │  │
│  └──────────────┘    └──────────────┘    └─────────────────┘  │
│         │                    │                      │           │
│         └────────────────────┴──────────────────────┘           │
│                              │                                  │
│                              ▼                                  │
│                     ┌─────────────────┐                        │
│                     │   Portfolio     │                        │
│                     │   Dashboard     │                        │
│                     └─────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

## Data Model

### Core Tables

#### 1. `project_budgets` (extends projects)
Stores budget allocations per category for each project.

```sql
CREATE TABLE project_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category project_budget_category NOT NULL,
  allocated_amount DECIMAL(15, 2) NOT NULL CHECK (allocated_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(project_id, category, deleted_at)
);

CREATE TYPE project_budget_category AS ENUM ('labor', 'materials', 'equipment', 'other');

CREATE INDEX idx_project_budgets_project ON project_budgets(project_id) WHERE deleted_at IS NULL;
```

**Design Rationale**:
- Separate table (vs. JSONB in projects) for easier querying, aggregation, and validation
- ENUM for categories ensures consistency, extensible for future custom categories via migration
- Unique constraint prevents duplicate category entries per project
- `deleted_at` in unique constraint allows soft-delete without breaking constraint

#### 2. `project_invoices`
Stores uploaded invoice files and metadata.

```sql
CREATE TABLE project_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  budget_category project_budget_category NOT NULL,

  -- File storage
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,

  -- Invoice details (AI-parsed or manually entered)
  vendor_name TEXT,
  invoice_number TEXT,
  invoice_date DATE,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
  description TEXT,

  -- AI parsing metadata
  ai_parsed BOOLEAN DEFAULT FALSE,
  ai_confidence DECIMAL(3, 2), -- 0.00 to 1.00
  ai_raw_response JSONB, -- Store full OpenAI response for audit

  -- Approval workflow
  status invoice_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,

  -- Audit
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TYPE invoice_status AS ENUM ('pending', 'approved', 'rejected', 'paid');

CREATE INDEX idx_invoices_project ON project_invoices(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_status ON project_invoices(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_date ON project_invoices(invoice_date DESC);
```

**Design Rationale**:
- `ai_confidence` helps users decide when to manually review
- `ai_raw_response` JSONB preserves full OpenAI output for debugging/reprocessing
- Status workflow allows optional approval step (configurable per org)
- Foreign key to `auth.users` (not profiles) for consistency with recent schema fixes

#### 3. `project_costs`
Manual cost entries without invoices.

```sql
CREATE TABLE project_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  budget_category project_budget_category NOT NULL,

  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  cost_date DATE NOT NULL,

  -- Optional attachments (receipts, photos)
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of {file_path, file_name}

  -- Audit
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_costs_project ON project_costs(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_costs_date ON project_costs(cost_date DESC);
```

**Design Rationale**:
- Simpler than invoices (no AI parsing, no approval workflow)
- JSONB attachments for flexible photo/receipt count
- `cost_date` allows backdating entries for past expenses

#### 4. `project_budget_history` (Audit Trail)
Tracks changes to budget allocations.

```sql
CREATE TABLE project_budget_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_budget_id UUID NOT NULL REFERENCES project_budgets(id) ON DELETE CASCADE,
  old_amount DECIMAL(15, 2),
  new_amount DECIMAL(15, 2) NOT NULL,
  reason TEXT,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_budget_history_budget ON project_budget_history(project_budget_id);
```

**Design Rationale**:
- Separate history table (vs. triggers updating projects) for clear audit trail
- `reason` field captures PM justification for mid-project budget adjustments
- Immutable (no updates/deletes) for compliance

### Database Views & Functions

#### 1. `project_cost_summary` (Materialized View)
Pre-aggregated cost data for fast dashboard queries.

```sql
CREATE MATERIALIZED VIEW project_cost_summary AS
SELECT
  p.id AS project_id,
  p.budget AS total_budget,
  b.category,
  b.allocated_amount,
  COALESCE(spent.amount, 0) AS spent_amount,
  b.allocated_amount - COALESCE(spent.amount, 0) AS remaining_amount,
  CASE
    WHEN b.allocated_amount > 0
    THEN (COALESCE(spent.amount, 0) / b.allocated_amount * 100)
    ELSE 0
  END AS spent_percentage
FROM projects p
JOIN project_budgets b ON p.id = b.project_id
LEFT JOIN (
  SELECT
    project_id,
    budget_category,
    SUM(amount) AS amount
  FROM (
    SELECT project_id, budget_category, amount
    FROM project_invoices
    WHERE status = 'approved' AND deleted_at IS NULL
    UNION ALL
    SELECT project_id, budget_category, amount
    FROM project_costs
    WHERE deleted_at IS NULL
  ) costs
  GROUP BY project_id, budget_category
) spent ON p.id = spent.project_id AND b.category = spent.budget_category
WHERE p.deleted_at IS NULL AND b.deleted_at IS NULL;

CREATE UNIQUE INDEX idx_cost_summary_project_category ON project_cost_summary(project_id, category);
CREATE INDEX idx_cost_summary_project ON project_cost_summary(project_id);

-- Refresh function (call after invoice approval or cost entry)
CREATE OR REPLACE FUNCTION refresh_cost_summary()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY project_cost_summary;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_cost_summary_on_invoice
AFTER INSERT OR UPDATE OR DELETE ON project_invoices
FOR EACH STATEMENT EXECUTE FUNCTION refresh_cost_summary();

CREATE TRIGGER refresh_cost_summary_on_cost
AFTER INSERT OR UPDATE OR DELETE ON project_costs
FOR EACH STATEMENT EXECUTE FUNCTION refresh_cost_summary();
```

**Design Rationale**:
- Materialized view (vs. regular view) for <50ms query times on dashboards
- CONCURRENTLY option allows reads during refresh
- Triggers auto-refresh on data changes (acceptable for ~10-20 updates/day typical load)

#### 2. `calculate_burn_rate()` Function
Computes project burn rate and forecast.

```sql
CREATE OR REPLACE FUNCTION calculate_burn_rate(p_project_id UUID)
RETURNS TABLE (
  days_elapsed INTEGER,
  days_total INTEGER,
  days_remaining INTEGER,
  total_spent DECIMAL(15, 2),
  daily_burn_rate DECIMAL(15, 2),
  forecasted_total DECIMAL(15, 2),
  forecasted_overrun DECIMAL(15, 2),
  status TEXT -- 'on_track', 'warning', 'critical'
) AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_budget DECIMAL(15, 2);
BEGIN
  -- Get project timeline and budget
  SELECT start_date, end_date, budget
  INTO v_start_date, v_end_date, v_budget
  FROM projects
  WHERE id = p_project_id AND deleted_at IS NULL;

  -- Calculate days
  days_elapsed := GREATEST(0, CURRENT_DATE - v_start_date);
  days_total := GREATEST(1, v_end_date - v_start_date);
  days_remaining := GREATEST(0, v_end_date - CURRENT_DATE);

  -- Get total spent
  SELECT COALESCE(SUM(spent_amount), 0)
  INTO total_spent
  FROM project_cost_summary
  WHERE project_id = p_project_id;

  -- Calculate burn rate and forecast
  IF days_elapsed > 0 THEN
    daily_burn_rate := total_spent / days_elapsed;
    forecasted_total := total_spent + (daily_burn_rate * days_remaining);
  ELSE
    daily_burn_rate := 0;
    forecasted_total := 0;
  END IF;

  forecasted_overrun := forecasted_total - v_budget;

  -- Determine status
  IF forecasted_total <= v_budget * 1.10 THEN
    status := 'on_track';
  ELSIF forecasted_total <= v_budget * 1.25 THEN
    status := 'warning';
  ELSE
    status := 'critical';
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql STABLE;
```

**Design Rationale**:
- STABLE function (not IMMUTABLE) since it uses CURRENT_DATE
- Handles edge cases (project not started, past end date, zero budget)
- Thresholds (110% warning, 125% critical) configurable via org settings in future

## API Design

### Server Actions

#### 1. Invoice Upload & Processing
```typescript
// lib/actions/invoices/upload-invoice.ts
export async function uploadInvoice(input: {
  projectId: string
  category: 'labor' | 'materials' | 'equipment' | 'other'
  file: File
}): Promise<ActionResponse<{
  id: string
  aiParsed: boolean
  amount?: number
  vendor?: string
  confidence?: number
}>>
```

**Workflow**:
1. Upload file to Supabase Storage (`project-invoices/{projectId}/{uuid}.pdf`)
2. Call OpenAI Vision API to extract: amount, vendor, date, line items
3. Insert `project_invoices` record with parsed data + confidence score
4. If confidence >0.85, auto-approve; otherwise mark as pending review
5. Trigger materialized view refresh

#### 2. Manual Cost Entry
```typescript
// lib/actions/costs/create-cost.ts
export async function createCost(input: {
  projectId: string
  category: 'labor' | 'materials' | 'equipment' | 'other'
  amount: number
  description: string
  costDate: string // YYYY-MM-DD
  attachments?: File[]
}): Promise<ActionResponse<{ id: string }>>
```

#### 3. Budget Allocation Update
```typescript
// lib/actions/budgets/update-budget.ts
export async function updateBudgetAllocation(input: {
  projectId: string
  allocations: Array<{
    category: 'labor' | 'materials' | 'equipment' | 'other'
    amount: number
  }>
  reason?: string
}): Promise<ActionResponse<{}>>
```

**Validation**:
- Sum of allocations must not exceed project.budget
- Require `reason` if decreasing an allocation that's already partially spent

#### 4. Get Burn Rate Forecast
```typescript
// lib/actions/forecasting/get-burn-rate.ts
export async function getBurnRateForecast(projectId: string): Promise<ActionResponse<{
  daysElapsed: number
  daysRemaining: number
  totalSpent: number
  dailyBurnRate: number
  forecastedTotal: number
  forecastedOverrun: number
  status: 'on_track' | 'warning' | 'critical'
}>>
```

## UI Components

### 1. Budget Allocation Form
**Location**: Project Settings → Budget Tab
**Components**:
- Total budget display (read-only, from `projects.budget`)
- Category allocation inputs (labor, materials, equipment, other)
- Live validation: sum ≤ total budget
- Reallocate warning if categories already have expenses

### 2. Invoice Upload Modal
**Components**:
- Drag-and-drop file upload (Uppy)
- Category selector (labor/materials/equipment/other)
- Optional manual entry fields (amount, vendor, date) - pre-filled if AI parsing succeeds
- Confidence indicator (if AI parsed)
- Submit → triggers upload action

### 3. Cost Tracking Dashboard (Project-Level)
**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  Budget Overview                                   [+Cost]  │
├─────────────────────────────────────────────────────────────┤
│  Labor:       $25,000 / $50,000 (50%) ██████░░░░░░░░        │
│  Materials:   $18,000 / $40,000 (45%) █████░░░░░░░░░        │
│  Equipment:   $3,000  / $8,000  (38%) ████░░░░░░░░░░        │
│  Other:       $1,000  / $2,000  (50%) ██████░░░░░░░░        │
│  ───────────────────────────────────────────────────────    │
│  Total:       $47,000 / $100,000 (47%)                      │
├─────────────────────────────────────────────────────────────┤
│  Burn Rate Forecast                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Daily Rate: $1,250    Forecasted: $112,500          │   │
│  │ Status: ⚠️ WARNING - Trending 12.5% over budget     │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Recent Transactions                                        │
│  ─────────────────────────────────────────────────────────  │
│  Oct 24 | Materials | Invoice #1234 | $5,000              │
│  Oct 23 | Labor     | Day workers   | $2,000              │
│  Oct 22 | Equipment | Crane rental  | $1,500              │
└─────────────────────────────────────────────────────────────┘
```

### 4. Portfolio Dashboard (Owner-Level)
**Features**:
- Table view of all active projects
- Columns: Project, Total Budget, Spent, Remaining, % Complete, Forecast Status
- Filter by org, status, budget risk (on-track/warning/critical)
- Sort by any column
- Drill-down to project cost dashboard

## AI Invoice Parsing

### OpenAI Vision Integration
**Prompt Template**:
```
You are an invoice parser for construction projects. Extract the following information from this invoice image:

REQUIRED:
- Total amount (numeric, USD)
- Vendor name
- Invoice number
- Invoice date (YYYY-MM-DD)

OPTIONAL:
- Line items (description, quantity, unit price, total)

Return JSON in this format:
{
  "amount": 5000.00,
  "vendor": "ABC Materials Supply",
  "invoiceNumber": "INV-12345",
  "invoiceDate": "2025-10-20",
  "lineItems": [
    {"description": "Lumber 2x4x8", "quantity": 100, "unitPrice": 8.50, "total": 850.00},
    ...
  ],
  "confidence": 0.95
}

If you cannot extract a value with high confidence, omit it from the response.
```

**Confidence Calculation**:
- 1.0: All required fields extracted with high confidence
- 0.8-0.99: Required fields extracted but some OCR ambiguity
- 0.5-0.79: Missing optional fields or low-quality image
- <0.5: Missing required fields → mark for manual review

**Error Handling**:
- API timeout (>30s): Save invoice, mark as "pending manual entry"
- Rate limit: Queue for retry (exponential backoff)
- Parse failure: Allow full manual entry with AI response attached for debugging

## Performance Considerations

### Query Optimization
- **Materialized view refresh**: Runs in <100ms for projects with <1000 cost entries
- **Dashboard load time**: <500ms (materialized view + 2-3 joins)
- **Burn rate calculation**: <50ms (single function call)

### Caching Strategy
- **React Query**: Cache cost summary for 5 minutes
- **Stale-while-revalidate**: Show cached data, refresh in background
- **Optimistic updates**: Immediately update UI on cost entry, rollback if server fails

### File Upload
- **Max invoice size**: 25MB (Supabase Storage limit: 50MB, leave headroom)
- **Resumable uploads**: Use existing TUS implementation
- **Image compression**: Auto-resize invoices >5MB for faster AI parsing

## Security & RLS

### Row-Level Security Policies

```sql
-- project_budgets
ALTER TABLE project_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view budgets for projects they have access to"
  ON project_budgets FOR SELECT
  USING (project_id IN (SELECT project_id FROM user_project_ids()));

CREATE POLICY "Managers can update budgets"
  ON project_budgets FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_access
      WHERE user_id = auth.uid()
      AND role IN ('manager')
      AND deleted_at IS NULL
    )
  );

-- project_invoices
ALTER TABLE project_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoices for their projects"
  ON project_invoices FOR SELECT
  USING (project_id IN (SELECT project_id FROM user_project_ids()));

CREATE POLICY "Managers can upload invoices"
  ON project_invoices FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_access
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'supervisor')
      AND deleted_at IS NULL
    )
  );

-- project_costs
-- Similar patterns to project_invoices
```

### File Storage Policies

```sql
-- Supabase Storage bucket policy
CREATE POLICY "Users can upload invoices to their projects"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-invoices' AND
    (storage.foldername(name))[1] IN (
      SELECT project_id::text FROM user_project_ids()
    )
  );

CREATE POLICY "Users can view invoices from their projects"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-invoices' AND
    (storage.foldername(name))[1] IN (
      SELECT project_id::text FROM user_project_ids()
    )
  );
```

## Testing Strategy

### Unit Tests
- Budget allocation validation (sum ≤ total)
- Burn rate calculation edge cases (zero days, negative remaining)
- AI parsing confidence scoring

### Integration Tests
- Invoice upload → AI parse → budget deduction flow
- Manual cost entry → view refresh → dashboard update
- Budget reallocation → history tracking

### E2E Tests (Playwright)
1. **Happy path**: Create project → allocate budget → upload invoice → verify deduction
2. **Manual review**: Upload low-confidence invoice → manually correct → approve
3. **Burn rate alert**: Simulate 50% spend at 25% timeline → verify warning badge
4. **Portfolio view**: Create 3 projects with different risk levels → filter/sort

### Performance Tests
- Load 1000 invoices → measure dashboard render time (target: <1s)
- Concurrent uploads (10 users × 5 invoices) → no deadlocks
- Materialized view refresh with 10,000 cost entries (target: <500ms)

---
**Design Version**: 1.0
**Last Updated**: 2025-10-25
**Reviewers**: _Pending_
