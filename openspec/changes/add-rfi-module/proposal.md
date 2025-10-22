# Proposal: Add RFI Module

**Change ID**: `add-rfi-module`
**Status**: Draft
**Author**: AI Agent
**Date**: 2025-01-22

## Summary

Implement a complete Request for Information (RFI) module to enable construction teams to manage clarification requests on drawings and specifications. RFIs are critical for resolving ambiguities during construction and must provide ball-in-court tracking, SLA monitoring, sequential numbering, and integration with project documents.

## Motivation

RFIs are one of the most frequently used workflows in construction project management. Currently, teams rely on email threads and spreadsheets, leading to:

- **Lost context**: RFIs scattered across email inboxes, no centralized log
- **Missed deadlines**: No SLA tracking or automated reminders
- **Unclear ownership**: Ball-in-court status ambiguous, delays in responses
- **Poor traceability**: Difficult to link RFIs to specific drawings or spec sections
- **Manual overhead**: Sequential numbering managed manually, prone to errors

**Target improvement** (per MVP success criteria): ↓25% median RFI response time vs baseline.

## Goals

1. **Complete RFI lifecycle management**: Draft → Submit → Review → Answer → Close
2. **Ball-in-court tracking**: Clear visibility of who needs to respond at each stage
3. **SLA monitoring**: Automated timers, overdue alerts, response time analytics
4. **Sequential numbering**: Auto-generated per project (e.g., RFI-001, RFI-002)
5. **Document integration**: Link RFIs to drawing sheets, spec sections, photos
6. **Email workflows**: Email-in for RFI creation, email-out for notifications
7. **AI-assisted routing**: Smart suggestions for assignees based on discipline/spec section
8. **Audit compliance**: Immutable history of all RFI state changes

## Non-Goals (Deferred to Future)

- **Advanced AI features**: Auto-generated RFI responses, spec Q&A chatbot (Phase 2)
- **Drawing markup**: On-plan annotations for RFI context (requires PDF viewer first)
- **Mobile-optimized offline**: Full offline RFI creation (Phase 1 is online-only)
- **Custom workflows**: Per-org custom RFI statuses or fields (use JSONB for now)
- **Integration with external systems**: Procore RFI import, ACC sync (roadmap)

## Scope

### In Scope

**Database & Backend**:
- `rfis` table with RLS policies scoped to project access
- `rfi_responses` table for threaded conversations
- `rfi_attachments` junction table for file/drawing references
- Sequential numbering function (Postgres sequence per project)
- RFI status enum: `draft`, `submitted`, `under_review`, `answered`, `closed`, `cancelled`
- Ball-in-court tracking: `assigned_to_id`, `assigned_to_org`
- SLA timers: `due_date`, `response_due_date`, `overdue_at`
- Audit logging triggers for all RFI mutations

**API & Server Actions**:
- CRUD operations: Create, read, update, delete (soft delete) RFIs
- Status transitions with validation (e.g., can't close without answer)
- Assignment operations: Route RFI, reassign, transfer ball-in-court
- Response operations: Add response, mark as official answer
- Attachment operations: Upload files, link to drawing sheets/spec sections
- Analytics queries: Overdue RFIs, average response time, by-discipline metrics

**UI Components**:
- RFI list view with filters (status, assignee, overdue, discipline)
- RFI detail view with full conversation thread
- RFI creation form with attachments and drawing references
- RFI status timeline showing all state transitions
- Quick actions: Assign, respond, close
- Overdue indicator badges and SLA countdown timers

**Integrations**:
- Email-in: Parse incoming emails to create RFIs (using Supabase webhooks)
- Email-out: Send notifications on assignment, response, closure
- QuickBooks export: RFI metadata for billing/cost tracking (basic CSV export)

### Out of Scope (This Proposal)

- Drawing markup/annotations (requires PDF viewer module)
- Voice input for RFI creation (mobile optimization phase)
- Offline-first RFI creation (requires offline sync infrastructure)
- Custom RFI templates per organization (use default structure for MVP)
- External system integrations (Procore, ACC, etc.)

## Affected Capabilities

### New Capabilities

1. **`rfi-lifecycle`**: Core RFI CRUD operations and status workflow management
2. **`rfi-assignments`**: Ball-in-court tracking, routing, and notification system
3. **`rfi-attachments`**: File upload, drawing/spec references, attachment management
4. **`rfi-analytics`**: SLA tracking, reporting, and metrics dashboard

### Modified Capabilities

- **`project-management`**: Add RFI count to project dashboard, recent activity feed
- **`navigation`**: Enable RFI navigation menu item (currently disabled)
- **`notifications`**: Extend notification system for RFI events (assignment, response, overdue)

## Dependencies

### Technical Dependencies

- **Foundation (Completed)**: Auth, multi-tenancy, RLS, audit logging
- **Supabase Storage**: For RFI attachment uploads
- **Email service** (SendGrid/Postmark): For email-in/out workflows
- **React Query**: For optimistic updates and cache management

### Feature Dependencies

- **None required for MVP**: RFIs can function independently
- **Nice-to-have**: PDF viewer for drawing references (can defer to Phase 2)
- **Future**: Document management module for better drawing/spec linking

## Implementation Approach

### Architecture

**Data Model**:
```
rfis
├── id (uuid, PK)
├── project_id (uuid, FK → projects, indexed)
├── number (text, auto-generated: "RFI-001", unique per project)
├── title (text)
├── description (text)
├── discipline (text, e.g., "structural", "mechanical", "electrical")
├── status (enum: draft|submitted|under_review|answered|closed|cancelled)
├── priority (enum: low|medium|high|critical)
├── assigned_to_id (uuid, FK → profiles, nullable for org-level assignments)
├── assigned_to_org (uuid, FK → organizations, for external A/E assignments)
├── created_by (uuid, FK → profiles)
├── submitted_at (timestamptz)
├── due_date (timestamptz)
├── response_due_date (timestamptz)
├── answered_at (timestamptz)
├── closed_at (timestamptz)
├── cost_impact (numeric, estimated $ impact)
├── schedule_impact (integer, estimated days)
├── spec_section (text, CSI division/section)
├── drawing_reference (text, sheet numbers)
├── custom_fields (jsonb)
├── created_at, updated_at, deleted_at
└── RLS: user_project_ids() filter

rfi_responses
├── id (uuid, PK)
├── rfi_id (uuid, FK → rfis)
├── author_id (uuid, FK → profiles)
├── content (text)
├── is_official_answer (boolean, only one true per RFI)
├── created_at, updated_at
└── RLS: via rfi.project_id

rfi_attachments
├── id (uuid, PK)
├── rfi_id (uuid, FK → rfis)
├── file_path (text, Supabase Storage path)
├── file_name (text)
├── file_size (bigint)
├── file_type (text, MIME type)
├── drawing_sheet (text, if linking to existing drawing)
├── uploaded_by (uuid, FK → profiles)
├── created_at
└── RLS: via rfi.project_id
```

**State Machine** (RFI Status):
```
draft → submitted → under_review → answered → closed
              ↓                         ↓
          cancelled                 cancelled
```

**Ball-in-Court Rules**:
- **Draft**: Creator (not yet assigned)
- **Submitted**: Assigned recipient (project manager, A/E, subcontractor)
- **Under Review**: Same as submitted (awaiting response)
- **Answered**: Creator (to review and close)
- **Closed/Cancelled**: No action required

### Technical Decisions

1. **Sequential Numbering**: Use Postgres sequence per project, handle conflicts with retry logic
2. **SLA Timers**: Calculate dynamically based on business hours (exclude weekends/holidays), store `overdue_at` for fast queries
3. **Email-in**: Use Supabase Edge Function to parse email webhooks (SendGrid inbound parse)
4. **Attachments**: Store files in Supabase Storage with signed URLs, max 10MB per file (compression for photos)
5. **AI Routing**: Simple keyword matching initially (spec section → discipline → assignee), defer ML model to Phase 2
6. **Offline Support**: Not in MVP, defer to Phase 2 (RFIs require real-time collaboration)

## Testing Strategy

### Unit Tests
- RFI CRUD Server Actions
- Status transition validation logic
- Sequential numbering collision handling
- SLA calculation functions

### Integration Tests
- RLS policies for RFIs (SQL tests)
- Email-in webhook parsing
- File upload to Supabase Storage
- Notification sending on status changes

### E2E Tests
- **Critical flow**: Create RFI → Assign → Respond → Mark as answered → Close
- **SLA flow**: Create RFI with due date → Verify overdue alert appears
- **Attachment flow**: Upload file → Link to drawing → Verify download
- **Filter flow**: Filter by status, assignee, overdue, discipline

### Load Tests
- 100 concurrent users creating RFIs
- 10,000 RFI list query performance (virtualized table)

## Rollout Plan

### Phase 1: Core MVP (Weeks 5-6)
- Database schema and RLS policies
- Basic CRUD Server Actions
- RFI list and detail UI
- Status workflow and ball-in-court
- Email notifications (no email-in yet)

### Phase 2: Email & Analytics (Week 7)
- Email-in webhook for RFI creation
- SLA monitoring dashboard
- Overdue alerts and reminders
- Basic AI routing suggestions

### Phase 3: Polish & Optimization (Week 8)
- Advanced filters and search
- QuickBooks CSV export
- Performance optimization (query indexes, caching)
- User feedback incorporation

## Success Metrics

### Quantitative
- **Response time**: ↓25% median response time vs baseline (email/spreadsheets)
- **Adoption**: >70% of active projects using RFIs within 2 weeks
- **SLA compliance**: >80% of RFIs answered within due date
- **Performance**: <500ms RFI list query for 1,000 RFIs

### Qualitative
- **User feedback**: NPS >50 from field users and project managers
- **Error rates**: <2% RFI creation failures (validation, conflicts)
- **Support tickets**: <5 RFI-related support requests per 100 active projects

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sequential numbering conflicts | High | Use Postgres sequences + retry logic |
| Email-in spam/abuse | Medium | Rate limiting, sender verification |
| SLA calculation complexity | Medium | Start with simple calendar days, iterate based on feedback |
| File upload failures (large files) | Medium | Client-side compression, chunked uploads with TUS |
| RLS policy bugs exposing RFIs | Critical | Comprehensive SQL integration tests, audit all queries |

## Open Questions

1. **RFI numbering format**: Should it be `RFI-001` or `P001-RFI-001` (include project prefix)?
2. **Email-in source**: Should we use SendGrid, Postmark, or custom SMTP?
3. **SLA business hours**: Should weekends/holidays be excluded from SLA calculations?
4. **Multi-recipient RFIs**: Should one RFI support multiple assignees (e.g., GC + A/E)?
5. **Drawing sheet linking**: Should we support multiple sheet references per RFI?

**Recommendation**: Proceed with simple defaults (RFI-001, SendGrid, calendar days, single assignee, multiple sheets) and iterate based on user feedback.

## Alternatives Considered

### Alternative 1: Use Generic "Issue Tracker" Pattern
**Rejected**: Construction RFIs have specific domain requirements (ball-in-court, CSI spec sections, drawing references) that don't map cleanly to generic issue tracking.

### Alternative 2: Build Email-Only RFI System
**Rejected**: Lacks structured data for analytics and SLA tracking. Email threads don't provide audit trail compliance.

### Alternative 3: Defer RFIs to Phase 2, Focus on Documents First
**Rejected**: RFIs are critical path for MVP success criteria (↓25% response time). Documents can be linked via simple text references initially.

## References

- **Project Context**: `openspec/project.md` (Weeks 5-6 timeline, RFI success criteria)
- **Similar Systems**: Procore RFIs, Autodesk Build RFIs, PlanGrid RFIs
- **Industry Standards**: CSI MasterFormat for spec sections, AIA forms (G716 RFI form)
- **Technical References**: Supabase RLS docs, SendGrid inbound parse API
