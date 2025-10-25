# Tasks: Add Project Cost Tracking & Forecasting

## Task Breakdown

### Phase 1: Database Schema & Backend (Days 1-6)

#### 1.1 Create Database Schema
**Duration**: 2 days
**Dependencies**: None
**Deliverables**:
- [ ] Migration: Create `project_budgets` table with ENUM categories
- [ ] Migration: Create `project_invoices` table with AI metadata fields
- [ ] Migration: Create `project_costs` table
- [ ] Migration: Create `project_budget_history` audit table
- [ ] Migration: Create materialized view `project_cost_summary`
- [ ] Migration: Create `calculate_burn_rate()` function
- [ ] Migration: Create RLS policies for all new tables
- [ ] Migration: Create Supabase Storage bucket `project-invoices`
- [ ] Update TypeScript types (`lib/types/supabase.ts`)
- [ ] Test: Verify RLS policies with multiple user roles

**Validation**:
```sql
-- Test budget allocation
INSERT INTO project_budgets (project_id, category, allocated_amount)
VALUES ('uuid', 'labor', 50000.00);

-- Test materialized view
SELECT * FROM project_cost_summary WHERE project_id = 'uuid';

-- Test burn rate calculation
SELECT * FROM calculate_burn_rate('uuid');
```

---

#### 1.2 Budget Allocation Actions
**Duration**: 1 day
**Dependencies**: 1.1
**Deliverables**:
- [ ] Action: `lib/actions/budgets/update-budget-allocation.ts`
- [ ] Schema: `lib/schemas/budget.ts` (Zod validation)
- [ ] Validation: Sum of allocations ≤ project.budget
- [ ] Validation: Require reason if decreasing spent category
- [ ] Action: `lib/actions/budgets/get-budget-breakdown.ts`
- [ ] Test: Update budget allocations
- [ ] Test: Reject allocation exceeding total budget
- [ ] Test: Track changes in `project_budget_history`

**Validation**:
```typescript
// Should succeed
await updateBudgetAllocation({
  projectId: 'uuid',
  allocations: [
    { category: 'labor', amount: 50000 },
    { category: 'materials', amount: 40000 }
  ]
})

// Should fail (exceeds budget)
await updateBudgetAllocation({
  projectId: 'uuid',
  allocations: [
    { category: 'labor', amount: 60000 },
    { category: 'materials', amount: 60000 }
  ]
})
```

---

#### 1.3 Invoice Upload & AI Parsing
**Duration**: 2 days
**Dependencies**: 1.1
**Deliverables**:
- [ ] Action: `lib/actions/invoices/upload-invoice.ts`
- [ ] Function: `lib/services/ai/parse-invoice.ts` (OpenAI Vision integration)
- [ ] Schema: `lib/schemas/invoice.ts`
- [ ] Upload file to Supabase Storage (`project-invoices/{projectId}/{uuid}`)
- [ ] Call OpenAI Vision API with invoice image
- [ ] Parse response → extract amount, vendor, date, line items
- [ ] Calculate confidence score
- [ ] Auto-approve if confidence >0.85
- [ ] Trigger materialized view refresh
- [ ] Action: `lib/actions/invoices/update-invoice.ts` (manual corrections)
- [ ] Action: `lib/actions/invoices/approve-invoice.ts`
- [ ] Action: `lib/actions/invoices/reject-invoice.ts`
- [ ] Test: Upload PDF invoice → verify AI parsing
- [ ] Test: Low confidence → mark as pending review
- [ ] Test: API timeout → graceful fallback
- [ ] Test: Approve invoice → deduct from budget

**OpenAI Prompt**:
```typescript
const prompt = `Extract invoice data in JSON format:
{
  "amount": number,
  "vendor": string,
  "invoiceNumber": string,
  "invoiceDate": "YYYY-MM-DD",
  "confidence": 0.0-1.0
}`
```

**Validation**:
```typescript
const result = await uploadInvoice({
  projectId: 'uuid',
  category: 'materials',
  file: pdfFile
})

expect(result.data.aiParsed).toBe(true)
expect(result.data.amount).toBeGreaterThan(0)
expect(result.data.confidence).toBeGreaterThan(0.85)
```

---

#### 1.4 Manual Cost Entry
**Duration**: 1 day
**Dependencies**: 1.1
**Deliverables**:
- [ ] Action: `lib/actions/costs/create-cost.ts`
- [ ] Action: `lib/actions/costs/update-cost.ts`
- [ ] Action: `lib/actions/costs/delete-cost.ts` (soft delete)
- [ ] Schema: `lib/schemas/cost.ts`
- [ ] Support optional file attachments (receipts, photos)
- [ ] Immediate budget deduction (no approval needed)
- [ ] Trigger materialized view refresh
- [ ] Test: Create cost → verify budget deduction
- [ ] Test: Upload attachment → stored in Supabase Storage
- [ ] Test: Delete cost → restore budget allocation

**Validation**:
```typescript
await createCost({
  projectId: 'uuid',
  category: 'labor',
  amount: 2000,
  description: 'Day workers - concrete pour',
  costDate: '2025-10-24',
  attachments: [receiptPhoto]
})
```

---

### Phase 2: Frontend Components (Days 7-11)

#### 2.1 Budget Allocation Form
**Duration**: 1 day
**Dependencies**: 1.2
**Deliverables**:
- [ ] Component: `components/budgets/budget-allocation-form.tsx`
- [ ] Display total project budget (read-only)
- [ ] Input fields for each category (labor, materials, equipment, other)
- [ ] Live validation: sum ≤ total budget
- [ ] Visual indicator: remaining budget to allocate
- [ ] Integrate with project settings page
- [ ] Test: Allocate budget → verify success
- [ ] Test: Exceed total → show validation error

**UI Mockup**:
```
Total Budget: $100,000
─────────────────────────
Labor:      [  $50,000  ]
Materials:  [  $40,000  ]
Equipment:  [  $8,000   ]
Other:      [  $2,000   ]
─────────────────────────
Allocated:  $100,000 / $100,000 ✓
```

---

#### 2.2 Invoice Upload Modal
**Duration**: 1 day
**Dependencies**: 1.3
**Deliverables**:
- [ ] Component: `components/invoices/invoice-upload-modal.tsx`
- [ ] Drag-and-drop file upload (Uppy integration)
- [ ] Category selector dropdown
- [ ] Manual entry fields (pre-filled after AI parsing)
- [ ] Confidence indicator badge (if AI parsed)
- [ ] Loading state during AI parsing
- [ ] Error handling UI
- [ ] Test: Upload invoice → verify AI pre-fill
- [ ] Test: Manually edit parsed values

**UI Flow**:
```
[Upload Invoice]
├── Drag & Drop Zone
├── Category: [Materials ▼]
├── ─── AI Parsing (confidence: 92%) ───
├── Amount:        [$5,000.00]
├── Vendor:        [ABC Supply]
├── Invoice #:     [INV-1234]
├── Date:          [2025-10-20]
└── [Cancel] [Submit Invoice]
```

---

#### 2.3 Manual Cost Entry Form
**Duration**: 0.5 days
**Dependencies**: 1.4
**Deliverables**:
- [ ] Component: `components/costs/cost-entry-form.tsx`
- [ ] Quick-add modal (amount, category, description, date)
- [ ] Optional file upload for receipts
- [ ] Optimistic UI update
- [ ] Test: Add cost → immediately see in dashboard

---

#### 2.4 Project Cost Dashboard
**Duration**: 2 days
**Dependencies**: 1.2, 1.3, 1.4
**Deliverables**:
- [ ] Page: `app/[orgSlug]/projects/[projectId]/costs/page.tsx`
- [ ] Component: `components/costs/budget-overview-card.tsx`
  - [ ] Progress bars for each category
  - [ ] Spent vs. allocated amounts
  - [ ] Percentage indicators
- [ ] Component: `components/costs/burn-rate-forecast-card.tsx`
  - [ ] Daily burn rate calculation
  - [ ] Forecasted total
  - [ ] Status badge (on-track/warning/critical)
- [ ] Component: `components/costs/transactions-table.tsx`
  - [ ] List of invoices + manual costs
  - [ ] Filter by category, date range
  - [ ] Sort by date, amount
  - [ ] Click to view invoice PDF
- [ ] Test: View dashboard → verify all data displays
- [ ] Test: Filter transactions → verify results
- [ ] Test: Upload invoice → see immediate update (optimistic)

**Dashboard Layout**:
```
┌─────────────────────────────────────────┐
│ Budget Overview                [+Cost] │
├─────────────────────────────────────────┤
│ Labor:     $25K / $50K (50%) ██████░░░ │
│ Materials: $18K / $40K (45%) █████░░░░ │
│ ...                                     │
├─────────────────────────────────────────┤
│ Burn Rate Forecast                      │
│ ⚠️ WARNING - Trending 12.5% over budget │
├─────────────────────────────────────────┤
│ Recent Transactions                     │
│ Oct 24 | Materials | $5,000            │
│ Oct 23 | Labor     | $2,000            │
└─────────────────────────────────────────┘
```

---

#### 2.5 Portfolio Dashboard (Owner View)
**Duration**: 1.5 days
**Dependencies**: 1.2, 2.4
**Deliverables**:
- [ ] Page: `app/[orgSlug]/portfolio/costs/page.tsx`
- [ ] Component: `components/portfolio/project-costs-table.tsx`
  - [ ] Columns: Project, Budget, Spent, % Complete, Forecast
  - [ ] Status indicators (🟢🟡🔴)
  - [ ] Filter by org, status, risk level
  - [ ] Sort by any column
  - [ ] Pagination (100 projects per page)
- [ ] Component: `components/portfolio/cost-summary-cards.tsx`
  - [ ] Total allocated across all projects
  - [ ] Total spent across all projects
  - [ ] Count of projects at risk
- [ ] Test: View portfolio → verify aggregates
- [ ] Test: Filter by risk → verify results
- [ ] Test: Click project → navigate to project dashboard

---

### Phase 3: Testing & Documentation (Days 12-14)

#### 3.1 E2E Tests
**Duration**: 1.5 days
**Dependencies**: All Phase 2 tasks
**Deliverables**:
- [ ] Test: Create project → allocate budget → upload invoice → verify deduction
- [ ] Test: Upload low-confidence invoice → manually correct → approve
- [ ] Test: Add manual cost → verify dashboard update
- [ ] Test: Simulate burn rate warning (50% spend at 25% timeline)
- [ ] Test: Portfolio view with multiple projects at different risk levels
- [ ] Test: File upload error handling (timeout, too large, unsupported format)

**Test Scenarios**:
```typescript
test('Happy path: Budget allocation → Invoice upload → Deduction', async () => {
  // 1. Create project with $100K budget
  // 2. Allocate $50K labor, $50K materials
  // 3. Upload $10K materials invoice
  // 4. Verify: Materials spent = $10K, remaining = $40K
})

test('Burn rate alert at 50% spend, 25% timeline', async () => {
  // 1. Create 4-week project
  // 2. Fast-forward to week 1 (25% elapsed)
  // 3. Add costs totaling 50% of budget
  // 4. Verify: Dashboard shows "WARNING" status
})
```

---

#### 3.2 Performance Testing
**Duration**: 0.5 days
**Dependencies**: All Phase 2 tasks
**Deliverables**:
- [ ] Load test: 1000 invoices per project → measure dashboard render (<1s)
- [ ] Load test: 10 concurrent uploads → verify no deadlocks
- [ ] Load test: Materialized view refresh with 10,000 cost entries (<500ms)
- [ ] Lighthouse audit: Cost dashboard scores >90 Performance

---

#### 3.3 Documentation
**Duration**: 1 day
**Dependencies**: All Phase 2 tasks
**Deliverables**:
- [ ] User guide: How to set up project budgets
- [ ] User guide: Uploading invoices and managing costs
- [ ] User guide: Interpreting burn rate forecasts
- [ ] Developer docs: AI invoice parsing integration
- [ ] Developer docs: Budget allocation validation rules
- [ ] API docs: Server actions and return types

---

## Parallelizable Work

These tasks can be done concurrently:
- **1.2, 1.3, 1.4** (after 1.1 complete) - Different team members can work on budget/invoice/cost actions
- **2.1, 2.2, 2.3** (after Phase 1 complete) - UI components are independent
- **3.1, 3.2** (after Phase 2 complete) - E2E and performance tests can run in parallel

## Risk Mitigation

**High-Risk Tasks** (require extra QA):
- **1.3**: AI invoice parsing accuracy - Plan for manual review workflow
- **1.1**: Materialized view performance - Test with realistic data volumes
- **2.4**: Dashboard reactivity - Ensure optimistic updates don't cause UI flicker

**Blocked Dependencies**:
- Phase 2 cannot start until Phase 1 database schema is deployed
- Phase 3 E2E tests require all UI components functional

---

## Total Effort Estimate
- **Phase 1 (Backend)**: 6 days
- **Phase 2 (Frontend)**: 5 days
- **Phase 3 (Testing/Docs)**: 3 days
- **Total**: ~14 working days (2.8 weeks)

## Success Criteria
- [ ] All database migrations applied successfully
- [ ] All E2E tests passing (>90% coverage on cost workflows)
- [ ] Invoice AI parsing accuracy >85% on test dataset
- [ ] Cost dashboard loads in <500ms
- [ ] Portfolio dashboard handles 500+ projects without lag
- [ ] Documentation complete and reviewed
- [ ] Product owner sign-off on UI/UX

---
**Tasks Version**: 1.0
**Last Updated**: 2025-10-25
