# Proposal: Add Change Orders Module

**Change ID**: `add-change-orders-module`
**Status**: Draft
**Author**: AI Agent
**Date**: 2025-01-25

## Summary

Implement a complete Change Orders module to enable construction teams to manage contract modifications for scope, cost, and schedule changes. Change orders are critical for maintaining contract integrity and financial accuracy, requiring tracking through contemplated → potential → proposed → approved workflows with multi-party approvals, cost impact analysis, and integration with RFIs, submittals, and project budgets.

## Motivation

Change orders are essential for managing contract modifications and maintaining financial accuracy in construction projects. Currently, teams rely on email chains, spreadsheets, and manual document workflows, leading to:

- **Lost change requests**: Scattered across emails, no centralized change event log
- **Financial discrepancies**: Manual cost tracking leads to budget overruns and billing disputes
- **Approval bottlenecks**: No visibility into approval chains (GC → Owner → Architect)
- **Poor traceability**: Difficult to link change orders to originating RFIs or conditions
- **Schedule impact blindness**: No systematic tracking of time extensions from changes
- **Contract compliance gaps**: Missing documentation required for legal defensibility
- **Delayed invoicing**: Change order approval delays prevent timely billing

**Target improvement**: Enable complete change order lifecycle management with automated cost/schedule tracking, achieving >85% same-day change event capture rate and ↓30% approval cycle time vs baseline (email/spreadsheets).

## Goals

1. **Complete change order lifecycle**: Contemplated → Potential (PCO) → Proposed (COR) → Approved (CO) → Invoiced
2. **Multi-party approval workflow**: GC → Owner → Architect approval chains with ball-in-court tracking
3. **Cost impact tracking**: Line item pricing, tax calculations, budget impact, cumulative contract value
4. **Schedule impact tracking**: Time extensions, critical path impact, completion date adjustments
5. **Originating event linking**: Connect change orders to RFIs, submittals, site conditions, design changes
6. **Version control**: Handle revisions, negotiations, counter-proposals with full history
7. **Sequential numbering**: Auto-generated per project (CO-001, PCO-001, etc.)
8. **Document generation**: AIA G701 Change Order forms, cost breakdowns, approval records
9. **Budget integration**: Real-time contract value updates, budget vs actual tracking
10. **Audit compliance**: Immutable history of all pricing, approvals, and contract modifications

## Non-Goals (Deferred to Future)

- **QuickBooks/Sage API integration**: Automatic sync to accounting systems (Phase 2)
- **Advanced cost estimating**: Built-in cost database, unit pricing libraries (Phase 2)
- **AI pricing analysis**: Automatic markup verification, competitive pricing analysis (Phase 3)
- **Drawing markup integration**: On-plan scope visualization (requires PDF viewer module)
- **Subcontractor portal**: Dedicated interface for sub change requests (Phase 2)
- **Lien waiver tracking**: Conditional/unconditional waivers tied to change order payments (Phase 3)
- **Multi-currency support**: International projects (Phase 3)

## Scope

### In Scope

**Database & Backend**:
- `change_orders` table with RLS policies scoped to project access
- `change_order_line_items` table for detailed cost breakdowns
- `change_order_approvals` table for multi-stage approval tracking
- `change_order_versions` table for revision history and negotiations
- `change_order_attachments` table for supporting documents
- Sequential numbering functions per project and type (CO-001, PCO-001, COR-001)
- Change order status enum: `contemplated`, `potential`, `proposed`, `approved`, `rejected`, `cancelled`, `invoiced`
- Change order type enum: `scope_change`, `design_change`, `site_condition`, `owner_requested`, `time_extension`, `cost_only`, `schedule_only`
- Cost tracking: line items, tax, overhead/profit markup, cumulative contract value
- Schedule tracking: days added/deducted, new completion date, critical path impact
- Originating event tracking: link to RFI, submittal, daily report, or manual entry
- Audit logging triggers for all change order mutations

**API & Server Actions**:
- CRUD operations: Create, read, update, delete (soft delete) change orders
- Status transitions with validation: Contemplated → Potential → Proposed → Approved → Invoiced
- Line item operations: Add, update, delete cost line items with CSI section mapping
- Approval operations: Submit for approval, approve, reject, request revision
- Version operations: Create revision (negotiate pricing), view version history
- Document operations: Generate AIA G701, cost breakdown PDF, approval records
- Budget operations: Calculate cumulative contract value, budget impact, variance analysis
- Integration operations: Link to originating RFIs, submittals, daily report incidents
- Analytics queries: Pending change orders, approval cycle times, cost impact by type

**UI Components**:
- Change order list view with filters (status, type, cost range, originating event)
- Change order detail view with line items, approvals timeline, and version history
- Change order creation form with originating event picker
- Line item editor with CSI section picker, quantity, unit cost, extended cost
- Multi-stage approval workflow UI showing current stage and ball-in-court
- Version comparison view for negotiations (original vs revised pricing)
- Budget impact dashboard showing cumulative contract value and variance
- Document generation dialog (AIA G701 PDF, cost breakdown, approval records)
- Quick actions: Submit for approval, approve, reject, revise, invoice

**Integrations**:
- **RFI integration**: Link change orders to originating RFIs, auto-populate scope from RFI description
- **Submittal integration**: Link change orders to product substitutions or upgraded materials
- **Daily report integration**: Link change orders to site conditions or incidents reported in daily logs
- **Project budget**: Real-time update of contract value, budget vs actual tracking
- **Email notifications**: Approval requests, status changes, rejection reasons
- **QuickBooks export**: Cost line items CSV for manual import (Phase 1: manual, Phase 2: API)
- **AIA forms**: Generate G701 Change Order form with proper formatting and signatures

### Out of Scope (This Proposal)

- Accounting system API integration (manual export only)
- Drawing markup for scope visualization
- Advanced cost estimating (unit pricing libraries)
- AI pricing analysis
- Subcontractor portal
- Lien waiver tracking
- Multi-currency support

## Affected Capabilities

### New Capabilities

1. **`change-order-lifecycle`**: Core change order CRUD operations and status workflow management
2. **`change-order-approvals`**: Multi-stage approval workflow, ball-in-court tracking, rejection handling
3. **`change-order-line-items`**: Detailed cost breakdowns, CSI section mapping, tax/markup calculations
4. **`change-order-versions`**: Revision handling for negotiations, version history, pricing comparisons
5. **`change-order-budgeting`**: Contract value tracking, budget impact analysis, variance reporting
6. **`change-order-documents`**: AIA G701 generation, cost breakdown PDFs, approval records
7. **`change-order-integrations`**: Linking to RFIs, submittals, daily reports, project budgets

### Modified Capabilities

- **`project-management`**: Add change orders count to project dashboard, cumulative contract value display
- **`navigation`**: Enable change orders navigation menu item (currently disabled in UI)
- **`notifications`**: Extend notification system for change order events (approval requests, rejections)
- **`rfi-lifecycle`**: Add "Create Change Order" action from RFI detail view
- **`submittal-lifecycle`**: Add "Create Change Order" action from submittal for substitutions
- **`daily-reports`**: Add "Create Change Order" action from incidents (site conditions, delays)

## Dependencies

### Technical Dependencies

- **Foundation (Completed)**: Auth, multi-tenancy, RLS, audit logging
- **Supabase Storage**: For change order attachments (quotes, drawings, supporting docs)
- **Email service** (SendGrid/Postmark): For approval notifications
- **React Query**: For optimistic updates and cache management
- **PDF generation** (react-pdf or Puppeteer): For AIA G701 and cost breakdown exports

### Feature Dependencies

- **RFI module (Partially Complete)**: For originating event linking (77/276 tasks)
- **Submittal module (Planned)**: For product substitution change orders (0/421 tasks)
- **Daily Reports module (Planned)**: For site condition change orders (0/439 tasks)
- **Project foundation (Complete)**: For budget tracking (72/73 tasks)

**Implementation Strategy**: Build change orders with placeholder integration points for submittals and daily reports. Full integration will be enabled as those modules are completed.

## Implementation Approach

### Architecture

**Data Model**:
```
change_orders
├── id (uuid, PK)
├── project_id (uuid, FK → projects, indexed)
├── number (text, auto-generated: "CO-001", "PCO-001", "COR-001", unique per project)
├── title (text)
├── description (text)
├── type (enum: scope_change|design_change|site_condition|owner_requested|time_extension|cost_only|schedule_only)
├── status (enum: contemplated|potential|proposed|approved|rejected|cancelled|invoiced)
├── originating_event_type (enum: rfi|submittal|daily_report|manual, nullable)
├── originating_event_id (uuid, nullable, polymorphic reference)
├── cost_impact (numeric, total cost change)
├── schedule_impact_days (integer, days added/deducted)
├── new_completion_date (date, nullable)
├── created_by (uuid, FK → profiles)
├── submitted_at (timestamptz)
├── approved_at (timestamptz)
├── rejected_at (timestamptz)
├── invoiced_at (timestamptz)
├── current_version (integer, default 1)
├── custom_fields (jsonb)
├── created_at, updated_at, deleted_at
└── RLS: user_project_ids() filter

change_order_line_items
├── id (uuid, PK)
├── change_order_id (uuid, FK → change_orders)
├── version (integer, tracks which version this line item belongs to)
├── csi_section (text, e.g., "03 30 00")
├── description (text)
├── quantity (numeric)
├── unit (text, e.g., "CY", "SF", "EA")
├── unit_cost (numeric)
├── extended_cost (numeric, computed: quantity * unit_cost)
├── tax_rate (numeric, default 0)
├── tax_amount (numeric, computed)
├── total_amount (numeric, computed: extended_cost + tax_amount)
├── sort_order (integer)
├── created_at, updated_at
└── RLS: via change_order.project_id

change_order_approvals
├── id (uuid, PK)
├── change_order_id (uuid, FK → change_orders)
├── version (integer, which version is being approved)
├── stage (enum: gc_review|owner_approval|architect_approval, sequenced)
├── approver_id (uuid, FK → profiles, nullable for org-level approvals)
├── approver_org_id (uuid, FK → organizations, for external approvals)
├── status (enum: pending|approved|rejected|skipped)
├── decision_at (timestamptz)
├── notes (text, rejection reasons or approval comments)
├── created_at, updated_at
└── RLS: via change_order.project_id

change_order_versions
├── id (uuid, PK)
├── change_order_id (uuid, FK → change_orders)
├── version_number (integer, 1, 2, 3...)
├── created_by (uuid, FK → profiles)
├── reason (text, "Initial proposal", "Owner negotiation", "Revised pricing")
├── cost_impact (numeric, version-specific total)
├── schedule_impact_days (integer, version-specific)
├── created_at
└── RLS: via change_order.project_id

change_order_attachments
├── id (uuid, PK)
├── change_order_id (uuid, FK → change_orders)
├── file_path (text, Supabase Storage path)
├── file_name (text)
├── file_size (bigint)
├── file_type (text, MIME type)
├── category (enum: quote|drawing|photo|contract|other)
├── uploaded_by (uuid, FK → profiles)
├── created_at
└── RLS: via change_order.project_id
```

**State Machine** (Change Order Status):
```
contemplated → potential → proposed → approved → invoiced
         ↓          ↓          ↓          ↓
    cancelled  cancelled  rejected   cancelled
                              ↓
                         proposed (resubmit with new version)
```

**Approval Workflow**:
```
1. GC Review (internal review, cost verification)
   ↓
2. Owner Approval (budget approval, scope approval)
   ↓
3. Architect Approval (design compliance, spec verification) [optional]
   ↓
4. Approved → Ready for execution and invoicing
```

**Ball-in-Court Rules**:
- **Contemplated**: Creator (gathering information, not yet ready)
- **Potential (PCO)**: Pricing team (developing cost estimate)
- **Proposed (COR)**: GC → Owner → Architect (approval chain)
- **Approved**: Project manager (schedule execution, invoice)
- **Rejected**: Creator (revise and resubmit or cancel)
- **Invoiced**: Accounting (billing complete)

### Technical Decisions

1. **Sequential Numbering**: Use Postgres sequences per project + type (CO-001, PCO-001, COR-001), handle conflicts with retry logic
2. **Line Item Storage**: Separate table for flexible cost breakdowns, supports unlimited line items
3. **Version Control**: New version creates snapshot of line items, enables before/after comparison
4. **Approval Workflow**: Configurable stages per project settings, default to GC → Owner → Architect
5. **Cost Calculations**: Server-side computed columns + client-side validation, prevent tampering
6. **Originating Events**: Polymorphic references with type + ID, validate referential integrity in application layer
7. **Budget Integration**: Trigger-based updates to project cumulative_contract_value field
8. **AIA G701 Generation**: React-PDF for browser-based PDF generation, fallback to server-side Puppeteer for complex layouts
9. **Offline Support**: Not in MVP (change orders require multi-party coordination), defer to Phase 2

### Orchestrator Pattern for Implementation

This module will use an **orchestrator delegation strategy** for implementation:

**Orchestrator Role**:
- Maintains high-level overview of all tasks
- Delegates to specialized sub-agents for specific domains
- Ensures integration points are properly coordinated
- Monitors progress and resolves blockers

**Specialized Sub-Agents**:
1. **`/database` agent**: Create migrations, RLS policies, indexes, triggers
2. **`/test-writer` agent**: Write comprehensive unit and integration tests
3. **`/domain-validator` agent**: Verify construction industry compliance (AIA forms, CSI codes)
4. **`/code-review` agent**: Review completed code before archiving
5. **`/build-doctor` agent**: Diagnose and fix any TypeScript or build errors
6. **`/debugger` agent**: Fix specific runtime errors or bugs
7. **`/performance` agent**: Optimize queries and rendering for large datasets

**Orchestrator Workflow**:
```
Orchestrator
├── Database Schema Phase
│   └── Delegates to /database agent
│       ├── Create change_orders table + RLS
│       ├── Create change_order_line_items table + RLS
│       ├── Create change_order_approvals table + RLS
│       ├── Create change_order_versions table + RLS
│       ├── Create change_order_attachments table + RLS
│       └── Create triggers for budget updates
│
├── Backend Logic Phase
│   ├── Orchestrator implements Server Actions
│   ├── Delegates to /test-writer for test coverage
│   └── Delegates to /build-doctor if errors arise
│
├── Frontend UI Phase
│   ├── Orchestrator implements React components
│   ├── Delegates to /test-writer for component tests
│   ├── Delegates to /domain-validator for AIA compliance
│   └── Delegates to /performance for optimization
│
├── Integration Phase
│   ├── Orchestrator connects RFIs → Change Orders
│   ├── Orchestrator connects Submittals → Change Orders (placeholder)
│   ├── Orchestrator connects Daily Reports → Change Orders (placeholder)
│   ├── Delegates to /test-writer for integration tests
│   └── Delegates to /debugger for integration issues
│
├── Document Generation Phase
│   ├── Orchestrator implements AIA G701 PDF generation
│   ├── Delegates to /domain-validator for form accuracy
│   └── Delegates to /test-writer for PDF output tests
│
└── Final Review Phase
    ├── Delegates to /code-review for quality check
    ├── Delegates to /performance for final optimization
    └── Delegates to /build-doctor for final build verification
```

**Available MCP Integrations**:
- **Docker MCP**: For local database testing and migration verification
- **Playwright MCP**: For E2E testing of change order workflows
- **Chrome DevTools MCP**: For debugging and performance profiling

## Testing Strategy

### Unit Tests
- Change order CRUD Server Actions
- Status transition validation logic
- Sequential numbering collision handling
- Line item cost calculations (extended cost, tax, totals)
- Approval workflow state machine
- Budget cumulative contract value calculations

### Integration Tests
- RLS policies for change orders (SQL tests)
- Multi-stage approval workflow (GC → Owner → Architect)
- Originating event linking (RFI → Change Order)
- Budget updates triggered by approval
- File upload to Supabase Storage
- Email notifications on status changes

### E2E Tests (Playwright)
- **Critical flow**: Create CO from RFI → Add line items → Submit → Approve → Invoice
- **Negotiation flow**: Create CO → Submit → Reject → Revise (new version) → Approve
- **Budget flow**: Create multiple COs → Verify cumulative contract value updates
- **Document flow**: Generate AIA G701 PDF → Verify formatting and data accuracy
- **Filter flow**: Filter by status, type, cost range, originating event

### Load Tests
- 1,000+ change orders list query performance (virtualized table)
- Concurrent approval submissions (10 users approving simultaneously)
- PDF generation under load (50 concurrent G701 generations)
- Budget recalculation with 500+ change orders

### Construction Domain Tests (with /domain-validator)
- AIA G701 form compliance
- CSI MasterFormat section validation
- Change order numbering conventions
- Cost impact terminology (markup, contingency, etc.)
- Schedule impact calculation methods

## Rollout Plan

### Phase 1: Core Change Order Lifecycle (Weeks 1-2)
**Orchestrator delegates to /database agent**:
- Database schema, RLS policies, triggers
- Sequential numbering functions
- Audit logging setup

**Orchestrator implements**:
- Basic CRUD Server Actions
- Status transition workflows
- Line item management

**Orchestrator delegates to /test-writer**:
- Unit tests for Server Actions
- Integration tests for RLS

### Phase 2: Approval Workflows & Budgeting (Week 3)
**Orchestrator implements**:
- Multi-stage approval workflow
- Ball-in-court tracking
- Budget integration (cumulative contract value)

**Orchestrator delegates to /test-writer**:
- Approval workflow tests
- Budget calculation tests

### Phase 3: UI Components (Week 4)
**Orchestrator implements**:
- List, detail, and creation forms
- Line item editor
- Approval action panel

**Orchestrator delegates to /test-writer**:
- Component tests with React Testing Library

**Orchestrator delegates to /performance**:
- Optimize list virtualization
- Cache optimization

### Phase 4: Integrations (Week 5)
**Orchestrator implements**:
- RFI → Change Order linking
- Submittal → Change Order placeholder
- Daily Report → Change Order placeholder
- Email notifications

**Orchestrator delegates to /test-writer**:
- Integration tests

**Orchestrator delegates to /debugger** (as needed):
- Fix integration bugs

### Phase 5: Document Generation (Week 6)
**Orchestrator implements**:
- AIA G701 PDF generation
- Cost breakdown exports

**Orchestrator delegates to /domain-validator**:
- Verify AIA form compliance

**Orchestrator delegates to /test-writer**:
- PDF generation tests

### Phase 6: Polish & Final Review (Week 7)
**Orchestrator delegates to /code-review**:
- Full code quality review

**Orchestrator delegates to /performance**:
- Final optimization pass

**Orchestrator delegates to /build-doctor**:
- Final build verification

**Orchestrator delegates to /test-writer** (Playwright):
- E2E test suite

## Success Metrics

### Quantitative
- **Adoption**: >80% of active projects using change orders within 3 weeks
- **Approval cycle**: ↓30% median approval time vs baseline (email/spreadsheets)
- **Capture rate**: >85% same-day change event capture (contemplated or potential)
- **Budget accuracy**: <5% variance between cumulative contract value and actual invoiced
- **Performance**: <500ms change order list query for 1,000+ change orders
- **Document generation**: <3s for AIA G701 PDF generation

### Qualitative
- **User feedback**: NPS >55 from project managers and accounting staff
- **AIA compliance**: 100% of generated G701 forms match AIA standard formatting
- **Error rates**: <2% change order creation failures (validation, conflicts)
- **Support tickets**: <5 change order-related support requests per 100 active projects
- **Integration success**: >70% of change orders linked to originating events (RFIs, etc.)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sequential numbering conflicts (multi-user) | High | Use Postgres sequences + optimistic locking + retry logic |
| Budget calculation errors | Critical | Server-side validation, audit logging, reconciliation reports |
| Approval workflow complexity | Medium | Start with simple GC → Owner flow, make architect optional |
| AIA G701 format non-compliance | High | Use /domain-validator agent, reference official AIA templates |
| RLS policy bugs exposing change orders | Critical | Comprehensive SQL integration tests, audit all queries |
| PDF generation failures (large datasets) | Medium | Implement chunking, timeout handling, fallback to CSV |
| Originating event polymorphic reference integrity | Medium | Application-layer validation, database constraints where possible |
| Performance degradation with large change order lists | Medium | Implement virtualized tables, aggressive caching, pagination |

## Open Questions

1. **Approval workflow configuration**: Should approval stages be configurable per project, or use fixed GC → Owner → Architect?
   **Recommendation**: Start with fixed workflow, add per-project config in Phase 2 via JSONB settings.

2. **Pricing negotiation**: Should we support counter-proposals (Owner suggests different pricing)?
   **Recommendation**: Yes, use version system. Owner rejection creates new version with notes.

3. **Tax calculations**: Should tax rates be per-project or per-line-item?
   **Recommendation**: Per-line-item (different CSI sections may have different tax treatments).

4. **Change order numbering**: Should it be CO-001 or include project prefix (P001-CO-001)?
   **Recommendation**: CO-001 (simpler), project prefix is redundant with project_id filter.

5. **Subcontractor markups**: Should we track subcontractor cost + GC markup separately?
   **Recommendation**: Yes, add sub_cost and gc_markup fields to line items for transparency.

6. **Integration with accounting**: Manual CSV export or API integration?
   **Recommendation**: Phase 1 CSV export, Phase 2 QuickBooks/Sage API.

7. **Document storage**: Should generated G701 PDFs be automatically saved to Supabase Storage?
   **Recommendation**: Yes, save to change_order_attachments with category="contract".

8. **Multi-tier approvals**: Should we support Owner → CFO → Board approval chains?
   **Recommendation**: Not in MVP. Use approval notes for internal routing, add in Phase 2.

## Alternatives Considered

### Alternative 1: Use Generic "Budget Line Item" Pattern
**Rejected**: Change orders have specific construction domain requirements (AIA forms, originating events, approval workflows) that don't map to generic budget tracking.

### Alternative 2: Combine Change Orders with RFIs
**Rejected**: RFIs are questions/clarifications, change orders are contract modifications. Separate workflows with linking is cleaner.

### Alternative 3: Defer Change Orders to Phase 2, Focus on Other Modules First
**Rejected**: Change orders are critical for financial accuracy and contract management. Required for MVP to demonstrate value to mid-market contractors.

### Alternative 4: Use External Change Order Software Integration
**Rejected**: Creates data silos and integration overhead. Native change orders provide better user experience and data consistency.

## References

- **Project Context**: `openspec/project.md` (12-week MVP timeline, change orders in Weeks 9-10)
- **Industry Standards**: AIA G701 Change Order form, AIA G702/G703 billing forms
- **Similar Systems**: Procore Change Orders, Autodesk Build Change Events, PlanGrid Change Orders
- **Technical References**:
  - Supabase RLS docs: https://supabase.com/docs/guides/auth/row-level-security
  - React-PDF: https://react-pdf.org/
  - CSI MasterFormat: https://www.csiresources.org/standards/masterformat
- **Related Proposals**:
  - `add-rfi-module` (77/276 tasks) - Originating event for change orders
  - `add-submittals-module` (0/421 tasks) - Product substitution change orders
  - `add-daily-reports-module` (0/439 tasks) - Site condition change orders
  - `add-project-foundation` (72/73 tasks) - Budget tracking integration

## Approval Gate

**This proposal requires approval before implementation begins.**

Approval criteria:
- [ ] Construction domain expert review (AIA compliance, CSI codes, approval workflows)
- [ ] Technical architecture review (database schema, RLS policies, integration points)
- [ ] Product manager review (scope, timeline, MVP vs Phase 2 decisions)
- [ ] Development team review (implementation approach, orchestrator delegation strategy)

Once approved, implementation will proceed using the orchestrator pattern with specialized sub-agent delegation.
