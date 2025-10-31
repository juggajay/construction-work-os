'use client';

/**
 * Daily Report Mobile Component
 * Mobile-optimized full-screen layout for creating daily reports
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { QuickStatsCard } from './quick-stats-card';
import { logger } from '@/lib/utils/logger';
import {
  Users,
  Cloud,
  Camera,
  Plus,
  AlertTriangle,
} from 'lucide-react';

interface DailyReportMobileProps {
  projectId: string;
  orgSlug: string;
  defaultDate?: Date;
}

export function DailyReportMobile({
  projectId,
  orgSlug,
  defaultDate = new Date(),
}: DailyReportMobileProps) {
  const [workPerformed, setWorkPerformed] = useState('');
  const [hasIncidents, setHasIncidents] = useState(false);
  const [toolboxTalk, setToolboxTalk] = useState(false);
  const [crewCount, setCrewCount] = useState(24);
  const [weather, setWeather] = useState('72°F Clear');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Submit logic will be implemented based on existing daily report actions
    logger.debug('Daily report form submitted', {
      action: 'DailyReportMobile.handleSubmit',
      projectId,
      hasWorkPerformed: !!workPerformed,
      hasIncidents,
      toolboxTalk,
      crewCount,
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
                  >
                    None
                  </Button>
                  <Button
                    type="button"
                    variant={hasIncidents ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => setHasIncidents(true)}
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
              <Button size="sm" variant="outline" type="button">
                <Camera className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {/* Photo thumbnails will be rendered here */}
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
              <Button size="sm" variant="outline" type="button">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Excavator CAT 320</span>
                <Badge variant="outline">8 hrs</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Crane 50T</span>
                <Badge variant="outline">4 hrs</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t">
          <Button type="submit" className="w-full h-12 text-lg font-semibold">
            Submit Daily Report
          </Button>
        </div>
      </form>
    </div>
  );
}
