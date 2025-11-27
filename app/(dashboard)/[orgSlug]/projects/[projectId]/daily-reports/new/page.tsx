/**
 * Create New Daily Report Page
 * Industrial Luxury aesthetic
 * ✅ PHASE 3B OPTIMIZATION: Dynamic import for DailyReportForm (362 lines)
 */

import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { cn } from '@/lib/utils'

const DailyReportForm = dynamic(
  () => import('@/components/daily-reports/daily-report-form').then((mod) => ({ default: mod.DailyReportForm })),
  {
    loading: () => (
      <div className={cn(
        "flex items-center justify-center p-12 rounded-xl",
        "bg-white/[0.02] border border-white/[0.06]"
      )}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-white/40">Loading form...</p>
        </div>
      </div>
    ),
  }
)

interface PageProps {
  params: Promise<{
    orgSlug: string
    projectId: string
  }>
  searchParams: Promise<{
    date?: string
    copyFrom?: string
  }>
}

export default async function NewDailyReportPage({ params, searchParams }: PageProps) {
  const { orgSlug, projectId } = await params
  const { date, copyFrom } = await searchParams

  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get project details with location
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, org_id, latitude, longitude')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    notFound()
  }

  // Type assertion for project data
  const projectData = project as any

  // If copyFrom is provided, get the previous report
  let previousReport = null
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
      .single()

    if (!error && data) {
      previousReport = data
    }
  }

  // Determine default date (always string, never undefined due to fallback)
  const defaultDate = (date || new Date().toISOString().split('T')[0]) as string

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Create Daily Report</h1>
        <p className="text-white/50 text-sm mt-1">{projectData.name}</p>
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
  )
}
