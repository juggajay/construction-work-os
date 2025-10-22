# Proposal: Add Daily Reports Module

**Change ID**: `add-daily-reports-module`
**Status**: Draft
**Author**: AI Agent
**Date**: 2025-01-22

## Summary

Implement a comprehensive Daily Reports module to enable construction teams to document daily field activities, weather conditions, crew hours, equipment usage, materials received, and incidents. Daily reports are essential for project tracking, compliance, and audit trails, serving as the official record of what occurred on-site each day.

## Motivation

Daily reports are a fundamental requirement for construction project management and legal compliance. Currently, teams rely on paper forms, PDFs, or email reports, leading to:

- **Inconsistent documentation**: Different formats across projects and trades, missing critical data
- **Manual data entry overhead**: Duplicate entry into multiple systems (timekeeping, accounting, project logs)
- **Poor searchability**: Historical reports scattered across emails, file shares, hard drives
- **Delayed reporting**: Reports completed days after the fact, inaccurate recollection
- **Lack of photo integration**: Photos captured separately, no automatic linking to daily context
- **Compliance gaps**: Missing mandatory fields (weather, safety incidents) required for insurance/legal

**Target improvement**: Enable field supervisors to complete daily reports in <5 minutes with mobile device, achieving >90% same-day completion rate (vs ~40% with paper/email baseline).

## Goals

1. **Structured daily documentation**: Weather, crew, equipment, materials, incidents, progress photos
2. **Field-first UX**: Mobile-optimized, glove-friendly, offline-capable data entry
3. **Automatic data capture**: GPS coordinates, weather API integration, photo metadata (EXIF)
4. **Trade/discipline tracking**: Log crew hours by CSI division, subcontractor, and labor classification
5. **Incident reporting**: Safety incidents, delays, visitors, inspections with required fields
6. **Photo management**: Bulk upload with automatic date/location tagging, compression for sync
7. **Historical search**: Filter by date range, weather conditions, trades on-site, incidents
8. **Export capabilities**: PDF generation, QuickBooks crew hour export, AIA daily log format
9. **Voice input**: Hands-free entry for field conditions (Phase 2)
10. **Audit compliance**: Immutable history, timestamped entries, certified payroll integration

## Non-Goals (Deferred to Future)

- **Advanced weather analytics**: Historical weather correlation with productivity metrics (Phase 3)
- **AI-powered insights**: Automatic safety risk detection, crew productivity analysis (Phase 2)
- **Time tracking integration**: Direct integration with payroll systems (Phase 2, start with export)
- **Equipment tracking IoT**: Automatic equipment hour logging via telematics (Phase 3)
- **Custom report templates**: Per-org custom fields and layouts (use JSONB for MVP, UI in Phase 2)
- **Multi-day reports**: Daily reports span exactly one calendar day (no shift-based reporting)

## Scope

### In Scope

**Database & Backend**:
- `daily_reports` table with RLS policies scoped to project access
- `daily_report_crew_entries` table for crew hours by trade/classification
- `daily_report_equipment_entries` table for equipment usage and hours
- `daily_report_material_entries` table for deliveries and materials received
- `daily_report_incidents` table for safety incidents, delays, visitors, inspections
- `daily_report_attachments` junction table for photos and documents
- `daily_report_weather` table for automated weather data capture
- Status enum: `draft`, `submitted`, `approved`, `archived`
- Unique constraint: one report per project per date (can have multiple drafts until submitted)
- Audit logging triggers for all daily report mutations
- Weather API integration (NOAA/OpenWeatherMap) for automatic weather data

**API & Server Actions**:
- CRUD operations: Create, read, update, delete (soft delete) daily reports
- Status transitions: Draft → Submitted → Approved → Archived
- Entry operations: Add/update/delete crew, equipment, material, incident entries
- Attachment operations: Bulk photo upload with compression, geotag extraction
- Weather operations: Fetch current weather, historical weather lookup
- Export operations: Generate PDF report, export crew hours CSV for QuickBooks
- Search/filter: Date range, weather conditions, trades, incidents, submitter

**UI Components**:
- Daily reports list view with calendar picker and filters
- Daily report detail view with all entries and attachments
- Daily report creation form (multi-step wizard for mobile):
  1. Date, project, weather (auto-populated)
  2. Crew entries (trade, headcount, hours, notes)
  3. Equipment entries (equipment type, hours, operator, notes)
  4. Materials entries (delivery, supplier, quantity, location)
  5. Incidents (type, severity, description, corrective action)
  6. Photos (bulk upload with auto-tagging)
  7. Summary/notes (narrative, visitor log, progress highlights)
- Copy-from-previous: Duplicate yesterday's crew/equipment for quick entry
- Calendar view: Visual indicator for completed reports, gaps, pending approvals
- Export dialog: PDF download, QuickBooks CSV export

**Integrations**:
- **Weather API**: Auto-populate current conditions (temp, precipitation, wind, humidity)
- **Photo compression**: Client-side compression (12MP → <500KB) before upload
- **EXIF extraction**: GPS coordinates, timestamp, device info from photo metadata
- **QuickBooks export**: Crew hours CSV formatted for import (Phase 1: manual import)
- **Geolocation**: Verify reports created within project site boundary (Phase 2)

### Out of Scope (This Proposal)

- Voice input for hands-free entry (requires speech-to-text infrastructure)
- Real-time collaboration (multiple users editing same report simultaneously)
- Advanced equipment tracking (telematics/IoT integration)
- Certified payroll integration (Davis-Bacon prevailing wage forms)
- AI-powered safety incident analysis (risk prediction, pattern detection)
- Multi-project daily reports (superintendent overseeing multiple sites)

## Affected Capabilities

### New Capabilities

1. **`daily-report-lifecycle`**: Core daily report CRUD operations and status workflow
2. **`daily-report-entries`**: Crew, equipment, material, and incident entry management
3. **`daily-report-weather`**: Weather API integration and automatic data capture
4. **`daily-report-attachments`**: Photo/document upload, compression, metadata extraction

### Modified Capabilities

- **`project-management`**: Add daily report count to project dashboard, recent activity feed
- **`navigation`**: Add daily reports navigation menu item
- **`notifications`**: Extend notification system for daily report reminders (end-of-day alerts)
- **`export`**: Add daily report PDF and crew hours export to general export functionality

## Dependencies

### Technical Dependencies

- **Foundation (Completed)**: Auth, multi-tenancy, RLS, audit logging
- **Supabase Storage**: For photo/document uploads
- **Weather API** (NOAA/OpenWeatherMap): For automatic weather data capture
- **React Query**: For optimistic updates and cache management
- **Photo compression library** (browser-image-compression or similar): Client-side image processing

### Feature Dependencies

- **None required for MVP**: Daily reports can function independently
- **Nice-to-have**: Document management module for linking to drawing sheets (can defer to Phase 2)
- **Future**: Time tracking module for direct payroll integration

## Implementation Approach

### Architecture

**Data Model**:
```
daily_reports
├── id (uuid, PK)
├── project_id (uuid, FK → projects, indexed)
├── report_date (date, NOT NULL, unique per project when status != 'draft')
├── status (enum: draft|submitted|approved|archived)
├── weather_condition (text: clear|partly_cloudy|overcast|rain|snow|fog|wind)
├── temperature_high (numeric, °F)
├── temperature_low (numeric, °F)
├── precipitation (numeric, inches)
├── wind_speed (numeric, mph)
├── humidity (integer, %)
├── work_hours_start (time)
├── work_hours_end (time)
├── total_crew_count (integer)
├── narrative (text, general description of work performed)
├── delays (text, description of delays or work stoppages)
├── visitors (text, list of visitors, inspectors, officials)
├── inspections (text, inspections conducted)
├── created_by (uuid, FK → profiles)
├── submitted_by (uuid, FK → profiles)
├── submitted_at (timestamptz)
├── approved_by (uuid, FK → profiles)
├── approved_at (timestamptz)
├── custom_fields (jsonb)
├── created_at, updated_at, deleted_at
└── RLS: user_project_ids() filter

daily_report_crew_entries
├── id (uuid, PK)
├── daily_report_id (uuid, FK → daily_reports)
├── trade (text, e.g., "General Labor", "Electrician", "Plumber")
├── csi_division (text, e.g., "26 - Electrical", "22 - Plumbing")
├── subcontractor_org_id (uuid, FK → organizations, nullable for GC crews)
├── headcount (integer, number of workers)
├── hours_worked (numeric, total hours)
├── classification (text, e.g., "Foreman", "Journeyman", "Apprentice", "Laborer")
├── hourly_rate (numeric, for cost tracking, nullable)
├── notes (text)
├── created_at, updated_at
└── RLS: via daily_report.project_id

daily_report_equipment_entries
├── id (uuid, PK)
├── daily_report_id (uuid, FK → daily_reports)
├── equipment_type (text, e.g., "Excavator", "Crane", "Forklift", "Generator")
├── equipment_id (text, internal ID or asset number)
├── operator_name (text)
├── hours_used (numeric)
├── fuel_consumed (numeric, gallons, nullable)
├── rental_cost (numeric, $ per day, nullable)
├── notes (text, condition, issues, maintenance)
├── created_at, updated_at
└── RLS: via daily_report.project_id

daily_report_material_entries
├── id (uuid, PK)
├── daily_report_id (uuid, FK → daily_reports)
├── material_description (text, e.g., "Concrete - 4000 PSI", "Rebar #5")
├── supplier (text)
├── quantity (numeric)
├── unit (text, e.g., "CY", "LF", "EA", "Tons")
├── delivery_time (time)
├── delivery_ticket (text, reference number)
├── location (text, where stored on site)
├── notes (text)
├── created_at, updated_at
└── RLS: via daily_report.project_id

daily_report_incidents
├── id (uuid, PK)
├── daily_report_id (uuid, FK → daily_reports)
├── incident_type (enum: safety|delay|quality|visitor|inspection|other)
├── severity (enum: low|medium|high|critical, nullable for non-safety)
├── time_occurred (time)
├── description (text)
├── involved_parties (text, names, companies)
├── corrective_action (text)
├── reported_to (text, who was notified)
├── follow_up_required (boolean)
├── osha_recordable (boolean, for safety incidents)
├── notes (text)
├── created_at, updated_at
└── RLS: via daily_report.project_id

daily_report_attachments
├── id (uuid, PK)
├── daily_report_id (uuid, FK → daily_reports)
├── file_path (text, Supabase Storage path)
├── file_name (text)
├── file_size (bigint)
├── file_type (text, MIME type)
├── attachment_type (enum: photo|document|other)
├── description (text, nullable)
├── gps_latitude (numeric, from EXIF if available)
├── gps_longitude (numeric, from EXIF if available)
├── captured_at (timestamptz, from EXIF or upload time)
├── uploaded_by (uuid, FK → profiles)
├── created_at
└── RLS: via daily_report.project_id
```

**State Machine** (Daily Report Status):
```
draft → submitted → approved → archived
   ↓         ↓
deleted   deleted (soft delete at any stage)
```

**Business Rules**:
- **One report per project per date**: Only one submitted/approved report allowed per project per calendar day
- **Draft flexibility**: Multiple users can create drafts for same date, only one can submit
- **Required fields for submission**: report_date, weather_condition, at least one of (crew entries OR equipment entries OR narrative)
- **Immutable after submission**: Cannot edit submitted/approved reports (must create corrective entry or revert to draft)
- **Photo limit**: Max 50 photos per report (prevent storage abuse)
- **Date restrictions**: Cannot create reports more than 30 days in the past (unless admin override)

### Technical Decisions

1. **Weather API**: Use OpenWeatherMap free tier initially (1000 calls/day), auto-fetch weather when report created (fallback to manual entry if API fails)
2. **Photo compression**: Use browser-image-compression (client-side) to reduce 12MP → <500KB before upload
3. **EXIF extraction**: Use exif-js library to extract GPS/timestamp from photos, display map thumbnail if coordinates available
4. **One-report-per-date**: Enforce with unique constraint on (project_id, report_date) WHERE status IN ('submitted', 'approved', 'archived')
5. **Copy-from-previous**: Server action to duplicate previous day's crew/equipment entries for quick data entry
6. **PDF generation**: Use react-pdf/renderer to generate downloadable daily report PDFs with company logo
7. **Offline support**: Not in MVP, defer to Phase 2 (daily reports typically completed at end of day with connectivity)
8. **Voice input**: Not in MVP, defer to Phase 2 (requires speech-to-text infrastructure)

## Testing Strategy

### Unit Tests
- Daily report CRUD Server Actions
- Status transition validation logic
- One-report-per-date constraint enforcement
- Weather API integration (mocked)
- Photo compression utility functions
- EXIF extraction utility functions

### Integration Tests
- RLS policies for daily reports (SQL tests)
- Photo upload to Supabase Storage with compression
- Weather API fallback handling (API failure scenarios)
- Copy-from-previous functionality
- PDF generation for reports with all entry types

### E2E Tests
- **Critical flow**: Create draft → Add crew/equipment/materials → Upload photos → Submit → Approve
- **Copy-from-previous flow**: Create report using yesterday's data → Modify entries → Submit
- **Photo upload flow**: Bulk upload 10 photos → Verify compression → Check EXIF extraction
- **Filter flow**: Filter reports by date range, weather, incidents
- **Export flow**: Generate PDF → Verify all data present → Export crew hours CSV

### Load Tests
- 50 concurrent users creating daily reports
- Bulk photo upload (10 photos @ 5MB each per user)
- 1,000+ daily reports list query performance

## Rollout Plan

### Phase 1: Core MVP (Weeks 7-8)
- Database schema and RLS policies
- Basic daily report CRUD Server Actions
- Daily report list and detail UI
- Crew, equipment, material, incident entry forms
- Weather API integration (with manual fallback)
- Photo upload with compression (no EXIF yet)
- Status workflow (draft → submitted)

### Phase 2: Enhancements (Week 9)
- EXIF extraction and GPS display
- Copy-from-previous functionality
- Calendar view with completion indicators
- PDF export generation
- QuickBooks crew hours CSV export
- Approval workflow (submitted → approved)

### Phase 3: Polish & Optimization (Week 10)
- Advanced filters and search
- Historical weather correlation
- Photo gallery improvements (lightbox, thumbnails)
- Performance optimization (query indexes, caching)
- User feedback incorporation

## Success Metrics

### Quantitative
- **Completion rate**: >90% same-day report submission (vs ~40% baseline)
- **Entry time**: <5 minutes median time to complete daily report
- **Adoption**: >80% of active projects using daily reports within 2 weeks
- **Photo uploads**: Average 10+ photos per report (indicates field engagement)
- **Performance**: <1s daily reports list query for 365 days of reports

### Qualitative
- **User feedback**: NPS >60 from field supervisors
- **Data quality**: <5% of reports missing required fields after submission
- **Support tickets**: <3 daily report-related support requests per 100 active projects

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| One-report-per-date conflicts | High | Clear error messaging, allow draft overwrite, show conflicting report |
| Weather API rate limits | Medium | Cache weather data per location/date, fallback to manual entry |
| Photo upload failures (poor connectivity) | High | Client-side compression, TUS resumable uploads, offline queue (Phase 2) |
| Bulk photo uploads slow | Medium | Parallel uploads (max 3 concurrent), progress indicators |
| EXIF privacy concerns | Medium | Strip GPS from photos in admin settings, clear consent messaging |
| Manual data entry fatigue | High | Copy-from-previous, voice input (Phase 2), smart defaults |
| RLS policy bugs exposing reports | Critical | Comprehensive SQL integration tests, audit all queries |

## Open Questions

1. **Weather data source**: OpenWeatherMap (easier) vs NOAA API (more reliable, US-only)?
2. **Report locking**: Should we prevent multiple users from editing same draft simultaneously?
3. **Photo limits**: 50 photos per report reasonable? Storage budget implications?
4. **Historical edits**: Should approved reports be editable with audit trail, or strictly immutable?
5. **Crew entry granularity**: Track individual workers by name, or just headcount/hours by trade?
6. **Equipment tracking**: Link to separate equipment/asset module, or standalone text entries for MVP?

**Recommendation**: Proceed with OpenWeatherMap (free tier, global coverage), no locking (last-write-wins with conflict warning), 50 photo limit, strictly immutable after approval (require admin to revert status), headcount/hours by trade (not individual names), standalone text entries for equipment (asset module in Phase 2).

## Alternatives Considered

### Alternative 1: Use Generic "Activity Log" Pattern
**Rejected**: Construction daily reports have specific domain requirements (weather, crew by trade, certified payroll compatibility, OSHA recordkeeping) that don't map cleanly to generic activity logging.

### Alternative 2: Paper/PDF Forms with Email Submission
**Rejected**: Lacks structured data for analytics, crew hour export, and searchability. Does not achieve target of ↓60% completion time.

### Alternative 3: Defer Daily Reports to Phase 2, Focus on Change Orders First
**Rejected**: Daily reports are critical for field adoption and compliance. Change orders are typically less frequent and can leverage daily report data for justification.

## References

- **Project Context**: `openspec/project.md` (Weeks 7-8 timeline, field-first UX requirements)
- **Similar Systems**: Procore Daily Logs, Raken Daily Reports, PlanGrid Field Reports
- **Industry Standards**: AIA G715 Supplementary Conditions (daily log requirements), OSHA recordkeeping
- **Weather APIs**: OpenWeatherMap API docs, NOAA API documentation
- **Photo Processing**: browser-image-compression library, exif-js library
