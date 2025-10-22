/**
 * Daily Reports List Page
 * Display all daily reports for a project with filtering and search
 */

import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DailyReportStatusBadge } from '@/components/daily-reports/daily-report-status-badge';
import { WeatherWidget } from '@/components/daily-reports/weather-widget';
import { formatDistanceToNow } from 'date-fns';

interface PageProps {
  params: Promise<{
    orgSlug: string;
    projectId: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function DailyReportsPage({ params, searchParams }: PageProps) {
  const { orgSlug, projectId } = await params;
  const { status: statusFilter } = await searchParams;

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get project details
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, org_id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Build query for daily reports
  let query = supabase
    .from('daily_reports')
    .select(
      `
      id,
      report_date,
      status,
      weather_condition,
      temperature_high,
      temperature_low,
      total_crew_count,
      narrative,
      created_at,
      submitted_at,
      approved_at,
      submitted_by:users!daily_reports_submitted_by_fkey(id, full_name),
      approved_by:users!daily_reports_approved_by_fkey(id, full_name)
    `
    )
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('report_date', { ascending: false });

  // Apply status filter
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: reports, error: reportsError } = await query;

  if (reportsError) {
    console.error('Error fetching daily reports:', reportsError);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Reports</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
        <Link href={`/${orgSlug}/projects/${projectId}/daily-reports/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Link
          href={`/${orgSlug}/projects/${projectId}/daily-reports`}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            !statusFilter || statusFilter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          All
        </Link>
        <Link
          href={`/${orgSlug}/projects/${projectId}/daily-reports?status=draft`}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            statusFilter === 'draft'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Draft
        </Link>
        <Link
          href={`/${orgSlug}/projects/${projectId}/daily-reports?status=submitted`}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            statusFilter === 'submitted'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Submitted
        </Link>
        <Link
          href={`/${orgSlug}/projects/${projectId}/daily-reports?status=approved`}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            statusFilter === 'approved'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Approved
        </Link>
      </div>

      {/* Reports List */}
      {!reports || reports.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">No daily reports found</p>
          <Link href={`/${orgSlug}/projects/${projectId}/daily-reports/new`}>
            <Button variant="outline" className="mt-4">
              Create First Report
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/${orgSlug}/projects/${projectId}/daily-reports/${report.id}`}
              className="block"
            >
              <div className="border rounded-lg p-6 hover:bg-accent transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        {new Date(report.report_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </h3>
                      <DailyReportStatusBadge status={report.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created {formatDistanceToNow(new Date(report.created_at))} ago
                    </p>
                  </div>
                  <WeatherWidget
                    condition={report.weather_condition}
                    temperatureHigh={report.temperature_high}
                    temperatureLow={report.temperature_low}
                    compact
                  />
                </div>

                {report.narrative && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {report.narrative}
                  </p>
                )}

                <div className="flex items-center gap-6 text-sm">
                  {report.total_crew_count > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Crew:</span>
                      <span className="font-medium">{report.total_crew_count}</span>
                    </div>
                  )}
                  {report.status === 'submitted' && report.submitted_by && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Submitted by:</span>
                      <span className="font-medium">{report.submitted_by.full_name}</span>
                    </div>
                  )}
                  {report.status === 'approved' && report.approved_by && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Approved by:</span>
                      <span className="font-medium">{report.approved_by.full_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
