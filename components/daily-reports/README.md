# Daily Reports Components

This directory contains components for creating, viewing, and managing daily construction reports.

## Components

### DailyReportForm
Desktop-optimized form for creating daily reports with comprehensive weather information and narrative sections.

**Location**: `daily-report-form.tsx`

**Features**:
- Basic information (date)
- Weather conditions with auto-fetch capability
- Daily summary sections (work performed, delays, safety, visitors)
- Integration with weather API

**Props**:
- `projectId`: Project UUID
- `orgSlug`: Organization slug
- `defaultDate`: Default report date
- `latitude`: Project latitude for weather
- `longitude`: Project longitude for weather
- `previousReport`: Optional previous report data

### DailyReportMobile
Mobile-optimized full-screen interface for creating daily reports.

**Location**: `daily-report-mobile.tsx`

**Features**:
- Full-screen mobile layout with sticky header
- Quick stats cards (crew count, weather)
- Compact card sections for:
  - Work performed
  - Safety (incidents reporting, toolbox talk toggle)
  - Photos (grid with camera button)
  - Equipment (list with hours)
- Fixed bottom submit button
- Touch-friendly UI (56px minimum touch targets)

**Props**:
- `projectId`: Project UUID
- `orgSlug`: Organization slug
- `defaultDate`: Optional report date (defaults to today)

**Design Specifications**:
- Sticky header at top (z-10)
- 2-column quick stats grid
- Compact padding (p-3, p-4)
- Fixed bottom submit button (h-12)
- Bottom padding (pb-20) for mobile navigation
- Large touch targets for mobile interaction

### QuickStatsCard
Compact stat display component used in mobile view.

**Location**: `quick-stats-card.tsx`

**Features**:
- Icon + label + value display
- Compact card layout (p-3 padding)
- Supports lucide-react icons

**Props**:
- `icon`: Lucide icon component
- `label`: Stat label (string)
- `value`: Stat value (string or number)

**Example**:
```tsx
<QuickStatsCard
  icon={Users}
  label="Crew"
  value={24}
/>
```

### WeatherWidget
Displays weather information in a visual card format.

**Location**: `weather-widget.tsx`

**Features**:
- Visual weather condition icon
- Temperature, precipitation, wind, humidity display
- Responsive layout

### DailyReportStatusBadge
Badge component for displaying report status.

**Location**: `daily-report-status-badge.tsx`

**Features**:
- Color-coded status badges
- Supports draft, submitted, approved states

## Usage

### Desktop View
```tsx
import { DailyReportForm } from '@/components/daily-reports/daily-report-form';

<DailyReportForm
  projectId={projectId}
  orgSlug={orgSlug}
  defaultDate="2025-10-29"
  latitude={40.7128}
  longitude={-74.0060}
/>
```

### Mobile View
```tsx
import { DailyReportMobile } from '@/components/daily-reports/daily-report-mobile';

<DailyReportMobile
  projectId={projectId}
  orgSlug={orgSlug}
  defaultDate={new Date()}
/>
```

### Responsive Implementation
To implement responsive views, you can use CSS media queries or the Next.js useMediaQuery pattern:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { DailyReportForm } from '@/components/daily-reports/daily-report-form';
import { DailyReportMobile } from '@/components/daily-reports/daily-report-mobile';

export function DailyReportPage({ projectId, orgSlug }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? (
    <DailyReportMobile projectId={projectId} orgSlug={orgSlug} />
  ) : (
    <DailyReportForm projectId={projectId} orgSlug={orgSlug} defaultDate={new Date().toISOString().split('T')[0]} />
  );
}
```

## Testing

Run tests for daily report components:

```bash
npm test -- daily-reports
```

Tests are located in the `__tests__` directory:
- `quick-stats-card.test.tsx`
- `weather-widget.test.tsx`
- `daily-report-status-badge.test.tsx`

## Integration with Server Actions

The components integrate with server actions in `lib/actions/daily-reports/`:

- `createDailyReport`: Create new daily report
- `updateDailyReport`: Update existing report
- `submitDailyReport`: Submit report for approval
- `approveDailyReport`: Approve submitted report
- `entries/add-crew-entry`: Add crew entry
- `entries/add-equipment-entry`: Add equipment entry
- `entries/add-incident`: Add incident report
- `upload-photos`: Upload photos to report

## Mobile Considerations

The mobile interface (`DailyReportMobile`) is optimized for:
- Touch interactions (minimum 56px touch targets)
- Small screen sizes (full-screen layout)
- One-handed use (fixed bottom button)
- Quick data entry (compact forms, toggles)
- Camera integration (photo uploads)
- Mobile navigation (pb-20 for nav bar)

## Future Enhancements

Potential improvements for mobile interface:
- Offline support with local storage
- Camera capture integration
- GPS location for photo metadata
- Voice-to-text for narratives
- Quick templates for common entries
- Signature capture for approvals
