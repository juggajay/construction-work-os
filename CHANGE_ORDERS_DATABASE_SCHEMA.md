# Change Orders Database Schema - Implementation Summary

**Created**: 2025-01-25
**Status**: ✅ Complete - Ready for migration
**Migrations Created**: 11 files

---

## Overview

The change orders database schema has been fully implemented with 5 core tables, comprehensive RLS policies, automated triggers for cost calculations and budget updates, and sequential numbering functions.

## Migrations Created

### 1. **20250125000000_create_change_order_enums.sql**
Creates 6 ENUM types:
- `change_order_status`: contemplated, potential, proposed, approved, rejected, cancelled, invoiced
- `change_order_type`: scope_change, design_change, site_condition, owner_requested, time_extension, cost_only, schedule_only
- `originating_event_type`: rfi, submittal, daily_report, manual
- `approval_stage`: gc_review, owner_approval, architect_approval
- `approval_status`: pending, approved, rejected, skipped
- `attachment_category`: quote, drawing, photo, contract, other

### 2. **20250125000001_create_change_orders_table.sql**
Main `change_orders` table with:
- Multi-tenancy (project_id scoping)
- Sequential numbering (CO-001, PCO-001, COR-001)
- Polymorphic originating event references
- Financial & schedule impact tracking
- Version control support
- Soft delete support
- **11 indexes** for performance

### 3. **20250125000002_create_change_order_line_items_table.sql**
Line items table with:
- Detailed cost breakdowns per change order
- CSI MasterFormat section support
- Sub cost + GC markup calculation
- Tax calculations
- Quantity × unit cost = extended cost (auto-calculated)
- Version tracking for negotiations
- **Trigger**: `calculate_line_item_costs_trigger` - Auto-calculates all cost fields
- **Trigger**: `recalculate_cost_impact_on_line_item_change` - Updates change_orders.cost_impact

### 4. **20250125000003_create_change_order_approvals_table.sql**
Approvals table with:
- Multi-stage workflow (GC → Owner → Architect)
- Individual or organization-level approvers
- Approval notes and rejection reasons
- **Trigger**: `advance_approval_stage_trigger` - Auto-creates next approval stage
- **Trigger**: `handle_approval_rejection_trigger` - Updates CO status on rejection

### 5. **20250125000004_create_change_order_versions_table.sql**
Versions table for:
- Tracking negotiations and revisions
- Snapshot of cost/schedule at each version
- Reason for version creation

### 6. **20250125000005_create_change_order_attachments_table.sql**
Attachments table for:
- Supporting documents (quotes, drawings, photos, contracts)
- File metadata (name, size, type, category)
- Supabase Storage integration

### 7. **20250125000006_create_co_numbering_functions.sql**
Sequential numbering with:
- **Function**: `get_next_co_number(project_id, status)` - Generates CO-001, PCO-001, COR-001
- **Trigger**: `auto_assign_co_number_trigger` - Auto-assigns on insert
- **Trigger**: `update_co_number_on_status_change_trigger` - Updates prefix when status changes (PCO-001 → COR-001 → CO-001)

### 8. **20250125000007_create_change_order_rls_policies.sql**
Comprehensive RLS policies:
- **change_orders**: SELECT, INSERT, UPDATE, DELETE policies with project-based access
- **line_items**: Cascade policies through change_order_id
- **approvals**: Approver-specific UPDATE policy
- **versions**: Creator-based policies
- **attachments**: Uploader-based policies
- **Helper function**: `user_project_ids()` - Returns all accessible project IDs

### 9. **20250125000008_create_change_order_audit_triggers.sql**
Audit logging for all 5 tables using existing `log_audit_event()` function:
- Immutable audit trail for compliance
- Tracks all INSERT, UPDATE, DELETE operations

### 10. **20250125000009_add_cumulative_contract_value_to_projects.sql**
Budget integration:
- Adds `cumulative_contract_value` column to `projects` table
- **Trigger**: `update_cumulative_contract_value_trigger` - Auto-updates on CO approval/cancellation
- **Function**: `recalculate_cumulative_contract_value(project_id)` - Manual reconciliation

### 11. **20250125000010_create_storage_bucket_change_orders.sql**
Supabase Storage setup:
- Bucket: `change-order-attachments`
- Private bucket (not public)
- RLS policies for SELECT, INSERT, UPDATE, DELETE
- Folder structure: `{project_id}/{change_order_id}/{filename}`

---

## Database Schema Summary

### Tables Created (5)

| Table | Rows (est.) | Purpose |
|-------|-------------|---------|
| `change_orders` | 100-1,000 per project | Main change order tracking |
| `change_order_line_items` | 5-50 per CO | Cost breakdowns |
| `change_order_approvals` | 2-3 per CO | Approval workflow |
| `change_order_versions` | 1-5 per CO | Version history |
| `change_order_attachments` | 2-10 per CO | Supporting documents |

### Total Indexes: 25+
Optimized for:
- Project scoping queries
- Status/type filtering
- Originating event lookups
- Number search
- CSI section grouping
- Approval assignment

### Total Triggers: 10
- 5 `updated_at` triggers
- 2 cost calculation triggers
- 2 approval workflow triggers
- 1 budget update trigger
- 1 numbering trigger

### Total Functions: 8
- `get_next_co_number()` - Sequential numbering
- `auto_assign_co_number()` - Auto number assignment
- `update_co_number_on_status_change()` - Number prefix updates
- `calculate_line_item_costs()` - Line item cost calculations
- `recalculate_change_order_cost_impact()` - CO cost_impact updates
- `advance_approval_stage()` - Auto-advance approvals
- `handle_approval_rejection()` - Handle rejections
- `update_cumulative_contract_value()` - Budget integration
- `recalculate_cumulative_contract_value()` - Budget reconciliation

---

## Key Features Implemented

### ✅ Sequential Numbering
- Automatic generation: CO-001, PCO-001, COR-001
- Number prefix changes with status (PCO → COR → CO)
- Collision handling with retry logic
- Project-scoped uniqueness

### ✅ Multi-Stage Approval Workflow
- GC Review → Owner Approval → Architect Approval (optional)
- Auto-advancement to next stage on approval
- Rejection handling with status updates
- Approver assignment (individual or org-level)

### ✅ Cost Calculations (Server-Side)
- Line items: quantity × unit_cost = extended_cost
- Tax: extended_cost × tax_rate = tax_amount
- Total: extended_cost + tax_amount = total_amount
- GC Markup: sub_cost × markup_percent = markup_amount
- Change order: SUM(line_items.total_amount) = cost_impact

### ✅ Budget Integration
- `cumulative_contract_value` auto-updated on CO approval
- Trigger-based (atomic with approval)
- Manual reconciliation function available

### ✅ Version Control
- Support for negotiations and revisions
- Line items copied to new versions
- Approval stages reset on new version
- Version comparison support

### ✅ Originating Event Linking
- Polymorphic references to RFIs, submittals, daily reports
- Type-safe with ENUM + UUID pattern
- Bidirectional navigation support

### ✅ Row-Level Security
- All tables protected by RLS
- Project-based access control
- Role-based permissions (manager, supervisor, viewer)
- Approver-specific policies

### ✅ Audit Compliance
- All mutations logged to `audit_logs` table
- Immutable history for legal defensibility
- WHO, WHAT, WHEN tracking

### ✅ Soft Deletes
- `deleted_at` timestamp on change_orders
- Preserves audit trail
- Filtered by indexes (WHERE deleted_at IS NULL)

---

## Performance Optimizations

1. **Indexes on all foreign keys** (project_id, change_order_id, etc.)
2. **Composite indexes** for common queries (project_id + status, project_id + type)
3. **Partial indexes** for filtered queries (WHERE deleted_at IS NULL, WHERE status = 'pending')
4. **Covering indexes** for number lookups
5. **Computed columns** for cost calculations (reduces query complexity)

---

## Next Steps

### 1. Apply Migrations
```bash
# Start local Supabase (if not running)
npm run db:start

# Apply all migrations
npm run db:reset

# Verify migrations applied
npm run db:psql -- -c "\dt change_order*"
```

### 2. Generate TypeScript Types
```bash
npm run db:types
```

This will update `lib/types/supabase.ts` with all new types:
- `ChangeOrder`
- `ChangeOrderLineItem`
- `ChangeOrderApproval`
- `ChangeOrderVersion`
- `ChangeOrderAttachment`
- All ENUMs

### 3. Test RLS Policies
```sql
-- Test as a specific user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-uuid-here"}';

-- Should only return COs for user's projects
SELECT * FROM change_orders;

-- Should allow creating CO for accessible project
INSERT INTO change_orders (project_id, title, type, status) VALUES (...);

RESET role;
```

### 4. Test Triggers
```sql
-- Test line item cost calculation
INSERT INTO change_order_line_items (
  change_order_id, description, quantity, unit_cost, tax_rate
) VALUES (
  'co-uuid', 'Concrete', 50, 150, 8.5
);

-- Verify extended_cost = 7500, tax_amount = 637.50, total_amount = 8137.50
SELECT * FROM change_order_line_items WHERE description = 'Concrete';

-- Verify change_orders.cost_impact updated
SELECT cost_impact FROM change_orders WHERE id = 'co-uuid';
```

### 5. Test Sequential Numbering
```sql
-- Create change orders with different statuses
INSERT INTO change_orders (project_id, title, type, status) VALUES
  ('proj-uuid', 'Test PCO', 'scope_change', 'potential'),
  ('proj-uuid', 'Test COR', 'scope_change', 'proposed'),
  ('proj-uuid', 'Test CO', 'scope_change', 'approved');

-- Verify numbers: PCO-001, COR-001, CO-001
SELECT number, status FROM change_orders WHERE project_id = 'proj-uuid';
```

### 6. Test Approval Workflow
```sql
-- Create approval at gc_review stage
INSERT INTO change_order_approvals (change_order_id, version, stage, status)
VALUES ('co-uuid', 1, 'gc_review', 'pending');

-- Approve it
UPDATE change_order_approvals
SET status = 'approved', decision_at = now()
WHERE id = 'approval-uuid';

-- Verify owner_approval stage auto-created
SELECT stage, status FROM change_order_approvals WHERE change_order_id = 'co-uuid';
```

### 7. Test Budget Integration
```sql
-- Get initial contract value
SELECT cumulative_contract_value FROM projects WHERE id = 'proj-uuid';

-- Approve a change order
UPDATE change_orders
SET status = 'approved', approved_at = now()
WHERE id = 'co-uuid';

-- Verify cumulative_contract_value increased
SELECT cumulative_contract_value FROM projects WHERE id = 'proj-uuid';
```

---

## Migration Verification Checklist

- [ ] All 11 migrations apply without errors
- [ ] All tables created successfully
- [ ] All indexes created
- [ ] All triggers created
- [ ] All functions created
- [ ] All RLS policies active
- [ ] Storage bucket created
- [ ] TypeScript types generated
- [ ] RLS policies tested (can view only own projects)
- [ ] Line item cost calculations working
- [ ] Sequential numbering working
- [ ] Approval workflow auto-advancement working
- [ ] Budget trigger updating cumulative_contract_value
- [ ] Audit triggers logging all mutations

---

## Database Agent Handoff Complete

✅ **All database schema work is complete.**

The database foundation for the change orders module is fully implemented and ready for backend Server Actions and frontend UI development.

**Next Phase**: Orchestrator should now delegate to implementation (Server Actions + UI) or continue with testing phase.

---

## Files Created

1. `supabase/migrations/20250125000000_create_change_order_enums.sql`
2. `supabase/migrations/20250125000001_create_change_orders_table.sql`
3. `supabase/migrations/20250125000002_create_change_order_line_items_table.sql`
4. `supabase/migrations/20250125000003_create_change_order_approvals_table.sql`
5. `supabase/migrations/20250125000004_create_change_order_versions_table.sql`
6. `supabase/migrations/20250125000005_create_change_order_attachments_table.sql`
7. `supabase/migrations/20250125000006_create_co_numbering_functions.sql`
8. `supabase/migrations/20250125000007_create_change_order_rls_policies.sql`
9. `supabase/migrations/20250125000008_create_change_order_audit_triggers.sql`
10. `supabase/migrations/20250125000009_add_cumulative_contract_value_to_projects.sql`
11. `supabase/migrations/20250125000010_create_storage_bucket_change_orders.sql`
12. `CHANGE_ORDERS_DATABASE_SCHEMA.md` (this document)
