# Proposal: Add Submittals Module

**Change ID**: `add-submittals-module`
**Status**: Draft
**Author**: AI Agent
**Date**: 2025-01-22

## Summary

Implement a complete Submittals module to enable construction teams to manage product data, shop drawings, and samples through multi-stage review workflows. Submittals are critical for ensuring installed materials and systems meet contract specifications, requiring tracking through subcontractor → GC → architect/engineer → owner approval chains with version control and compliance verification.

## Motivation

Submittals are one of the most document-intensive and time-consuming workflows in construction. Currently, teams rely on email chains, spreadsheets, and generic document management, leading to:

- **Lost submittals**: Files scattered across email threads, no centralized submittal log
- **Approval bottlenecks**: No visibility into review stages, unclear who needs to act
- **Resubmittal chaos**: Version tracking done manually, risk of installing wrong revision
- **Compliance gaps**: No systematic verification that submittals meet spec requirements
- **Delay costs**: Late submittal approvals delay procurement and installation, costing time and money

**Target improvement** (per MVP success criteria): ↓20% median approval cycle time vs baseline (email/spreadsheets).

## Goals

1. **Complete submittal lifecycle**: Draft → Submit → GC Review → A/E Review → Owner Review (optional) → Approval/Rejection
2. **Multi-stage review workflow**: Clear visibility of current review stage and ball-in-court
3. **Version tracking**: Handle resubmittals with full revision history (Rev 0, Rev A, Rev B, etc.)
4. **CSI spec section mapping**: Link submittals to CSI MasterFormat divisions/sections
5. **Submittal types**: Support product data, shop drawings, samples, and mixed submittals
6. **Approval statuses**: Approved, Approved as Noted, Revise and Resubmit, Rejected
7. **Lead time tracking**: Monitor procurement lead times, flag potential delays
8. **Compliance checking**: Basic keyword/specification matching (AI-enhanced in Phase 2)
9. **Audit compliance**: Immutable history of all review decisions and file versions

## Non-Goals (Deferred to Future)

- **AI compliance verification**: Automatic spec compliance checking using GPT-4 (Phase 2)
- **Drawing markup**: On-document review comments and annotations (requires PDF viewer)
- **Offline submittal creation**: Full offline support (Phase 2)
- **External portal**: Dedicated subcontractor portal for submittal submission (Phase 2)
- **Integration with vendors**: Direct integration with manufacturer product libraries (roadmap)
- **Advanced analytics**: Submittal cycle time analysis, bottleneck detection (Phase 2)

## Scope

### In Scope

**Database & Backend**:
- `submittals` table with RLS policies scoped to project access
- `submittal_reviews` table for multi-stage review workflow
- `submittal_versions` table for resubmittal tracking
- `submittal_attachments` table for file management
- Sequential numbering function per project and CSI section (e.g., "03 30 00-001")
- Submittal status enum: `draft`, `submitted`, `gc_review`, `ae_review`, `owner_review`, `approved`, `approved_as_noted`, `revise_resubmit`, `rejected`, `cancelled`
- Review stage tracking: current stage, ball-in-court assignee
- Lead time tracking: required_on_site date, procurement lead time calculations
- Audit logging triggers for all submittal mutations

**API & Server Actions**:
- CRUD operations: Create, read, update, delete (soft delete) submittals
- Review operations: Submit for review, approve, approve with notes, request revision, reject
- Version operations: Create resubmittal (new version), view version history
- Assignment operations: Route to next stage, reassign reviewer
- Attachment operations: Upload files, link to specifications/drawings
- Analytics queries: Pending submittals by stage, approval cycle times, overdue submittals

**UI Components**:
- Submittal list view with filters (status, CSI section, review stage, overdue)
- Submittal detail view with version history and review timeline
- Submittal creation form with CSI section picker and attachments
- Multi-stage review workflow UI showing progress through stages
- Review action panel: Approve, approve with notes, request revision, reject
- Resubmittal creation flow (copy existing, increment version)
- Submittal log export (PDF/CSV for project closeout)

**Integrations**:
- Email notifications for stage transitions, approvals, rejections
- QuickBooks export: Submittal metadata for cost tracking (basic CSV)
- CSI MasterFormat reference data (imported from standard)

### Out of Scope (This Proposal)

- Drawing markup/annotations (requires PDF viewer module)
- AI compliance checking (Phase 2)
- Offline-first submittal creation (requires offline sync infrastructure)
- Subcontractor portal (separate authentication system needed)
- Manufacturer product library integration (future)
- Advanced analytics dashboard (Phase 2)

## Affected Capabilities

### New Capabilities

1. **`submittal-lifecycle`**: Core submittal CRUD operations and status workflow management
2. **`submittal-reviews`**: Multi-stage review workflow, approvals, rejections, and ball-in-court tracking
3. **`submittal-versions`**: Resubmittal handling, version history, and revision tracking
4. **`submittal-attachments`**: File upload, CSI spec references, and attachment management
5. **`submittal-analytics`**: Lead time tracking, cycle time reporting, and overdue monitoring

### Modified Capabilities

- **`project-management`**: Add submittal count to project dashboard, recent activity feed
- **`navigation`**: Enable submittal navigation menu item
- **`notifications`**: Extend notification system for submittal review events

## Dependencies

### Technical Dependencies

- **Foundation (Completed)**: Auth, multi-tenancy, RLS, audit logging
- **Supabase Storage**: For submittal file uploads (product data PDFs, shop drawings, photos)
- **Email service** (SendGrid/Postmark): For review notifications
- **React Query**: For optimistic updates and cache management
- **CSI MasterFormat data**: Reference table for spec sections

### Feature Dependencies

- **None required for MVP**: Submittals can function independently
- **Nice-to-have**: PDF viewer for reviewing shop drawings in-app (can defer to Phase 2)
- **Future**: Document management module for better spec/drawing linking

## Implementation Approach

### Architecture

**Data Model**:
```
submittals
├── id (uuid, PK)
├── project_id (uuid, FK → projects, indexed)
├── number (text, auto-generated: "03 30 00-001", unique per project+spec section)
├── title (text)
├── description (text)
├── submittal_type (enum: product_data|shop_drawings|samples|mixed)
├── spec_section (text, CSI MasterFormat: "03 30 00")
├── spec_section_title (text, "Cast-in-Place Concrete")
├── status (enum, see below)
├── current_stage (enum: draft|gc_review|ae_review|owner_review|complete)
├── version (text, "Rev 0", "Rev A", "Rev B")
├── version_number (integer, for sorting: 0, 1, 2)
├── parent_submittal_id (uuid, FK → submittals, for resubmittals)
├── created_by (uuid, FK → profiles)
├── submitted_by_org (uuid, FK → organizations, subcontractor)
├── current_reviewer_id (uuid, FK → profiles, ball-in-court)
├── submitted_at (timestamptz)
├── required_on_site (date, when material needed)
├── lead_time_days (integer, procurement lead time)
├── reviewed_at (timestamptz, last review action)
├── closed_at (timestamptz)
├── custom_fields (jsonb)
├── created_at, updated_at, deleted_at
└── RLS: user_project_ids() filter

submittal_reviews
├── id (uuid, PK)
├── submittal_id (uuid, FK → submittals)
├── version_number (integer, which version reviewed)
├── stage (enum: gc_review|ae_review|owner_review)
├── reviewer_id (uuid, FK → profiles)
├── action (enum: approved|approved_as_noted|revise_resubmit|rejected|forwarded)
├── comments (text)
├── reviewed_at (timestamptz)
├── created_at
└── RLS: via submittal.project_id

submittal_versions
├── id (uuid, PK)
├── submittal_id (uuid, FK → submittals)
├── version (text, "Rev 0", "Rev A")
├── version_number (integer, 0, 1, 2)
├── uploaded_by (uuid, FK → profiles)
├── uploaded_at (timestamptz)
├── notes (text, what changed in this version)
└── RLS: via submittal.project_id

submittal_attachments
├── id (uuid, PK)
├── submittal_id (uuid, FK → submittals)
├── version_number (integer, which version this belongs to)
├── file_path (text, Supabase Storage path)
├── file_name (text)
├── file_size (bigint)
├── file_type (text, MIME type)
├── attachment_type (enum: product_data|shop_drawing|sample_photo|specification|other)
├── uploaded_by (uuid, FK → profiles)
├── created_at
└── RLS: via submittal.project_id
```

**State Machine** (Submittal Status):
```
draft → submitted → gc_review → approved/approved_as_noted/revise_resubmit/rejected
                         ↓
                    ae_review → approved/approved_as_noted/revise_resubmit/rejected
                         ↓
                  owner_review → approved/approved_as_noted/revise_resubmit/rejected
                         ↓
                    (optional)

revise_resubmit → (new version created, restart workflow)
```

**Review Workflow Stages**:
1. **Draft**: Submittal being prepared by subcontractor
2. **Submitted**: Submitted to GC for initial review
3. **GC Review**: General contractor reviews for completeness
4. **A/E Review**: Architect/Engineer reviews for spec compliance
5. **Owner Review**: Owner reviews (optional, for owner-approval items)
6. **Complete**: Final approval status (approved, approved as noted, or rejected)

**Ball-in-Court Rules**:
- **Draft**: Creator (subcontractor)
- **GC Review**: Assigned GC project engineer or superintendent
- **A/E Review**: Architect/Engineer contact
- **Owner Review**: Owner representative
- **Revise & Resubmit**: Returns to creator (subcontractor) for revision

### Technical Decisions

1. **Sequential Numbering**: Use format "CSI-SECTION-###" (e.g., "03 30 00-001") for easy spec section grouping
2. **Version Tracking**: Text-based versions ("Rev 0", "Rev A", "Rev B") familiar to construction, plus integer for sorting
3. **Review Workflow**: Flexible stage progression, can skip owner review if not required
4. **Lead Time Tracking**: Calculate procurement deadline based on required_on_site date minus lead_time_days
5. **File Storage**: Organize by project/submittal/version for clean version separation
6. **Approval Types**: Follow AIA standard: Approved (no changes), Approved as Noted (install with minor notes), Revise and Resubmit (major changes required), Rejected (non-compliant)
7. **Offline Support**: Not in MVP, defer to Phase 2 (submittals are less time-critical than daily reports)

## Testing Strategy

### Unit Tests
- Submittal CRUD Server Actions
- Review workflow state transitions
- Sequential numbering by CSI section
- Lead time calculation functions
- Version increment logic (Rev 0 → Rev A → Rev B)

### Integration Tests
- RLS policies for submittals (SQL tests)
- Multi-stage review workflow
- File upload to Supabase Storage
- Notification sending on review actions

### E2E Tests
- **Critical flow**: Create submittal → Submit → GC review → A/E review → Approve
- **Resubmittal flow**: Create submittal → Reject → Create resubmittal (new version) → Approve
- **Lead time flow**: Create submittal with required date → Verify procurement deadline calculated
- **Filter flow**: Filter by CSI section, status, overdue

### Load Tests
- 100 concurrent users viewing submittals
- 10,000 submittal list query performance
- Large file uploads (50MB shop drawings)

## Rollout Plan

### Phase 1: Core MVP (Weeks 7-8)
- Database schema and RLS policies
- Basic CRUD Server Actions
- Submittal list and detail UI
- Single-stage review workflow (GC review only)
- Version tracking for resubmittals
- Email notifications

### Phase 2: Multi-Stage Workflow (Week 9)
- A/E review stage
- Owner review stage (optional)
- Full workflow state machine
- Lead time tracking
- CSI spec section picker

### Phase 3: Polish & Analytics (Week 10)
- Submittal log export (PDF/CSV)
- Cycle time analytics
- Overdue tracking dashboard
- Performance optimization
- User feedback incorporation

## Success Metrics

### Quantitative
- **Approval cycle time**: ↓20% median cycle time vs baseline (email/spreadsheets)
- **Adoption**: >70% of active projects using submittals within 3 weeks
- **Resubmittal rate**: Track percentage requiring revision (baseline for compliance)
- **Performance**: <500ms submittal list query for 1,000 submittals

### Qualitative
- **User feedback**: NPS >50 from GCs, subcontractors, and A/E firms
- **Error rates**: <2% submittal creation failures
- **Support tickets**: <5 submittal-related support requests per 100 active projects

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sequential numbering conflicts by CSI section | Medium | Use Postgres sequences per project+spec section combination |
| Complex multi-stage workflow confusing users | High | Start with simple single-stage, add stages incrementally based on feedback |
| Version tracking confusion (Rev A vs Rev 1) | Medium | Use construction-standard "Rev 0, Rev A, Rev B" format |
| Large file uploads failing (50MB+ shop drawings) | Medium | Client-side compression, chunked uploads with TUS, 50MB limit |
| RLS policy bugs exposing submittals | Critical | Comprehensive SQL integration tests, audit all queries |
| Lead time calculations inaccurate | Low | Start simple (calendar days), add business days logic in Phase 2 |

## Open Questions

1. **CSI spec section**: Should we import full CSI MasterFormat reference data or let users enter free text?
2. **Version format**: Should we support numeric versions (Rev 1, Rev 2) in addition to letter-based (Rev A, Rev B)?
3. **Owner review**: Should owner review be mandatory or optional per submittal?
4. **Multi-product submittals**: How should we handle submittals with multiple products (e.g., "All concrete products")?
5. **External reviewer access**: Should A/E firms get limited guest access or full user accounts?

**Recommendation**: Import CSI MasterFormat data with free text override, support letter-based versions initially (construction standard), make owner review optional, support multi-product via description field, and give A/E firms limited guest access (read-only + review actions).

## Alternatives Considered

### Alternative 1: Use Generic Document Management
**Rejected**: Submittals have specific workflow requirements (multi-stage approvals, version tracking, CSI mapping) that don't fit generic document management patterns.

### Alternative 2: Build Submittal Log Only (No Workflow)
**Rejected**: Simply logging submittals without workflow support doesn't solve the core pain point of approval bottlenecks and unclear ball-in-court.

### Alternative 3: Single-Stage Approval Only
**Considered for MVP**: Start with GC review only, add A/E and owner stages incrementally. This is the adopted approach for Phase 1.

## References

- **Project Context**: `openspec/project.md` (Weeks 7-8 timeline, submittal success criteria)
- **Similar Systems**: Procore Submittals, Autodesk Build Submittals, PlanGrid Submittals
- **Industry Standards**: CSI MasterFormat for spec sections, AIA approval statuses
- **Technical References**: Supabase RLS docs, TUS resumable upload protocol
