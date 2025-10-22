# Design: Daily Reports Module

**Change ID**: `add-daily-reports-module`
**Date**: 2025-01-22

## Overview

This document details the technical architecture, design patterns, and implementation decisions for the Daily Reports module. Daily reports are the official record of daily field activities, requiring robust data modeling, offline-capable UX, and integration with external weather data and export systems.

## Architecture Principles

### Domain-Driven Design

**Aggregate Root**: `DailyReport`
- Controls lifecycle of crew entries, equipment entries, material entries, incidents, and attachments
- Enforces business invariants (one report per project per date, required fields before submission)
- All child entities accessed through the aggregate root

**Value Objects**:
- `WeatherConditions`: temperature_high, temperature_low, precipitation, wind_speed, humidity
- `WorkHours`: work_hours_start, work_hours_end
- `CrewEntry`: trade, csi_division, headcount, hours_worked, classification
- `EquipmentEntry`: equipment_type, equipment_id, hours_used, operator_name
- `MaterialEntry`: material_description, supplier, quantity, unit, delivery_time
- `Incident`: incident_type, severity, time_occurred, description, corrective_action

**Bounded Context**: Daily Reports exists within the Project Management context but is self-contained. It references Projects and Organizations but does not depend on other construction workflow modules (RFIs, Submittals, Change Orders).

### Data Integrity Patterns

**Unique Constraint Strategy**:
```sql
-- Only one submitted/approved/archived report per project per date
CREATE UNIQUE INDEX daily_reports_project_date_unique
ON daily_reports(project_id, report_date)
WHERE status IN ('submitted', 'approved', 'archived') AND deleted_at IS NULL;

-- Allow multiple drafts (no unique constraint for drafts)
```

**Rationale**: Allows multiple users to prepare drafts for the same date, but only one can be submitted. Prevents accidental duplicate reports after submission.

**Cascading Deletes** (Soft Delete):
- When daily_report is soft deleted (`deleted_at` set), all child entries remain accessible for audit
- Use Postgres triggers to prevent hard deletes on any daily report table
- Archive functionality moves old reports to read-only storage (Phase 2)

**Referential Integrity**:
- All child tables (crew, equipment, materials, incidents, attachments) have `ON DELETE CASCADE` on `daily_report_id` foreign key
- When daily report is hard deleted (admin operation only), all child records are deleted
- Soft deletes preserve all data for audit compliance

### State Machine Design

**Daily Report Status Transitions**:

```
┌─────────┐
│  draft  │ (initial state)
└────┬────┘
     │ submit_daily_report()
     │ [has_required_fields]
     ▼
┌──────────┐
│submitted │
└────┬─────┘
     │ approve_daily_report()
     │ [is_project_manager || is_admin]
     ▼
┌──────────┐
│ approved │
└────┬─────┘
     │ archive_daily_report()
     │ [report_date < 90 days ago]
     ▼
┌──────────┐
│ archived │ (terminal state)
└──────────┘

Any state → deleted (soft delete via deleted_at)
submitted/approved → draft (revert for corrections, requires admin)
```

**Validation Rules**:
- **draft → submitted**: Requires `report_date`, `weather_condition`, and at least one of (crew entries, equipment entries, narrative)
- **submitted → approved**: Requires project manager or admin role
- **approved → archived**: Automatic after 90 days (background job)
- **Revert to draft**: Only admins can revert submitted/approved reports, creates audit log entry

**Status Permissions**:
```typescript
// Status transition authorization matrix
const STATUS_TRANSITIONS = {
  draft: {
    submitted: ['creator', 'project_manager', 'field_supervisor'],
    deleted: ['creator', 'admin']
  },
  submitted: {
    approved: ['project_manager', 'admin'],
    draft: ['admin'], // revert for corrections
    deleted: ['admin']
  },
  approved: {
    archived: ['system'], // automatic after 90 days
    draft: ['admin'], // emergency corrections only
    deleted: ['admin']
  },
  archived: {
    deleted: ['admin'] // soft delete for historical cleanup
  }
};
```

### Performance Optimization

**Database Indexes**:
```sql
-- Primary queries: list reports by project, filter by date range
CREATE INDEX daily_reports_project_date_idx ON daily_reports(project_id, report_date DESC);

-- Filter by status (dashboard, approval queue)
CREATE INDEX daily_reports_project_status_idx ON daily_reports(project_id, status, report_date DESC);

-- Search by creator (my reports)
CREATE INDEX daily_reports_creator_idx ON daily_reports(created_by, report_date DESC);

-- Weather-based queries (analytics)
CREATE INDEX daily_reports_weather_idx ON daily_reports(project_id, weather_condition, report_date);

-- Child table lookups (join optimization)
CREATE INDEX crew_entries_report_idx ON daily_report_crew_entries(daily_report_id);
CREATE INDEX equipment_entries_report_idx ON daily_report_equipment_entries(daily_report_id);
CREATE INDEX material_entries_report_idx ON daily_report_material_entries(daily_report_id);
CREATE INDEX incidents_report_idx ON daily_report_incidents(daily_report_id);
CREATE INDEX attachments_report_idx ON daily_report_attachments(daily_report_id);

-- Analytics: crew by trade, equipment hours
CREATE INDEX crew_entries_trade_idx ON daily_report_crew_entries(daily_report_id, trade, hours_worked);
CREATE INDEX equipment_entries_type_idx ON daily_report_equipment_entries(daily_report_id, equipment_type, hours_used);
```

**Query Optimization**:
- Use `SELECT DISTINCT ON (project_id, report_date)` for latest report per date
- Pre-aggregate crew/equipment counts in daily_reports table (`total_crew_count`, updated via trigger)
- Use Postgres materialized views for analytics (weekly/monthly summaries)

**Caching Strategy**:
```typescript
// React Query cache keys
const QUERY_KEYS = {
  dailyReports: (projectId: string) => ['daily-reports', projectId],
  dailyReport: (id: string) => ['daily-report', id],
  dailyReportEntries: (reportId: string) => ['daily-report-entries', reportId],
  dailyReportWeather: (location: string, date: string) => ['weather', location, date],
  dailyReportExport: (reportId: string, format: string) => ['daily-report-export', reportId, format]
};

// Cache invalidation on mutations
const invalidateReportCache = (projectId: string, reportId?: string) => {
  queryClient.invalidateQueries(['daily-reports', projectId]);
  if (reportId) {
    queryClient.invalidateQueries(['daily-report', reportId]);
    queryClient.invalidateQueries(['daily-report-entries', reportId]);
  }
};
```

## Technical Decisions

### 1. Weather API Integration

**Decision**: Use OpenWeatherMap One Call API 3.0 (free tier: 1,000 calls/day)

**Rationale**:
- **Global coverage**: Works for projects worldwide (vs NOAA US-only)
- **Historical data**: Supports lookback up to 5 days for late report entry
- **Free tier sufficient**: 1,000 calls/day = 42 concurrent projects reporting daily (well above MVP scale)
- **Rich data**: Temperature, precipitation, wind, humidity, weather condition codes

**Implementation**:
```typescript
// Weather API client with caching
export async function fetchWeatherData(
  latitude: number,
  longitude: number,
  date: Date
): Promise<WeatherData> {
  const cacheKey = `weather:${latitude},${longitude}:${format(date, 'yyyy-MM-dd')}`;

  // Check cache (Redis or in-memory for dev)
  const cached = await cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Fetch from OpenWeatherMap
  const timestamp = Math.floor(date.getTime() / 1000);
  const response = await fetch(
    `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${latitude}&lon=${longitude}&dt=${timestamp}&appid=${process.env.OPENWEATHER_API_KEY}`
  );

  if (!response.ok) {
    // Fallback: allow manual entry
    throw new WeatherAPIError('Failed to fetch weather data');
  }

  const data = await response.json();
  const weatherData = transformWeatherData(data);

  // Cache for 24 hours (historical weather doesn't change)
  await cache.set(cacheKey, JSON.stringify(weatherData), { ex: 86400 });

  return weatherData;
}
```

**Fallback Strategy**:
- If API fails or rate limited, show manual entry form
- Pre-populate from previous day's weather as default
- Display warning badge: "Weather manually entered (API unavailable)"

**Rate Limit Handling**:
- Cache weather data per location/date (avoid duplicate calls)
- Batch requests for multiple projects in same location
- Implement exponential backoff on 429 errors
- Admin dashboard to monitor API usage (Phase 2)

### 2. Photo Upload & Compression

**Decision**: Client-side compression using `browser-image-compression` before upload

**Rationale**:
- **Bandwidth savings**: Reduce 5MB photos → <500KB before upload (10x reduction)
- **Faster uploads**: Critical for field connectivity (LTE/3G)
- **Storage costs**: $0.021/GB/month on Supabase Storage, compression saves ~$20/month per 1,000 photos
- **User experience**: Progress bars show faster completion, less timeout risk

**Compression Settings**:
```typescript
import imageCompression from 'browser-image-compression';

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5, // 500KB max
  maxWidthOrHeight: 1920, // HD resolution sufficient for field photos
  useWebWorker: true, // offload to background thread
  fileType: 'image/jpeg', // convert all to JPEG
  initialQuality: 0.8 // good balance of quality/size
};

async function compressAndUpload(file: File, reportId: string) {
  // Show progress to user
  const compressedFile = await imageCompression(file, {
    ...COMPRESSION_OPTIONS,
    onProgress: (progress) => {
      updateUploadProgress(file.name, progress * 0.5); // compression is 50% of total progress
    }
  });

  // Upload compressed file to Supabase Storage
  const { data, error } = await supabase.storage
    .from('daily-report-attachments')
    .upload(`${reportId}/${uuidv4()}.jpg`, compressedFile, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Extract EXIF metadata (GPS, timestamp)
  const exifData = await extractExifData(file); // use original file for EXIF

  return { storagePath: data.path, exifData };
}
```

**EXIF Extraction**:
```typescript
import exifr from 'exifr';

async function extractExifData(file: File): Promise<ExifData | null> {
  try {
    const exif = await exifr.parse(file, {
      gps: true,
      exif: true,
      ifd0: true
    });

    return {
      latitude: exif.latitude ?? null,
      longitude: exif.longitude ?? null,
      capturedAt: exif.DateTimeOriginal ?? null,
      deviceModel: exif.Model ?? null,
      orientation: exif.Orientation ?? 1
    };
  } catch (error) {
    // EXIF not available (screenshot, edited photo, etc.)
    return null;
  }
}
```

**Privacy Controls**:
- Admin setting: "Strip GPS coordinates from photos" (default: off)
- User consent dialog on first photo upload explaining EXIF data capture
- EXIF data stored in database (not embedded in photo) for easier auditing/deletion

### 3. One-Report-Per-Date Constraint

**Decision**: Use partial unique index on (project_id, report_date) WHERE status != 'draft'

**Rationale**:
- **Allows draft flexibility**: Multiple users can prepare drafts, first to submit "wins"
- **Prevents duplicate submissions**: Only one official report per project per date
- **Database-enforced**: Application logic can't bypass constraint (security)

**Conflict Handling**:
```typescript
export async function submitDailyReport(reportId: string, userId: string) {
  try {
    // Optimistic: attempt to submit
    const { data, error } = await supabase
      .from('daily_reports')
      .update({
        status: 'submitted',
        submitted_by: userId,
        submitted_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .eq('status', 'draft') // only allow draft → submitted
      .single();

    if (error) {
      // Check if constraint violation (duplicate date)
      if (error.code === '23505') {
        // Find the existing report
        const existingReport = await findExistingReport(reportId);
        throw new DuplicateReportError(
          'A report has already been submitted for this date',
          existingReport
        );
      }
      throw error;
    }

    return data;
  } catch (error) {
    // Show user-friendly error with link to existing report
    if (error instanceof DuplicateReportError) {
      showConflictDialog(error.existingReport);
    }
    throw error;
  }
}
```

**UI Conflict Resolution**:
```typescript
// Show dialog when duplicate detected
function ConflictDialog({ existingReport }: { existingReport: DailyReport }) {
  return (
    <AlertDialog>
      <AlertDialogTitle>Report Already Submitted</AlertDialogTitle>
      <AlertDialogDescription>
        A daily report for {format(existingReport.report_date, 'PPP')} has already been submitted by{' '}
        {existingReport.submitted_by_name}.
      </AlertDialogDescription>
      <AlertDialogAction onClick={() => navigateToReport(existingReport.id)}>
        View Existing Report
      </AlertDialogAction>
      <AlertDialogAction onClick={() => deleteCurrentDraft()}>
        Delete My Draft
      </AlertDialogAction>
    </AlertDialog>
  );
}
```

### 4. Copy-From-Previous Functionality

**Decision**: Server action to duplicate previous day's crew/equipment entries

**Rationale**:
- **User efficiency**: Most days have similar crew/equipment (same trades on-site)
- **Accuracy**: Starting from yesterday's data ensures consistency (vs remembering from scratch)
- **Adoption**: Reduces completion time from ~15 min to <5 min (critical for field users)

**Implementation**:
```typescript
export async function copyFromPreviousReport(
  projectId: string,
  currentDate: string,
  userId: string
): Promise<DailyReport> {
  // Find previous report (most recent before current date)
  const previousReport = await supabase
    .from('daily_reports')
    .select('*, crew_entries:daily_report_crew_entries(*), equipment_entries:daily_report_equipment_entries(*)')
    .eq('project_id', projectId)
    .lt('report_date', currentDate)
    .order('report_date', { ascending: false })
    .limit(1)
    .single();

  if (!previousReport) {
    throw new Error('No previous report found to copy from');
  }

  // Create new draft report
  const newReport = await supabase
    .from('daily_reports')
    .insert({
      project_id: projectId,
      report_date: currentDate,
      status: 'draft',
      created_by: userId,
      // Copy basic fields (user can modify)
      work_hours_start: previousReport.work_hours_start,
      work_hours_end: previousReport.work_hours_end,
      narrative: '' // don't copy narrative (date-specific)
    })
    .select()
    .single();

  // Duplicate crew entries
  if (previousReport.crew_entries?.length > 0) {
    const crewEntries = previousReport.crew_entries.map(entry => ({
      daily_report_id: newReport.id,
      trade: entry.trade,
      csi_division: entry.csi_division,
      subcontractor_org_id: entry.subcontractor_org_id,
      headcount: entry.headcount,
      hours_worked: entry.hours_worked,
      classification: entry.classification,
      hourly_rate: entry.hourly_rate,
      notes: '' // don't copy notes (date-specific)
    }));

    await supabase.from('daily_report_crew_entries').insert(crewEntries);
  }

  // Duplicate equipment entries
  if (previousReport.equipment_entries?.length > 0) {
    const equipmentEntries = previousReport.equipment_entries.map(entry => ({
      daily_report_id: newReport.id,
      equipment_type: entry.equipment_type,
      equipment_id: entry.equipment_id,
      operator_name: entry.operator_name,
      hours_used: entry.hours_used,
      fuel_consumed: entry.fuel_consumed,
      rental_cost: entry.rental_cost,
      notes: '' // don't copy notes (date-specific)
    }));

    await supabase.from('daily_report_equipment_entries').insert(equipmentEntries);
  }

  return newReport;
}
```

**UX Flow**:
1. User clicks "New Daily Report" for date X
2. System checks if previous report exists (date < X)
3. If yes, show prompt: "Copy crew & equipment from [previous date]? (You can edit after)"
4. If accepted, create draft with copied entries
5. User modifies headcount/hours/notes as needed, adds materials/incidents/photos
6. Submit

### 5. PDF Export Generation

**Decision**: Use `@react-pdf/renderer` for server-side PDF generation

**Rationale**:
- **React familiarity**: Write PDF layout using React components (same skillset as UI)
- **Consistency**: Exact same styling as on-screen view → PDF
- **Customization**: Easy to add company logo, custom headers/footers per organization
- **Server-side**: Generate PDFs in API route (don't block client, support bulk exports)

**PDF Structure**:
```typescript
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  section: { marginBottom: 15 },
  table: { display: 'table', width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#000' },
  // ... more styles
});

export function DailyReportPDF({ report }: { report: DailyReportWithEntries }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{report.project_name}</Text>
            <Text>Daily Report #{report.id.slice(0, 8)}</Text>
            <Text>Date: {format(report.report_date, 'PPP')}</Text>
          </View>
          <Image src={report.organization_logo_url} style={{ width: 100, height: 50 }} />
        </View>

        {/* Weather */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weather Conditions</Text>
          <View style={styles.row}>
            <Text>Condition: {report.weather_condition}</Text>
            <Text>Temp: {report.temperature_high}°F / {report.temperature_low}°F</Text>
            <Text>Precipitation: {report.precipitation}"</Text>
            <Text>Wind: {report.wind_speed} mph</Text>
          </View>
        </View>

        {/* Crew Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Crew Hours</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableHeader}>Trade</Text>
              <Text style={styles.tableHeader}>Headcount</Text>
              <Text style={styles.tableHeader}>Hours</Text>
              <Text style={styles.tableHeader}>Classification</Text>
            </View>
            {report.crew_entries.map((entry, i) => (
              <View key={i} style={styles.tableRow}>
                <Text>{entry.trade}</Text>
                <Text>{entry.headcount}</Text>
                <Text>{entry.hours_worked}</Text>
                <Text>{entry.classification}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Equipment, Materials, Incidents (similar structure) */}

        {/* Photos (thumbnails grid) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos ({report.attachments.length})</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {report.attachments.slice(0, 12).map((attachment, i) => (
              <Image
                key={i}
                src={attachment.thumbnail_url}
                style={{ width: 80, height: 80, margin: 5 }}
              />
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Submitted by: {report.submitted_by_name} on {format(report.submitted_at, 'PPP')}</Text>
          <Text>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
}
```

**API Route**:
```typescript
// app/api/daily-reports/[id]/export/pdf/route.ts
import { renderToStream } from '@react-pdf/renderer';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const report = await fetchDailyReportWithEntries(params.id);

  if (!report) {
    return new Response('Report not found', { status: 404 });
  }

  // Check authorization
  const user = await getUser(request);
  if (!canAccessProject(user, report.project_id)) {
    return new Response('Unauthorized', { status: 403 });
  }

  // Generate PDF stream
  const stream = await renderToStream(<DailyReportPDF report={report} />);

  return new Response(stream as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="daily-report-${format(report.report_date, 'yyyy-MM-dd')}.pdf"`
    }
  });
}
```

### 6. QuickBooks Crew Hours Export

**Decision**: Generate CSV in QuickBooks IIF (Intuit Interchange Format) for crew hours import

**Rationale**:
- **Minimal integration**: No OAuth, no API keys, just file download → import
- **User control**: Accountants review data before importing (vs automatic sync)
- **Phase 1 scope**: Defer direct QuickBooks API integration to Phase 2 (requires OAuth, error handling, mapping setup)

**CSV Format** (QuickBooks IIF):
```
!TIMEACT	DATE	JOB	EMP	ITEM	PITEM	DURATION	NOTE
TIMEACT	1/20/2025	Project-ABC	John Smith	Carpenter-Journeyman	Labor	8.0	Daily Report: Framing work
TIMEACT	1/20/2025	Project-ABC	Jane Doe	Electrician	Labor	6.5	Daily Report: Rough-in
```

**Export Implementation**:
```typescript
export async function generateCrewHoursCSV(reportId: string): Promise<string> {
  const report = await fetchDailyReportWithCrewEntries(reportId);

  const rows = [
    '!TIMEACT\tDATE\tJOB\tEMP\tITEM\tPITEM\tDURATION\tNOTE'
  ];

  for (const entry of report.crew_entries) {
    // If individual workers tracked (future), create one row per worker
    // For MVP, create one row per trade with generic "Crew" employee
    rows.push([
      'TIMEACT',
      format(report.report_date, 'M/d/yyyy'),
      report.project_name,
      `${entry.trade} Crew`, // Generic crew name
      entry.classification,
      'Labor',
      (entry.hours_worked / entry.headcount).toFixed(1), // hours per person
      `Daily Report: ${entry.notes || entry.trade}`
    ].join('\t'));
  }

  return rows.join('\n');
}
```

**Future Enhancement** (Phase 2):
- QuickBooks Online API direct integration
- Map crew entries → QuickBooks employees (setup wizard)
- Automatic sync on report approval
- Error handling for missing employee mappings

## Security Considerations

### Row-Level Security (RLS)

**Daily Reports Access Policy**:
```sql
-- Users can view daily reports for projects they have access to
CREATE POLICY "Users can view daily reports for their projects"
ON daily_reports FOR SELECT
USING (project_id IN (SELECT user_project_ids()));

-- Users can create draft reports for their projects
CREATE POLICY "Users can create daily reports for their projects"
ON daily_reports FOR INSERT
WITH CHECK (
  project_id IN (SELECT user_project_ids())
  AND status = 'draft'
  AND created_by = auth.uid()
);

-- Users can update their own draft reports
CREATE POLICY "Users can update their own draft daily reports"
ON daily_reports FOR UPDATE
USING (
  project_id IN (SELECT user_project_ids())
  AND status = 'draft'
  AND created_by = auth.uid()
);

-- Project managers can update submitted reports (approve)
CREATE POLICY "Project managers can update submitted daily reports"
ON daily_reports FOR UPDATE
USING (
  project_id IN (SELECT user_project_ids())
  AND user_has_project_role(project_id, ARRAY['project_manager', 'admin'])
);

-- Admins can soft delete any report
CREATE POLICY "Admins can soft delete daily reports"
ON daily_reports FOR UPDATE
USING (
  project_id IN (SELECT user_project_ids())
  AND user_has_project_role(project_id, ARRAY['admin'])
);
```

**Child Entities RLS** (Crew, Equipment, Materials, Incidents, Attachments):
```sql
-- Inherit access from parent daily_report
CREATE POLICY "Users can view entries for accessible reports"
ON daily_report_crew_entries FOR SELECT
USING (
  daily_report_id IN (
    SELECT id FROM daily_reports WHERE project_id IN (SELECT user_project_ids())
  )
);

-- Similar policies for equipment, materials, incidents, attachments
```

### Sensitive Data Handling

**Photo Privacy**:
- **EXIF stripping** (optional): Admin setting to remove GPS coordinates before storage
- **Consent dialog**: First-time photo upload shows explanation of EXIF capture
- **Audit logging**: Track who accessed photos, when, from where (IP address)
- **Signed URLs**: Use Supabase Storage signed URLs (expire after 1 hour) for photo access

**Crew Hour Data**:
- **Hourly rates**: Stored encrypted at rest (Supabase default AES-256)
- **PII considerations**: Classification (Foreman, Journeyman) not considered PII, names in notes are free-text (warn users)
- **Export audit**: Log all crew hours CSV exports (who, when, what date range)

**Incident Reports**:
- **OSHA recordability**: Flag safety incidents requiring OSHA Form 300 reporting
- **Confidentiality**: Restrict incident details to project managers and admins (RLS policy)
- **Legal holds**: Support for freezing reports under litigation hold (Phase 2)

## Testing Strategy

### Unit Tests (Vitest)

**State Machine**:
```typescript
describe('Daily Report Status Transitions', () => {
  it('allows draft → submitted with required fields', async () => {
    const report = createDraftReport({ crew_entries: [mockCrewEntry] });
    await expect(submitDailyReport(report.id)).resolves.toMatchObject({ status: 'submitted' });
  });

  it('prevents draft → submitted without required fields', async () => {
    const report = createDraftReport({ crew_entries: [] });
    await expect(submitDailyReport(report.id)).rejects.toThrow('Missing required fields');
  });

  it('prevents duplicate submissions for same date', async () => {
    await submitDailyReport(report1.id); // 2025-01-20
    const report2 = createDraftReport({ report_date: '2025-01-20' });
    await expect(submitDailyReport(report2.id)).rejects.toThrow(DuplicateReportError);
  });
});
```

**Weather API**:
```typescript
describe('Weather API Integration', () => {
  it('fetches weather data from OpenWeatherMap', async () => {
    mockFetch('https://api.openweathermap.org/...', mockWeatherResponse);
    const weather = await fetchWeatherData(37.7749, -122.4194, new Date('2025-01-20'));
    expect(weather).toMatchObject({
      condition: 'partly_cloudy',
      temperature_high: 62,
      temperature_low: 48
    });
  });

  it('falls back to manual entry on API failure', async () => {
    mockFetch('https://api.openweathermap.org/...', { status: 500 });
    await expect(fetchWeatherData(...)).rejects.toThrow(WeatherAPIError);
  });
});
```

### Integration Tests (Playwright)

**RLS Policies**:
```typescript
describe('Daily Report RLS', () => {
  it('prevents users from viewing reports for projects they cannot access', async () => {
    const { data, error } = await supabase
      .from('daily_reports')
      .select()
      .eq('id', otherProjectReport.id);

    expect(data).toEqual([]);
  });

  it('allows project managers to approve reports', async () => {
    await signInAs('project_manager@acme.com');
    const { error } = await supabase
      .from('daily_reports')
      .update({ status: 'approved' })
      .eq('id', submittedReport.id);

    expect(error).toBeNull();
  });
});
```

### E2E Tests (Playwright)

**Critical Flow**:
```typescript
test('Complete daily report workflow', async ({ page }) => {
  // 1. Navigate to daily reports
  await page.goto('/projects/abc/daily-reports');
  await page.click('text=New Daily Report');

  // 2. Select date (auto-populates weather)
  await page.fill('input[name="report_date"]', '2025-01-20');
  await expect(page.locator('text=partly_cloudy')).toBeVisible();

  // 3. Add crew entry
  await page.click('text=Add Crew');
  await page.fill('input[name="trade"]', 'Electrician');
  await page.fill('input[name="headcount"]', '3');
  await page.fill('input[name="hours_worked"]', '24');
  await page.click('text=Save Entry');

  // 4. Upload photos
  await page.setInputFiles('input[type="file"]', ['./test/fixtures/photo1.jpg', './test/fixtures/photo2.jpg']);
  await expect(page.locator('text=2 photos uploaded')).toBeVisible();

  // 5. Submit
  await page.click('text=Submit Report');
  await expect(page.locator('text=Report submitted successfully')).toBeVisible();

  // 6. Verify in list
  await page.goto('/projects/abc/daily-reports');
  await expect(page.locator('text=Jan 20, 2025')).toHaveAttribute('data-status', 'submitted');
});
```

## Migration Strategy

### Database Migrations

**Order of execution**:
1. Create enums (status, weather_condition, incident_type, severity)
2. Create `daily_reports` table
3. Create child tables (crew_entries, equipment_entries, material_entries, incidents, attachments)
4. Create indexes
5. Create RLS policies
6. Create audit logging triggers
7. Seed sample data (dev/staging only)

**Migration Files**:
```
20250123000000_create_daily_report_enums.sql
20250123000001_create_daily_reports_table.sql
20250123000002_create_daily_report_crew_entries_table.sql
20250123000003_create_daily_report_equipment_entries_table.sql
20250123000004_create_daily_report_material_entries_table.sql
20250123000005_create_daily_report_incidents_table.sql
20250123000006_create_daily_report_attachments_table.sql
20250123000007_create_daily_report_indexes.sql
20250123000008_create_daily_report_rls_policies.sql
20250123000009_create_daily_report_audit_triggers.sql
```

### Zero-Downtime Deployment

**Phase 1: Schema deployment**
- Deploy database migrations during maintenance window (low-traffic)
- Migrations are additive (new tables), no impact on existing features
- RLS policies active from creation (no security gap)

**Phase 2: Feature flag rollout**
- Deploy application code with feature flag `ENABLE_DAILY_REPORTS=false`
- Gradually enable for pilot projects (A/B test)
- Monitor error rates, performance metrics

**Phase 3: General availability**
- Enable for all projects
- Announce to users (email, in-app banner)
- Provide training resources (video walkthrough, documentation)

## Open Technical Questions

1. **Weather API backup**: Should we implement secondary weather API (e.g., NOAA) for redundancy?
   - **Recommendation**: Not for MVP, rely on manual fallback. Add secondary API if we hit rate limits in production.

2. **Photo storage lifecycle**: Archive old photos (>1 year) to cold storage (Glacier) to reduce costs?
   - **Recommendation**: Not for MVP. Monitor storage costs, implement archival policy if costs exceed $500/month.

3. **Concurrency control**: Use optimistic locking (version column) or pessimistic locking (database locks) for report edits?
   - **Recommendation**: Optimistic locking with version column. Draft reports rarely edited concurrently, use last-write-wins with conflict warning.

4. **Weather precision**: Store temperature as integer (rounded) or decimal (precise)?
   - **Recommendation**: Decimal (numeric type) for precision. Construction contracts may reference specific temperature thresholds (e.g., concrete curing requires 50°F+).

5. **Photo thumbnails**: Generate thumbnails server-side (Supabase function) or client-side?
   - **Recommendation**: Client-side using canvas API. Simpler, faster, no server cost. Upload both full-size and thumbnail.

## Performance Targets

### Response Times (p95)
- List daily reports (30 days): <500ms
- Load daily report detail: <300ms
- Submit daily report: <1s
- Upload 10 photos (5MB each): <30s on LTE
- Generate PDF export: <5s
- Fetch weather data (cache hit): <50ms
- Fetch weather data (cache miss): <2s

### Scalability
- 100 concurrent report creators: No degradation
- 1,000 photos uploaded per day: Storage bandwidth <1GB/day (compressed)
- 10,000 daily reports per project: List query <500ms with pagination

### Database Query Budget
- List query: <10ms (indexed scan on project_id + report_date)
- Detail query with joins: <50ms (includes crew, equipment, materials, incidents, attachments)
- Aggregate queries (monthly summaries): <100ms (use materialized views)
