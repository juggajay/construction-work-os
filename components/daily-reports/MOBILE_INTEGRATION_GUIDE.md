# Mobile Daily Report Integration Guide

## Overview
This guide shows how to integrate the `DailyReportMobile` component with existing server actions and enhance it with real functionality.

## Current State

The `DailyReportMobile` component is currently a presentation component with basic state management. To make it fully functional, integrate it with the existing server actions.

## Integration Steps

### 1. Connect to Create Daily Report Action

Update the `handleSubmit` function to use the existing `createDailyReport` action:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createDailyReport } from '@/lib/actions/daily-reports';
import { DailyReportMobile } from './daily-report-mobile';

export function DailyReportMobileContainer({
  projectId,
  orgSlug,
  latitude,
  longitude,
}: {
  projectId: string;
  orgSlug: string;
  latitude: number;
  longitude: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: {
    workPerformed: string;
    hasIncidents: boolean;
    toolboxTalk: boolean;
  }) => {
    setError(null);

    startTransition(async () => {
      const result = await createDailyReport({
        projectId,
        reportDate: new Date().toISOString().split('T')[0],
        latitude,
        longitude,
        narrative: formData.workPerformed,
        safetyNotes: formData.toolboxTalk ? 'Toolbox talk completed' : '',
      });

      if (result.success && result.data) {
        router.push(`/${orgSlug}/projects/${projectId}/daily-reports/${result.data.id}`);
      } else {
        setError(result.error || 'Failed to create daily report');
      }
    });
  };

  return (
    <DailyReportMobile
      projectId={projectId}
      orgSlug={orgSlug}
      onSubmit={handleSubmit}
      isPending={isPending}
      error={error}
    />
  );
}
```

### 2. Add Equipment Entry Integration

Add equipment management using `addEquipmentEntry` action:

```tsx
import { addEquipmentEntry } from '@/lib/actions/daily-reports/entries';

const handleAddEquipment = async (
  dailyReportId: string,
  equipment: { description: string; hours: number }
) => {
  const result = await addEquipmentEntry({
    dailyReportId,
    equipmentDescription: equipment.description,
    quantity: 1,
    hoursUsed: equipment.hours,
  });

  if (result.success) {
    // Refresh equipment list
  } else {
    // Show error
  }
};
```

### 3. Add Photo Upload Integration

Connect to photo upload using `uploadPhotos` action:

```tsx
import { uploadPhotos } from '@/lib/actions/daily-reports';

const handlePhotoUpload = async (
  dailyReportId: string,
  file: File
) => {
  const result = await uploadPhotos({
    dailyReportId,
    fileName: file.name,
    fileSize: file.size,
    contentType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
    category: 'progress',
  });

  if (result.success) {
    // Upload file to storage URL
    // Refresh photos list
  } else {
    // Show error
  }
};
```

### 4. Add Incident Reporting

Connect to incident reporting using `addIncident` action:

```tsx
import { addIncident } from '@/lib/actions/daily-reports/entries';

const handleReportIncident = async (
  dailyReportId: string,
  incident: { description: string; severity: string }
) => {
  const result = await addIncident({
    dailyReportId,
    incidentType: 'safety',
    severity: incident.severity as 'low' | 'medium' | 'high' | 'critical',
    description: incident.description,
    followUpRequired: true,
  });

  if (result.success) {
    // Show success message
  } else {
    // Show error
  }
};
```

### 5. Add Crew Count Integration

Connect to crew entry using `addCrewEntry` action:

```tsx
import { addCrewEntry } from '@/lib/actions/daily-reports/entries';

const handleUpdateCrewCount = async (
  dailyReportId: string,
  count: number
) => {
  const result = await addCrewEntry({
    dailyReportId,
    trade: 'General Labor',
    headcount: count,
    hoursWorked: 8,
  });

  if (result.success) {
    // Update crew count display
  } else {
    // Show error
  }
};
```

## Enhanced Mobile Component

Here's an example of a fully-integrated mobile component:

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { QuickStatsCard } from './quick-stats-card';
import { createDailyReport } from '@/lib/actions/daily-reports';
import { addEquipmentEntry, addIncident } from '@/lib/actions/daily-reports/entries';
import { Users, Cloud, Camera, Plus, AlertTriangle, Loader2 } from 'lucide-react';

interface DailyReportMobileEnhancedProps {
  projectId: string;
  orgSlug: string;
  latitude: number;
  longitude: number;
  defaultDate?: Date;
}

export function DailyReportMobileEnhanced({
  projectId,
  orgSlug,
  latitude,
  longitude,
  defaultDate = new Date(),
}: DailyReportMobileEnhancedProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [workPerformed, setWorkPerformed] = useState('');
  const [hasIncidents, setHasIncidents] = useState(false);
  const [toolboxTalk, setToolboxTalk] = useState(false);
  const [crewCount, setCrewCount] = useState(24);
  const [weather, setWeather] = useState('Loading...');
  const [equipment, setEquipment] = useState([
    { id: '1', name: 'Excavator CAT 320', hours: 8 },
    { id: '2', name: 'Crane 50T', hours: 4 },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      // Create the daily report
      const result = await createDailyReport({
        projectId,
        reportDate: format(defaultDate, 'yyyy-MM-dd'),
        latitude,
        longitude,
        narrative: workPerformed,
        safetyNotes: toolboxTalk ? 'Toolbox talk completed' : '',
      });

      if (!result.success || !result.data) {
        setError(result.error || 'Failed to create daily report');
        return;
      }

      const dailyReportId = result.data.id;

      // Add equipment entries
      for (const eq of equipment) {
        await addEquipmentEntry({
          dailyReportId,
          equipmentDescription: eq.name,
          quantity: 1,
          hoursUsed: eq.hours,
        });
      }

      // Add incident if reported
      if (hasIncidents) {
        await addIncident({
          dailyReportId,
          incidentType: 'safety',
          description: 'Incident reported - details to be filled',
          followUpRequired: true,
        });
      }

      // Navigate to the report
      router.push(`/${orgSlug}/projects/${projectId}/daily-reports/${dailyReportId}`);
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Daily Report</h1>
          <Badge>{format(defaultDate, 'MMM d, yyyy')}</Badge>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4">
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <QuickStatsCard icon={Users} label="Crew" value={crewCount} />
        <QuickStatsCard icon={Cloud} label="Weather" value={weather} />
      </div>

      {/* Report Sections */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Work Performed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Work Performed</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Describe today's work..."
              className="min-h-[100px] text-base"
              value={workPerformed}
              onChange={(e) => setWorkPerformed(e.target.value)}
              disabled={isPending}
            />
          </CardContent>
        </Card>

        {/* Safety */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Safety</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Incidents</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={!hasIncidents ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setHasIncidents(false)}
                    disabled={isPending}
                  >
                    None
                  </Button>
                  <Button
                    type="button"
                    variant={hasIncidents ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => setHasIncidents(true)}
                    disabled={isPending}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Report
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Toolbox Talk</span>
                <Switch
                  checked={toolboxTalk}
                  onCheckedChange={setToolboxTalk}
                  disabled={isPending}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Photos</CardTitle>
              <Button size="sm" variant="outline" type="button" disabled={isPending}>
                <Camera className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                <Camera className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Equipment</CardTitle>
              <Button size="sm" variant="outline" type="button" disabled={isPending}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {equipment.map((eq) => (
                <div key={eq.id} className="flex items-center justify-between text-sm">
                  <span>{eq.name}</span>
                  <Badge variant="outline">{eq.hours} hrs</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t">
          <Button
            type="submit"
            className="w-full h-12 text-lg font-semibold"
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? 'Submitting...' : 'Submit Daily Report'}
          </Button>
        </div>
      </form>
    </div>
  );
}
```

## Camera Integration

For mobile camera access, add an input element:

```tsx
const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  const file = files[0];
  // Upload to server
  handlePhotoUpload(dailyReportId, file);
};

// In the component:
<input
  type="file"
  accept="image/*"
  capture="environment"
  className="hidden"
  id="camera-input"
  onChange={handlePhotoCapture}
/>
<Button size="sm" variant="outline" type="button" asChild>
  <label htmlFor="camera-input">
    <Camera className="h-4 w-4 mr-2" />
    Add
  </label>
</Button>
```

## Weather Data Integration

Fetch weather data on component mount:

```tsx
useEffect(() => {
  const fetchWeather = async () => {
    // Weather data will be fetched by createDailyReport
    // For preview, you could fetch it separately
    setWeather('72°F Clear');
  };

  fetchWeather();
}, [latitude, longitude]);
```

## Testing the Integration

Test the integrated component:

```tsx
// components/daily-reports/__tests__/daily-report-mobile-integrated.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DailyReportMobileEnhanced } from '../daily-report-mobile-enhanced';

jest.mock('@/lib/actions/daily-reports', () => ({
  createDailyReport: jest.fn(),
}));

describe('DailyReportMobileEnhanced', () => {
  it('submits the form with correct data', async () => {
    // Test implementation
  });
});
```

## Next Steps

1. Replace the basic `DailyReportMobile` with the enhanced version
2. Add photo upload functionality with camera access
3. Add equipment management dialog
4. Add incident reporting dialog
5. Add crew count editing
6. Add weather preview
7. Add form validation
8. Add optimistic UI updates
9. Add offline support with local storage
10. Add progress saving (draft mode)
