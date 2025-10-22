/**
 * Create New Daily Report Page
 * Form for creating a new daily report
 */

import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { DailyReportForm } from '@/components/daily-reports/daily-report-form';

interface PageProps {
  params: Promise<{
    orgSlug: string;
    projectId: string;
  }>;
  searchParams: Promise<{
    date?: string;
    copyFrom?: string;
  }>;
}

export default async function NewDailyReportPage({ params, searchParams }: PageProps) {
  const { orgSlug, projectId } = await params;
  const { date, copyFrom } = await searchParams;

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get project details with location
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, org_id, latitude, longitude')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Type assertion for project data
  const projectData = project as any;

  // If copyFrom is provided, get the previous report
  let previousReport = null;
  if (copyFrom) {
    const { data, error } = await supabase
      .from('daily_reports')
      .select(
        `
        *,
        crew_entries:daily_report_crew_entries(*),
        equipment_entries:daily_report_equipment_entries(*)
      `
      )
      .eq('id', copyFrom)
      .eq('project_id', projectId)
      .single();

    if (!error && data) {
      previousReport = data;
    }
  }

  // Determine default date (always string, never undefined due to fallback)
  const defaultDate = (date || new Date().toISOString().split('T')[0]) as string;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Daily Report</h1>
        <p className="text-muted-foreground">{projectData.name}</p>
      </div>

      <DailyReportForm
        projectId={projectData.id}
        orgSlug={orgSlug}
        defaultDate={defaultDate}
        latitude={projectData.latitude}
        longitude={projectData.longitude}
        previousReport={previousReport}
      />
    </div>
  );
}
