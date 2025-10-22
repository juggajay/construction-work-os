/**
 * Daily Report Detail Page
 * View single daily report with all entries and attachments
 */

import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Download, Printer } from 'lucide-react';
import { DailyReportStatusBadge } from '@/components/daily-reports/daily-report-status-badge';
import { WeatherWidget } from '@/components/daily-reports/weather-widget';
import { formatDistanceToNow } from 'date-fns';

interface PageProps {
  params: Promise<{
    orgSlug: string;
    projectId: string;
    reportId: string;
  }>;
}

export default async function DailyReportDetailPage({ params }: PageProps) {
  const { orgSlug, projectId, reportId } = await params;

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get daily report with all related data
  const { data: report, error: reportError } = await supabase
    .from('daily_reports')
    .select(
      `
      *,
      project:projects(id, name, org_id),
      created_by_user:users!daily_reports_created_by_fkey(id, full_name),
      submitted_by_user:users!daily_reports_submitted_by_fkey(id, full_name),
      approved_by_user:users!daily_reports_approved_by_fkey(id, full_name),
      crew_entries:daily_report_crew_entries(*),
      equipment_entries:daily_report_equipment_entries(*),
      material_entries:daily_report_material_entries(*),
      incidents:daily_report_incidents(*),
      attachments:daily_report_attachments(*)
    `
    )
    .eq('id', reportId)
    .is('deleted_at', null)
    .single();

  if (reportError || !report) {
    notFound();
  }

  // Verify project match
  const reportData = report as any; // Type assertion for complex nested query
  if (reportData.project_id !== projectId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${orgSlug}/projects/${projectId}/daily-reports`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {new Date(reportData.report_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h1>
              <DailyReportStatusBadge status={reportData.status} />
            </div>
            <p className="text-muted-foreground">{reportData.project.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {reportData.status === 'draft' && (
            <Link
              href={`/${orgSlug}/projects/${projectId}/daily-reports/${reportId}/edit`}
            >
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Weather Section */}
      <WeatherWidget
        condition={reportData.weather_condition}
        temperatureHigh={reportData.temperature_high}
        temperatureLow={reportData.temperature_low}
        precipitation={reportData.precipitation}
        windSpeed={reportData.wind_speed}
        humidity={reportData.humidity}
      />

      {/* Narrative */}
      {reportData.narrative && (
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">Daily Summary</h2>
          <p className="text-sm whitespace-pre-wrap">{reportData.narrative}</p>
        </div>
      )}

      {/* Crew Entries */}
      {reportData.crew_entries && reportData.crew_entries.length > 0 && (
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Crew ({reportData.total_crew_count})</h2>
          <div className="space-y-3">
            {reportData.crew_entries.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <div className="font-medium">{entry.trade}</div>
                  {entry.classification && (
                    <div className="text-sm text-muted-foreground">{entry.classification}</div>
                  )}
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Headcount: </span>
                    <span className="font-medium">{entry.headcount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Hours: </span>
                    <span className="font-medium">{entry.hours_worked}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipment Entries */}
      {reportData.equipment_entries && reportData.equipment_entries.length > 0 && (
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Equipment</h2>
          <div className="space-y-3">
            {reportData.equipment_entries.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <div className="font-medium">{entry.equipment_description}</div>
                  {entry.equipment_id && (
                    <div className="text-sm text-muted-foreground">ID: {entry.equipment_id}</div>
                  )}
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Quantity: </span>
                    <span className="font-medium">{entry.quantity}</span>
                  </div>
                  {entry.hours_used && (
                    <div>
                      <span className="text-muted-foreground">Hours: </span>
                      <span className="font-medium">{entry.hours_used}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Material Deliveries */}
      {reportData.material_entries && reportData.material_entries.length > 0 && (
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Material Deliveries</h2>
          <div className="space-y-3">
            {reportData.material_entries.map((entry: any) => (
              <div key={entry.id} className="py-2 border-b last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium">{entry.material_description}</div>
                  <div className="text-sm">
                    <span className="font-medium">{entry.quantity}</span>{' '}
                    <span className="text-muted-foreground">{entry.unit}</span>
                  </div>
                </div>
                {entry.supplier && (
                  <div className="text-sm text-muted-foreground">Supplier: {entry.supplier}</div>
                )}
                {entry.delivery_time && (
                  <div className="text-sm text-muted-foreground">Delivered at {entry.delivery_time}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incidents */}
      {reportData.incidents && reportData.incidents.length > 0 && (
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Incidents & Notes</h2>
          <div className="space-y-4">
            {reportData.incidents.map((incident: any) => (
              <div key={incident.id} className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{incident.incident_type.replace('_', ' ')}</span>
                    {incident.severity && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        incident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {incident.severity}
                      </span>
                    )}
                  </div>
                  {incident.time_occurred && (
                    <span className="text-sm text-muted-foreground">{incident.time_occurred}</span>
                  )}
                </div>
                <p className="text-sm mb-2">{incident.description}</p>
                {incident.corrective_action && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Action: </span>
                    {incident.corrective_action}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachments/Photos */}
      {reportData.attachments && reportData.attachments.length > 0 && (
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Photos ({reportData.attachments.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {reportData.attachments.map((attachment: any) => (
              <div key={attachment.id} className="group relative aspect-square rounded-lg overflow-hidden border">
                <img
                  src={`/api/storage/daily-report-photos/${attachment.storage_path}`}
                  alt={attachment.caption || 'Daily report photo'}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                />
                {attachment.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
                    {attachment.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="border rounded-lg p-6 text-sm text-muted-foreground">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="font-medium text-foreground mb-1">Created</div>
            <div>{formatDistanceToNow(new Date(reportData.created_at))} ago</div>
            {reportData.created_by_user && <div>by {reportData.created_by_user.full_name}</div>}
          </div>
          {reportData.submitted_at && (
            <div>
              <div className="font-medium text-foreground mb-1">Submitted</div>
              <div>{formatDistanceToNow(new Date(reportData.submitted_at))} ago</div>
              {reportData.submitted_by_user && <div>by {reportData.submitted_by_user.full_name}</div>}
            </div>
          )}
          {reportData.approved_at && (
            <div>
              <div className="font-medium text-foreground mb-1">Approved</div>
              <div>{formatDistanceToNow(new Date(reportData.approved_at))} ago</div>
              {reportData.approved_by_user && <div>by {reportData.approved_by_user.full_name}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
