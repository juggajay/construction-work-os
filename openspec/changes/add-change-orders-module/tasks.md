# Implementation Tasks: Add Change Orders Module

**Implementation Strategy**: This module uses an **orchestrator delegation pattern** where the orchestrator agent maintains high-level oversight and delegates specialized tasks to domain-specific sub-agents.

**Available Specialized Agents**:
- `/database` - Database schema, migrations, RLS policies
- `/test-writer` - Unit, integration, and E2E tests
- `/domain-validator` - Construction industry compliance verification
- `/code-review` - Code quality review before archiving
- `/build-doctor` - Build failure diagnosis and fixes
- `/debugger` - Runtime error debugging
- `/performance` - Query and rendering optimization

**Available MCP Tools**:
- Docker MCP - Local database testing
- Playwright MCP - E2E testing automation
- Chrome DevTools MCP - Performance profiling

---

## Phase 1: Database Schema and Backend Foundation (Weeks 1-2)

### Database Schema (Orchestrator delegates to `/database` agent)

- [ ] **DB-001**: Create `change_orders` table with all fields per data model
  - [ ] Add enum types: change_order_status, change_order_type
  - [ ] Add indexes on project_id, status, number, originating_event_type
  - [ ] Add soft delete support (deleted_at column)
  - [ ] Add updated_at trigger
- [ ] **DB-002**: Create `change_order_line_items` table
  - [ ] Add foreign key to change_orders
  - [ ] Add computed columns for cost calculations
  - [ ] Add indexes on change_order_id, version, csi_section
- [ ] **DB-003**: Create `change_order_approvals` table
  - [ ] Add foreign keys to change_orders and profiles/organizations
  - [ ] Add index on change_order_id, stage, status
  - [ ] Add enum type: approval_stage, approval_status
- [ ] **DB-004**: Create `change_order_versions` table
  - [ ] Add foreign key to change_orders
  - [ ] Add index on change_order_id, version_number
- [ ] **DB-005**: Create `change_order_attachments` table
  - [ ] Add foreign key to change_orders
  - [ ] Add enum type: attachment_category
  - [ ] Add index on change_order_id, category
- [ ] **DB-006**: Create sequential numbering functions
  - [ ] Function: `get_next_co_number(project_id, status)` returns "CO-001", "PCO-001", etc.
  - [ ] Use Postgres sequences per project
  - [ ] Handle collision with retry logic
- [ ] **DB-007**: Create RLS policies for change_orders
  - [ ] SELECT: user_project_ids() filter
  - [ ] INSERT: user has project access
  - [ ] UPDATE: user has project access + creator or manager role
  - [ ] DELETE: creator only + status in ('contemplated', 'potential')
- [ ] **DB-008**: Create RLS policies for line_items, approvals, versions, attachments
  - [ ] All policies cascade through change_order.project_id
- [ ] **DB-009**: Create trigger for cumulative_contract_value updates
  - [ ] On change_order approval, update project.cumulative_contract_value
  - [ ] On change_order cancellation, recalculate cumulative_contract_value
- [ ] **DB-010**: Create audit logging triggers
  - [ ] Log all INSERT, UPDATE, DELETE on change_orders
  - [ ] Log all approval decisions
- [ ] **DB-011**: Create Supabase Storage bucket for change order attachments
  - [ ] Bucket name: "change-order-attachments"
  - [ ] RLS policies: user has project access
  - [ ] Max file size: 50MB

### Database Testing (Orchestrator delegates to `/test-writer` agent)

- [ ] **TEST-001**: Write SQL tests for RLS policies
  - [ ] Test user can only see change orders from their projects
  - [ ] Test user cannot edit approved change orders
  - [ ] Test user cannot delete proposed change orders
- [ ] **TEST-002**: Write tests for sequential numbering
  - [ ] Test collision handling
  - [ ] Test number format (CO-001, PCO-001, COR-001)
  - [ ] Test concurrency (2 users create simultaneously)
- [ ] **TEST-003**: Write tests for cumulative contract value trigger
  - [ ] Test approval updates project budget
  - [ ] Test cancellation recalculates budget

### Backend Server Actions (Orchestrator implements)

- [ ] **ACTION-001**: Implement `createChangeOrder` Server Action
  - [ ] Validate required fields (project_id, title, type)
  - [ ] Handle originating event linking (RFI, submittal, daily_report)
  - [ ] Assign sequential number based on initial status
  - [ ] Return success with change order ID
- [ ] **ACTION-002**: Implement `updateChangeOrder` Server Action
  - [ ] Validate user permissions (creator or manager)
  - [ ] Prevent editing if status is approved/invoiced
  - [ ] Update updated_at timestamp
- [ ] **ACTION-003**: Implement `deleteChangeOrder` Server Action (soft delete)
  - [ ] Validate status is contemplated or potential
  - [ ] Set deleted_at timestamp
  - [ ] Preserve audit trail
- [ ] **ACTION-004**: Implement `cancelChangeOrder` Server Action
  - [ ] Accept cancellation reason
  - [ ] Update status to "cancelled"
  - [ ] Trigger budget recalculation
- [ ] **ACTION-005**: Implement status transition actions
  - [ ] `promoteToProposed(id)` - contemplated → potential → proposed
  - [ ] Validate line items are complete before submission
  - [ ] Create first approval stage (gc_review)
- [ ] **ACTION-006**: Implement line item CRUD actions
  - [ ] `addLineItem(change_order_id, data)`
  - [ ] `updateLineItem(line_item_id, data)` - recalculate costs
  - [ ] `deleteLineItem(line_item_id)`
  - [ ] `reorderLineItems(change_order_id, new_order)`
- [ ] **ACTION-007**: Implement approval actions
  - [ ] `approveChangeOrder(approval_id, notes)`
  - [ ] `rejectChangeOrder(approval_id, reason)`
  - [ ] Advance to next approval stage on approve
  - [ ] Handle final approval → status "approved"
- [ ] **ACTION-008**: Implement version actions
  - [ ] `createNewVersion(change_order_id, reason)`
  - [ ] Copy line items to new version
  - [ ] Reset approval stages
  - [ ] Increment current_version
- [ ] **ACTION-009**: Implement attachment actions
  - [ ] `uploadAttachment(change_order_id, file, category)`
  - [ ] `deleteAttachment(attachment_id)`
  - [ ] Use Supabase Storage with signed URLs
- [ ] **ACTION-010**: Implement query actions
  - [ ] `getChangeOrders(project_id, filters)` - with pagination
  - [ ] `getChangeOrderById(id)` - with line items, approvals, versions
  - [ ] `getChangeOrdersByOrigin(event_type, event_id)` - for integration

### Backend Testing (Orchestrator delegates to `/test-writer` agent)

- [ ] **TEST-004**: Write unit tests for all Server Actions
  - [ ] Test validation logic
  - [ ] Test permission checks
  - [ ] Test status transitions
- [ ] **TEST-005**: Write integration tests
  - [ ] Test RFI → Change Order linking
  - [ ] Test approval workflow (GC → Owner → Architect)
  - [ ] Test budget updates on approval

---

## Phase 2: Frontend UI Components (Weeks 3-4)

### List and Navigation (Orchestrator implements)

- [ ] **UI-001**: Implement change orders list page
  - [ ] Path: `/[orgSlug]/projects/[projectId]/change-orders`
  - [ ] Virtualized table using TanStack Table
  - [ ] Columns: Number, Title, Type, Status, Cost, Ball-in-Court, Actions
- [ ] **UI-002**: Implement filters and search
  - [ ] Filter by status (multi-select)
  - [ ] Filter by type (multi-select)
  - [ ] Filter by cost range (slider)
  - [ ] Search by number or title
  - [ ] Filter by originating event
- [ ] **UI-003**: Implement sort and pagination
  - [ ] Sort by number, cost, date, status
  - [ ] Pagination with page size selector
  - [ ] URL state persistence
- [ ] **UI-004**: Enable change orders navigation menu item
  - [ ] Update project page navigation
  - [ ] Remove "Coming soon" label
  - [ ] Add change order count badge

### Create and Edit Forms (Orchestrator implements)

- [ ] **UI-005**: Implement change order creation form
  - [ ] Path: `/[orgSlug]/projects/[projectId]/change-orders/new`
  - [ ] Fields: Title, Description, Type, Originating Event
  - [ ] Pre-populate from RFI if originating_event_id in URL params
  - [ ] Client-side validation with Zod
- [ ] **UI-006**: Implement change order edit page
  - [ ] Path: `/[orgSlug]/projects/[projectId]/change-orders/[id]/edit`
  - [ ] Disable editing if status is approved/invoiced
  - [ ] Show warning if change order is in approval
- [ ] **UI-007**: Implement line item editor component
  - [ ] Add, edit, delete line items
  - [ ] CSI section picker (dropdown with search)
  - [ ] Auto-calculate extended cost, tax, totals
  - [ ] Drag-and-drop reordering
  - [ ] Markup calculator (sub cost + GC markup percentage)
- [ ] **UI-008**: Implement line item import from CSV
  - [ ] CSV upload dialog
  - [ ] Column mapping interface
  - [ ] Validation error display
  - [ ] Bulk import confirmation

### Detail View (Orchestrator implements)

- [ ] **UI-009**: Implement change order detail page
  - [ ] Path: `/[orgSlug]/projects/[projectId]/change-orders/[id]`
  - [ ] Header: Number, Title, Status badge, Ball-in-court indicator
  - [ ] Overview section: Description, Type, Cost, Schedule impact
  - [ ] Originating event link (back to RFI/submittal/daily report)
- [ ] **UI-010**: Implement line items display
  - [ ] Table view with all line items
  - [ ] Subtotal, tax, grand total calculations
  - [ ] CSI section grouping option
- [ ] **UI-011**: Implement approval timeline component
  - [ ] Visual timeline showing all stages
  - [ ] Completed stages: green check, approver name, timestamp, notes
  - [ ] Pending stages: gray, "Awaiting Approval"
  - [ ] Rejected stages: red X, rejection reason
- [ ] **UI-012**: Implement version history tab
  - [ ] List all versions with version number, date, creator, reason
  - [ ] Click version to view that version's details
  - [ ] Version comparison modal (side-by-side)
- [ ] **UI-013**: Implement attachments tab
  - [ ] List attachments grouped by category
  - [ ] Upload new attachment dialog
  - [ ] Download, preview, delete actions
  - [ ] Show file size and uploader name

### Actions and Workflows (Orchestrator implements)

- [ ] **UI-014**: Implement status transition actions
  - [ ] "Promote to PCO" button (contemplated → potential)
  - [ ] "Submit for Approval" button (potential → proposed)
  - [ ] Show confirmation dialog with status change summary
- [ ] **UI-015**: Implement approval action panel
  - [ ] "Approve" button with notes textarea
  - [ ] "Reject" button with reason textarea (required)
  - [ ] Show current approval stage and next stage preview
  - [ ] Disable actions if user lacks permissions
- [ ] **UI-016**: Implement version creation flow
  - [ ] "Create New Version" button on rejected change orders
  - [ ] Reason textarea (required)
  - [ ] Preview of line items that will be copied
  - [ ] Confirmation dialog
- [ ] **UI-017**: Implement cancellation dialog
  - [ ] "Cancel Change Order" action
  - [ ] Reason textarea (required)
  - [ ] Warning about irreversibility
  - [ ] Confirmation button

### UI Testing (Orchestrator delegates to `/test-writer` agent)

- [ ] **TEST-006**: Write React component tests
  - [ ] Test line item editor calculations
  - [ ] Test filter and search functionality
  - [ ] Test approval action permissions
- [ ] **TEST-007**: Write E2E tests with Playwright (delegate to Playwright MCP)
  - [ ] Test: Create CO → Add line items → Submit → Approve → Invoice
  - [ ] Test: Create CO → Submit → Reject → Revise (new version) → Approve
  - [ ] Test: Filter by status, type, cost range
  - [ ] Test: Create CO from RFI (integration flow)

### Performance Optimization (Orchestrator delegates to `/performance` agent)

- [ ] **PERF-001**: Optimize change order list query
  - [ ] Add database indexes
  - [ ] Implement cursor-based pagination for 1,000+ records
  - [ ] Use React Query caching
- [ ] **PERF-002**: Optimize line item calculations
  - [ ] Memoize cost calculations
  - [ ] Debounce input changes
  - [ ] Use Web Workers for bulk calculations

---

## Phase 3: Integrations (Week 5)

### RFI Integration (Orchestrator implements)

- [ ] **INTG-001**: Add "Create Change Order" button to RFI detail page
  - [ ] Show button only if RFI status is "answered" or "closed"
  - [ ] Pass RFI ID and pre-populate CO form
- [ ] **INTG-002**: Display related change orders on RFI detail page
  - [ ] "Related Change Orders" section
  - [ ] List all COs with originating_event_id = RFI ID
  - [ ] Link to CO detail pages

### Submittal Integration (Orchestrator implements)

- [ ] **INTG-003**: Add "Create Change Order" button to submittal detail page
  - [ ] Show button if submittal requires product substitution
  - [ ] Pre-populate CO with submittal context
- [ ] **INTG-004**: Display related change orders on submittal detail page
  - [ ] Same pattern as RFI integration

### Daily Report Integration (Orchestrator implements)

- [ ] **INTG-005**: Add "Create Change Order" button to daily report incident
  - [ ] Show for incident types: site_condition, delay, equipment_failure
  - [ ] Pre-populate CO with incident description and photos
- [ ] **INTG-006**: Display related change orders on daily report detail page
  - [ ] Link incidents to their change orders

### Project Dashboard Integration (Orchestrator implements)

- [ ] **INTG-007**: Add change order metrics to project dashboard
  - [ ] Card: "Change Orders" with count and total cost
  - [ ] Breakdown: Approved, Pending, Rejected
  - [ ] Cumulative contract value display
  - [ ] Click card to navigate to change orders list
- [ ] **INTG-008**: Add change order recent activity feed
  - [ ] Show latest 5 change order events (created, approved, rejected)
  - [ ] Link to change order detail pages

### Navigation and Search (Orchestrator implements)

- [ ] **INTG-009**: Update project navigation menu
  - [ ] Enable "Change Orders" menu item
  - [ ] Add count badge showing active change orders
- [ ] **INTG-010**: Add change orders to global search
  - [ ] Index change order number, title, description
  - [ ] Show CO results in search dropdown
  - [ ] Navigate to CO detail on click

### Notification Integration (Orchestrator implements)

- [ ] **INTG-011**: Implement email notifications
  - [ ] Send on approval request (to approver)
  - [ ] Send on approval (to creator)
  - [ ] Send on rejection (to creator with reason)
  - [ ] Send on final approval (to all stakeholders)
- [ ] **INTG-012**: Implement in-app notifications
  - [ ] Same triggers as email
  - [ ] Show in notification center
  - [ ] Link to change order detail page

### Integration Testing (Orchestrator delegates to `/test-writer` agent)

- [ ] **TEST-008**: Write integration tests
  - [ ] Test RFI → CO creation flow
  - [ ] Test CO approval triggers budget update
  - [ ] Test email notifications sent correctly
  - [ ] Test navigation menu shows correct counts

---

## Phase 4: Document Generation (Week 6)

### PDF Generation (Orchestrator implements)

- [ ] **DOC-001**: Implement AIA G701 PDF generation
  - [ ] Use react-pdf library
  - [ ] Match AIA standard formatting (delegate to `/domain-validator` for verification)
  - [ ] Include all required fields: CO number, project, description, cost breakdown
  - [ ] Add signature lines (blank for manual signing)
- [ ] **DOC-002**: Implement cost breakdown PDF export
  - [ ] Table of all line items
  - [ ] CSI section grouping
  - [ ] Subtotals, tax, grand total
  - [ ] Project and CO header information
- [ ] **DOC-003**: Implement approval records PDF export
  - [ ] List all approval stages with details
  - [ ] Include approver names, timestamps, notes
  - [ ] Show version history
  - [ ] Add audit trail footer

### PDF Generation UI (Orchestrator implements)

- [ ] **DOC-004**: Add "Generate AIA G701" button to CO detail page
  - [ ] Show button only for approved change orders
  - [ ] Generate and download PDF
  - [ ] Auto-save to change_order_attachments with category "contract"
- [ ] **DOC-005**: Add "Export Cost Breakdown" button
  - [ ] Available for all statuses (for internal use)
  - [ ] Generate and download PDF
- [ ] **DOC-006**: Add "Export Approval Records" button
  - [ ] Available for proposed/approved/rejected statuses
  - [ ] Generate and download PDF

### Domain Validation (Orchestrator delegates to `/domain-validator` agent)

- [ ] **DOMAIN-001**: Verify AIA G701 compliance
  - [ ] Check form layout matches AIA standard
  - [ ] Verify all required fields present
  - [ ] Check terminology correctness
  - [ ] Validate cost breakdown format
- [ ] **DOMAIN-002**: Verify CSI MasterFormat codes
  - [ ] Check CSI section format (XX XX XX)
  - [ ] Validate division numbers (01-49)
  - [ ] Ensure descriptions match standard
- [ ] **DOMAIN-003**: Verify change order terminology
  - [ ] Status names match industry standard
  - [ ] Approval workflow follows typical GC → Owner → A/E pattern
  - [ ] Cost terms (markup, contingency) correct

### Document Testing (Orchestrator delegates to `/test-writer` agent)

- [ ] **TEST-009**: Write PDF generation tests
  - [ ] Test AIA G701 generates without errors
  - [ ] Test PDF includes all data fields
  - [ ] Test PDF auto-saves to attachments
  - [ ] Test large change orders (100+ line items) render correctly

---

## Phase 5: Budget and Analytics (Week 7)

### Budget Features (Orchestrator implements)

- [ ] **BUDG-001**: Implement budget impact dashboard
  - [ ] Path: `/[orgSlug]/projects/[projectId]/change-orders/budget`
  - [ ] Show original contract value
  - [ ] Show cumulative change orders by status
  - [ ] Show current contract value
  - [ ] Show percentage change from original
- [ ] **BUDG-002**: Implement cost breakdown by type chart
  - [ ] Pie chart or bar chart
  - [ ] Group by change order type
  - [ ] Show count and total cost per type
- [ ] **BUDG-003**: Implement budget forecast view
  - [ ] Include pending (proposed) change orders
  - [ ] Show forecast vs current contract value
  - [ ] Add confidence indicator
- [ ] **BUDG-004**: Implement budget alert configuration
  - [ ] Settings page: configure threshold percentage (e.g., 10%)
  - [ ] Alert when cumulative COs exceed threshold
  - [ ] Email notification to project managers
- [ ] **BUDG-005**: Implement QuickBooks export
  - [ ] "Export to QuickBooks" button
  - [ ] Generate CSV with QuickBooks-compatible columns
  - [ ] Include: CO number, description, amount, date, CSI section
  - [ ] Download CSV file

### Analytics (Orchestrator implements)

- [ ] **ANAL-001**: Implement approval cycle time analytics
  - [ ] Calculate median days from proposed → approved
  - [ ] Show by approval stage (GC, Owner, Architect)
  - [ ] Compare to baseline/target
- [ ] **ANAL-002**: Implement change order trends
  - [ ] Line chart: COs created over time
  - [ ] Group by type
  - [ ] Show cumulative cost over time
- [ ] **ANAL-003**: Implement top change order drivers
  - [ ] List top 5 RFIs that generated COs
  - [ ] List top 5 cost categories (CSI divisions)
  - [ ] Identify patterns for risk mitigation

### Budget Testing (Orchestrator delegates to `/test-writer` agent)

- [ ] **TEST-010**: Write budget calculation tests
  - [ ] Test cumulative contract value updates correctly
  - [ ] Test forecast includes pending COs
  - [ ] Test budget alerts trigger at threshold
  - [ ] Test QuickBooks CSV format matches spec

---

## Phase 6: Final Polish and Review (Week 8)

### Code Review (Orchestrator delegates to `/code-review` agent)

- [ ] **REVIEW-001**: Review all Server Actions for security
  - [ ] Check RLS policies enforced
  - [ ] Check input validation complete
  - [ ] Check error handling robust
- [ ] **REVIEW-002**: Review UI components for accessibility
  - [ ] Check ARIA labels
  - [ ] Check keyboard navigation
  - [ ] Check color contrast
- [ ] **REVIEW-003**: Review database schema
  - [ ] Check indexes present and correct
  - [ ] Check foreign keys and constraints
  - [ ] Check RLS policies comprehensive

### Build Verification (Orchestrator delegates to `/build-doctor` agent)

- [ ] **BUILD-001**: Run full build and verify no TypeScript errors
  - [ ] Run: `npm run build`
  - [ ] Fix any type errors
  - [ ] Run: `npm run lint`
  - [ ] Fix any linting errors

### Performance Audit (Orchestrator delegates to `/performance` agent)

- [ ] **PERF-003**: Audit change order list performance
  - [ ] Load 1,000 change orders in <500ms
  - [ ] Use Chrome DevTools MCP to profile
  - [ ] Optimize slow queries
- [ ] **PERF-004**: Audit PDF generation performance
  - [ ] Generate AIA G701 in <3 seconds
  - [ ] Test with large change orders (100+ line items)
  - [ ] Optimize if needed

### Final E2E Testing (Orchestrator delegates to `/test-writer` + Playwright MCP)

- [ ] **TEST-011**: Run complete E2E test suite
  - [ ] All critical flows pass
  - [ ] No flaky tests
  - [ ] Fix any failures
- [ ] **TEST-012**: Run load tests
  - [ ] Simulate 50 concurrent users
  - [ ] Measure response times
  - [ ] Identify bottlenecks

### Documentation (Orchestrator implements)

- [ ] **DOC-007**: Write user guide for change orders
  - [ ] How to create a change order
  - [ ] How to submit for approval
  - [ ] How to handle rejections
  - [ ] How to generate AIA G701
- [ ] **DOC-008**: Write API documentation
  - [ ] Document all Server Actions
  - [ ] Include request/response examples
  - [ ] Document error codes
- [ ] **DOC-009**: Update project README
  - [ ] Add change orders to features list
  - [ ] Update architecture diagrams

### Deployment Preparation (Orchestrator implements)

- [ ] **DEPLOY-001**: Create deployment checklist
  - [ ] Verify all migrations run successfully
  - [ ] Verify RLS policies tested
  - [ ] Verify environment variables set
- [ ] **DEPLOY-002**: Create rollback plan
  - [ ] Document how to rollback migrations
  - [ ] Document how to disable change orders menu
- [ ] **DEPLOY-003**: Notify stakeholders
  - [ ] Send deployment announcement
  - [ ] Schedule training sessions
  - [ ] Prepare support documentation

---

## Post-Deployment

- [ ] **POST-001**: Monitor error rates for 48 hours
- [ ] **POST-002**: Collect user feedback
- [ ] **POST-003**: Fix high-priority bugs
- [ ] **POST-004**: Plan Phase 2 enhancements based on feedback

---

## Summary Statistics

**Total Tasks**: 150+
**Estimated Effort**: 7-8 weeks with orchestrator delegation
**Critical Path**: Database → Backend → UI → Integrations → Documents → Review

**Delegation Strategy**:
- Database: 100% delegated to `/database` agent
- Testing: 100% delegated to `/test-writer` agent
- Domain Validation: 100% delegated to `/domain-validator` agent
- Code Review: 100% delegated to `/code-review` agent
- Build Fixes: As needed, delegate to `/build-doctor` agent
- Performance: Delegate to `/performance` agent for optimization passes
- Implementation: Orchestrator implements Server Actions and UI components

**MCP Usage**:
- Docker MCP: For local database testing and migration verification
- Playwright MCP: For E2E test automation
- Chrome DevTools MCP: For performance profiling and optimization
