# Design: Change Orders Module

## Overview

This document captures the architectural decisions, technical patterns, and implementation approach for the Change Orders module. The module follows an **orchestrator delegation pattern** for implementation, where a meta-orchestrator agent coordinates specialized sub-agents for different domains (database, testing, validation, etc.).

## Architecture Decisions

### 1. Multi-Table Relational Design

**Decision**: Use separate tables for `change_orders`, `line_items`, `approvals`, `versions`, and `attachments` rather than embedding data in JSONB.

**Rationale**:
- Enables efficient querying and indexing
- Supports complex calculations (cost totals, budget impact)
- Allows proper foreign key constraints and referential integrity
- Facilitates audit logging at granular level
- Better performance for large datasets (1,000+ change orders)

**Trade-offs**:
- More complex schema (5 tables vs 1-2)
- Requires more joins for complete data retrieval
- **Mitigation**: Use database views for common queries, React Query caching for UI

### 2. Sequential Numbering Strategy

**Decision**: Use Postgres sequences per project + status prefix (CO-001, PCO-001, COR-001).

**Rationale**:
- Database-level uniqueness guarantees
- Atomic operations prevent collisions
- Supports different numbering schemes per status type
- Industry-standard format (contractors expect "CO-001" format)

**Trade-offs**:
- Number format changes when status changes (PCO-001 → CO-001)
- Gaps in sequence if transactions rollback
- **Mitigation**: Accept gaps as normal (industry standard), use retry logic for rare collisions

**Implementation**:
```sql
CREATE SEQUENCE change_order_co_seq_<project_id> START 1;
CREATE SEQUENCE change_order_pco_seq_<project_id> START 1;
CREATE SEQUENCE change_order_cor_seq_<project_id> START 1;

CREATE FUNCTION get_next_co_number(p_project_id UUID, p_status TEXT)
RETURNS TEXT AS $$
  -- Get next number from appropriate sequence based on status
  -- Return formatted string: "CO-001", "PCO-001", etc.
$$ LANGUAGE plpgsql;
```

### 3. Polymorphic Originating Event References

**Decision**: Use `originating_event_type` (enum) + `originating_event_id` (UUID) for linking to RFIs, submittals, daily reports.

**Rationale**:
- Flexible: supports linking to any entity type
- Simple schema: avoids multiple nullable foreign keys
- Extensible: easy to add new event types (e.g., "punch_item", "inspection")

**Trade-offs**:
- No database-enforced referential integrity
- Application-layer validation required
- **Mitigation**: Add validation in Server Actions, create database check constraints for known types, use audit logging

**Implementation**:
```typescript
type OriginatingEvent = {
  type: 'rfi' | 'submittal' | 'daily_report' | 'manual'
  id: string | null // UUID of originating record
}

// Application-layer validation
async function validateOriginatingEvent(event: OriginatingEvent) {
  if (event.type === 'rfi') {
    const rfi = await getRfiById(event.id)
    if (!rfi) throw new Error('Invalid RFI reference')
  }
  // ... similar for other types
}
```

### 4. Version Control Strategy

**Decision**: Use `current_version` field on `change_orders` + separate `change_order_versions` table for history.

**Rationale**:
- Supports negotiation workflow (submit, reject, revise, resubmit)
- Preserves all pricing history for audit compliance
- Enables side-by-side version comparison
- Line items are versioned (copied to new version on revision)

**Trade-offs**:
- Data duplication (line items copied per version)
- More complex queries (need to filter by version)
- **Mitigation**: Use database views for "current version" queries, implement efficient version comparison algorithm

**Implementation**:
```typescript
// Creating a new version
async function createNewVersion(changeOrderId: string, reason: string) {
  const currentVersion = await getCurrentVersion(changeOrderId)
  const newVersion = currentVersion + 1

  // Copy line items to new version
  await copyLineItems(changeOrderId, currentVersion, newVersion)

  // Create version record
  await createVersionRecord(changeOrderId, newVersion, reason)

  // Reset approvals for new version
  await resetApprovals(changeOrderId, newVersion)

  // Update current_version
  await updateCurrentVersion(changeOrderId, newVersion)
}
```

### 5. Approval Workflow Pattern

**Decision**: Use state machine with multi-stage approvals: GC Review → Owner Approval → Architect Approval (optional).

**Rationale**:
- Mirrors real-world construction approval chains
- Clear ball-in-court at each stage
- Configurable: architect stage can be skipped per project
- Supports delegation and bulk approvals

**Trade-offs**:
- Fixed workflow (not fully customizable per project)
- Complex state transitions
- **Mitigation**: Use JSONB `project.settings` for future per-project workflow customization (Phase 2)

**State Machine**:
```
contemplated (no approvals)
    ↓
potential (internal pricing)
    ↓
proposed (submitted for approval)
    ↓ gc_review (stage 1)
    ↓ owner_approval (stage 2)
    ↓ architect_approval (stage 3, optional)
    ↓
approved (all stages complete)
    ↓
invoiced (billing complete)

Rejection path:
proposed → rejected → [revise] → proposed (new version)

Cancellation path:
Any status → cancelled (preserves audit trail)
```

### 6. Cost Calculation Architecture

**Decision**: Server-side calculations with client-side preview. All critical calculations (totals, tax, budget impact) computed server-side.

**Rationale**:
- Prevents tampering (users can't manipulate costs in browser)
- Single source of truth (database computed columns)
- Consistent calculations across UI and reports
- Audit compliance (all calculations logged)

**Trade-offs**:
- Slight delay for calculations (round-trip to server)
- More complex client-side state management
- **Mitigation**: Use optimistic updates in React Query, debounce input changes, show loading states

**Implementation**:
```sql
-- Computed columns in line_items table
ALTER TABLE change_order_line_items
  ADD COLUMN extended_cost NUMERIC GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  ADD COLUMN tax_amount NUMERIC GENERATED ALWAYS AS (extended_cost * tax_rate / 100) STORED,
  ADD COLUMN total_amount NUMERIC GENERATED ALWAYS AS (extended_cost + tax_amount) STORED;

-- Trigger to update change_orders.cost_impact on line item changes
CREATE TRIGGER recalculate_cost_impact
  AFTER INSERT OR UPDATE OR DELETE ON change_order_line_items
  FOR EACH STATEMENT
  EXECUTE FUNCTION recalculate_change_order_cost_impact();
```

### 7. Budget Integration Pattern

**Decision**: Use database triggers to update `project.cumulative_contract_value` on change order approval.

**Rationale**:
- Real-time budget updates
- Atomic transaction (approval + budget update)
- No application-layer coordination needed
- Audit trail preserved (trigger logs changes)

**Trade-offs**:
- Complex trigger logic (must handle approval, cancellation, rejection)
- Potential for trigger bugs affecting budgets
- **Mitigation**: Comprehensive SQL tests, reconciliation report to verify cumulative value, manual recalculation function for recovery

**Implementation**:
```sql
CREATE FUNCTION update_cumulative_contract_value()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Add to cumulative contract value
    UPDATE projects
    SET cumulative_contract_value = cumulative_contract_value + NEW.cost_impact
    WHERE id = NEW.project_id;
  ELSIF NEW.status = 'cancelled' AND OLD.status = 'approved' THEN
    -- Subtract from cumulative contract value
    UPDATE projects
    SET cumulative_contract_value = cumulative_contract_value - NEW.cost_impact
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 8. RLS Policy Strategy

**Decision**: All tables use `user_project_ids()` helper function for project-based access control.

**Rationale**:
- Consistent security model across all tables
- Leverages existing `project_access` table
- Supports org-level and project-level roles
- Cascade through foreign keys (line_items inherit from change_orders)

**Trade-offs**:
- Performance impact (RLS adds WHERE clauses to every query)
- Complex policies for multi-party approvals (owner org vs GC org)
- **Mitigation**: Database indexes on project_id, use `SECURITY DEFINER` functions for admin operations

**Implementation**:
```sql
-- Change orders RLS
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view change orders for their projects"
  ON change_orders FOR SELECT
  USING (project_id IN (SELECT user_project_ids()));

CREATE POLICY "Users can create change orders for their projects"
  ON change_orders FOR INSERT
  WITH CHECK (project_id IN (SELECT user_project_ids()));

CREATE POLICY "Users can update their own change orders"
  ON change_orders FOR UPDATE
  USING (
    project_id IN (SELECT user_project_ids()) AND
    (created_by = auth.uid() OR user_has_role(project_id, 'manager'))
  );
```

### 9. PDF Generation Approach

**Decision**: Use react-pdf for AIA G701 generation, with fallback to server-side Puppeteer for complex layouts.

**Rationale**:
- react-pdf: Fast, client-side, works in browser
- Puppeteer fallback: Handles complex layouts, server-side control
- AIA G701 is standardized format (well-defined)

**Trade-offs**:
- react-pdf has limited layout capabilities (no complex tables)
- Puppeteer requires server resources (CPU, memory)
- **Mitigation**: Use react-pdf for MVP (simpler G701 layout), add Puppeteer in Phase 2 if needed

**Implementation**:
```typescript
import { Document, Page, Text, View, pdf } from '@react-pdf/renderer'

async function generateAIAG701(changeOrder: ChangeOrder) {
  const MyDocument = (
    <Document>
      <Page size="LETTER">
        <View>
          <Text>AIA Document G701 - Change Order</Text>
          <Text>CO Number: {changeOrder.number}</Text>
          {/* ... rest of form */}
        </View>
      </Page>
    </Document>
  )

  const blob = await pdf(MyDocument).toBlob()
  return blob
}
```

### 10. Orchestrator Delegation Pattern

**Decision**: Use orchestrator agent to coordinate specialized sub-agents for implementation.

**Rationale**:
- **Separation of concerns**: Each agent specializes in one domain
- **Parallel execution**: Multiple agents can work simultaneously
- **Quality assurance**: Specialized agents (domain-validator, code-review) catch issues early
- **Scalability**: Easy to add new specialized agents as needed
- **Context preservation**: Orchestrator maintains high-level overview

**Orchestrator Responsibilities**:
1. Maintain task list and overall progress
2. Delegate specialized tasks to appropriate agents
3. Verify deliverables from sub-agents
4. Handle integration between agent outputs
5. Make high-level architectural decisions

**Sub-Agent Responsibilities**:
- `/database`: Database schema, migrations, RLS, triggers
- `/test-writer`: Unit tests, integration tests, E2E tests
- `/domain-validator`: Construction industry compliance (AIA, CSI)
- `/code-review`: Code quality, security, accessibility
- `/build-doctor`: TypeScript errors, build failures
- `/debugger`: Runtime errors, specific bugs
- `/performance`: Query optimization, rendering performance

**Delegation Flow**:
```
Orchestrator (maintains tasks.md)
│
├─ Phase 1: Database Schema
│  └─ Delegates to /database agent
│      ├─ Creates migrations
│      ├─ Creates RLS policies
│      ├─ Creates triggers
│      └─ Returns: Migration files + verification tests
│
├─ Phase 2: Backend Implementation
│  ├─ Orchestrator implements Server Actions
│  └─ Delegates to /test-writer agent
│      └─ Returns: Unit tests + integration tests
│
├─ Phase 3: Frontend Implementation
│  ├─ Orchestrator implements UI components
│  ├─ Delegates to /test-writer for component tests
│  └─ Delegates to /performance for optimization
│
├─ Phase 4: Domain Validation
│  └─ Delegates to /domain-validator agent
│      ├─ Verifies AIA G701 compliance
│      ├─ Verifies CSI code correctness
│      └─ Returns: Validation report + fix recommendations
│
└─ Phase 5: Final Review
    ├─ Delegates to /code-review for quality check
    ├─ Delegates to /build-doctor for build verification
    └─ Delegates to /performance for final optimization
```

**Benefits**:
- Each agent has clear scope and deliverables
- Orchestrator prevents context loss between phases
- Specialized agents produce higher quality outputs
- Parallel work possible (database + tests can run simultaneously)
- Easy to retry failed tasks (re-delegate to same agent)

## Technology Stack

### Backend
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Supabase client (TypeScript SDK)
- **Server Actions**: Next.js Server Actions (App Router)
- **Validation**: Zod schemas
- **File Storage**: Supabase Storage

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: shadcn/ui (Radix + Tailwind)
- **State Management**: React Query v5 (server state) + Zustand (UI state)
- **Tables**: TanStack Table (virtualization for large datasets)
- **PDF Generation**: react-pdf (with Puppeteer fallback)
- **Forms**: React Hook Form + Zod validation

### Testing
- **Unit Tests**: Vitest
- **Component Tests**: React Testing Library
- **E2E Tests**: Playwright (via Playwright MCP)
- **SQL Tests**: pgTAP (for RLS policies)
- **Load Tests**: k6 (for performance verification)

### MCP Integrations
- **Docker MCP**: For local database testing
- **Playwright MCP**: For E2E test automation
- **Chrome DevTools MCP**: For performance profiling

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Change order list query (1,000 records) | <500ms | Chrome DevTools Network tab |
| Line item calculation (50 items) | <100ms | React DevTools Profiler |
| AIA G701 PDF generation | <3s | Timing API |
| Approval decision commit | <200ms | Server Action timing |
| Budget recalculation trigger | <100ms | Database query plan |

## Security Considerations

1. **RLS Policies**: All queries filtered by project access
2. **Input Validation**: Zod schemas on client and server
3. **Cost Calculations**: Server-side only (prevent tampering)
4. **Approval Permissions**: Role-based checks in Server Actions
5. **Audit Logging**: All mutations logged immutably
6. **File Uploads**: Virus scanning, size limits (50MB), type validation
7. **SQL Injection**: Parameterized queries via Supabase client
8. **XSS Prevention**: React auto-escaping, CSP headers

## Scalability Plan

### Phase 1 (MVP): 100 concurrent users, 50 active projects
- Single Supabase instance
- Basic indexing
- React Query caching
- Virtualized tables

### Phase 2 (Year 1): 1,000 concurrent users, 500 active projects
- Read replicas for reporting queries
- Advanced caching (Redis)
- CDN for PDFs and attachments
- Horizontal scaling (Vercel Edge Functions)

### Phase 3 (Year 2): 10,000 concurrent users, 5,000 active projects
- Microservices architecture for PDF generation
- Dedicated database for analytics
- Event-driven architecture (change order events → Kafka)
- ML-based pricing analysis

## Open Technical Questions

1. **PDF Generation Performance**: Will react-pdf handle 100-line-item change orders efficiently? May need Puppeteer fallback sooner than Phase 2.

2. **Polymorphic Reference Integrity**: How to handle orphaned change orders if originating RFI is deleted? Options: Prevent deletion, cascade delete, convert to "manual" type.

3. **Approval Delegation**: Should we store delegation in a separate table or just update `approver_id`? Separate table provides better audit trail.

4. **Budget Reconciliation**: How often to run reconciliation job to verify cumulative_contract_value is correct? Daily? Weekly? On-demand?

5. **Version Limit**: Should we limit number of versions per change order (e.g., max 10)? Prevents abuse but may be artificial constraint.

6. **Bulk Operations**: Should we support bulk approval of multiple change orders? Useful for small change orders but complex for permissions.

## Recommendations

1. **Start Simple**: Implement core lifecycle first, add advanced features (bulk approvals, ML pricing) in Phase 2.

2. **Validate Early**: Use `/domain-validator` agent in Phase 1 to catch AIA G701 compliance issues before building full PDF generator.

3. **Test RLS Thoroughly**: SQL tests for RLS policies are critical. Budget time for comprehensive test coverage.

4. **Monitor Performance**: Use `/performance` agent proactively, don't wait until users complain about slow queries.

5. **Plan for Data Migration**: If any projects have change orders in spreadsheets, build import tool to migrate existing data.

6. **Document Decisions**: Keep this design.md updated as decisions change during implementation.
