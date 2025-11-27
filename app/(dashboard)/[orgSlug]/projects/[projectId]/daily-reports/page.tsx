/**
 * Daily Reports List Page
 * Industrial Luxury aesthetic
 */

// ✅ PHASE 2 OPTIMIZATION: Page-level caching (10s revalidate)
export const revalidate = 10

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, Users, Cloud, Sun, CloudSun, CloudRain, Snowflake, CloudFog, Wind, ChevronRight, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface PageProps {
  params: Promise<{
    orgSlug: string
    projectId: string
  }>
  searchParams: Promise<{
    status?: string
  }>
}

type DailyReportStatus = 'draft' | 'submitted' | 'approved' | 'archived'

// Status config - Industrial Luxury style
const STATUS_CONFIG: Record<DailyReportStatus, { label: string; bgClass: string; textClass: string }> = {
  draft: { label: 'Draft', bgClass: 'bg-white/[0.05]', textClass: 'text-white/50' },
  submitted: { label: 'Submitted', bgClass: 'bg-amber-500/10', textClass: 'text-amber-400' },
  approved: { label: 'Approved', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-400' },
  archived: { label: 'Archived', bgClass: 'bg-white/[0.05]', textClass: 'text-white/30' },
}

// Weather icons
const WEATHER_ICONS: Record<string, React.ElementType> = {
  clear: Sun,
  partly_cloudy: CloudSun,
  overcast: Cloud,
  rain: CloudRain,
  snow: Snowflake,
  fog: CloudFog,
  wind: Wind,
}

// Weather colors
const WEATHER_COLORS: Record<string, string> = {
  clear: 'text-amber-400',
  partly_cloudy: 'text-blue-400',
  overcast: 'text-white/40',
  rain: 'text-blue-400',
  snow: 'text-cyan-400',
  fog: 'text-white/30',
  wind: 'text-white/50',
}

export default async function DailyReportsPage({ params, searchParams }: PageProps) {
  const { orgSlug, projectId } = await params
  const { status: statusFilter } = await searchParams

  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get project details
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, org_id')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    notFound()
  }

  // Type assertion for project data
  const projectData = project as any

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
      approved_at
    `
    )
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('report_date', { ascending: false })

  // Apply status filter
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter as any)
  }

  const { data: reports, error: reportsError } = await query

  if (reportsError) {
    console.error('Error fetching daily reports:', reportsError)
  }

  // Type assertion for reports data
  const reportsData = (reports as any[]) || []

  // Calculate stats
  const totalReports = reportsData.length
  const draftCount = reportsData.filter(r => r.status === 'draft').length
  const submittedCount = reportsData.filter(r => r.status === 'submitted').length
  const approvedCount = reportsData.filter(r => r.status === 'approved').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Daily Reports</h1>
          <p className="text-white/50 text-sm mt-1">{projectData.name}</p>
        </div>
        <Link
          href={`/${orgSlug}/projects/${projectId}/daily-reports/new`}
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium text-sm shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          New Report
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className={cn(
          "relative rounded-xl p-4 overflow-hidden",
          "bg-white/[0.02] border border-white/[0.06]"
        )}>
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">Total</p>
          <p className="text-2xl font-bold text-white mt-1">{totalReports}</p>
        </div>
        <div className={cn(
          "relative rounded-xl p-4 overflow-hidden",
          "bg-white/[0.02] border border-white/[0.06]"
        )}>
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">Draft</p>
          <p className="text-2xl font-bold text-white/50 mt-1">{draftCount}</p>
        </div>
        <div className={cn(
          "relative rounded-xl p-4 overflow-hidden",
          "bg-white/[0.02] border border-amber-500/20"
        )}>
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">Submitted</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{submittedCount}</p>
        </div>
        <div className={cn(
          "relative rounded-xl p-4 overflow-hidden",
          "bg-white/[0.02] border border-emerald-500/20"
        )}>
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">Approved</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{approvedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
        <Link
          href={`/${orgSlug}/projects/${projectId}/daily-reports`}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            !statusFilter || statusFilter === 'all'
              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black"
              : "text-white/50 hover:text-white"
          )}
        >
          All
        </Link>
        <Link
          href={`/${orgSlug}/projects/${projectId}/daily-reports?status=draft`}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            statusFilter === 'draft'
              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black"
              : "text-white/50 hover:text-white"
          )}
        >
          Draft
        </Link>
        <Link
          href={`/${orgSlug}/projects/${projectId}/daily-reports?status=submitted`}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            statusFilter === 'submitted'
              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black"
              : "text-white/50 hover:text-white"
          )}
        >
          Submitted
        </Link>
        <Link
          href={`/${orgSlug}/projects/${projectId}/daily-reports?status=approved`}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            statusFilter === 'approved'
              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black"
              : "text-white/50 hover:text-white"
          )}
        >
          Approved
        </Link>
      </div>

      {/* Reports List */}
      {reportsData.length === 0 ? (
        <div className={cn(
          "rounded-xl p-12 text-center",
          "bg-white/[0.02] border border-white/[0.06]"
        )}>
          <div className="mx-auto w-16 h-16 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No daily reports found</h2>
          <p className="text-white/50 mb-6">
            Start tracking daily activities by creating your first report
          </p>
          <Link
            href={`/${orgSlug}/projects/${projectId}/daily-reports/new`}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium text-sm shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Create First Report
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reportsData.map((report) => {
            const status = STATUS_CONFIG[report.status as DailyReportStatus] || STATUS_CONFIG.draft
            const WeatherIcon = report.weather_condition ? WEATHER_ICONS[report.weather_condition] || Cloud : null
            const weatherColor = report.weather_condition ? WEATHER_COLORS[report.weather_condition] || 'text-white/40' : ''

            return (
              <Link
                key={report.id}
                href={`/${orgSlug}/projects/${projectId}/daily-reports/${report.id}`}
                className="block group"
              >
                <div className={cn(
                  "relative rounded-xl p-6 overflow-hidden",
                  "bg-white/[0.02] border border-white/[0.06]",
                  "hover:border-white/[0.12] hover:bg-white/[0.04]",
                  "transition-all duration-300"
                )}>
                  {/* Top accent on hover */}
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">
                          {new Date(report.report_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </h3>
                        <span className={cn(
                          "inline-flex px-2.5 py-1 text-xs font-medium rounded-lg",
                          status.bgClass,
                          status.textClass
                        )}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-white/40">
                        Created {formatDistanceToNow(new Date(report.created_at))} ago
                      </p>
                    </div>

                    {/* Weather Widget */}
                    {WeatherIcon && (
                      <div className="flex items-center gap-2">
                        <WeatherIcon className={cn("h-6 w-6", weatherColor)} />
                        <div className="text-right">
                          <div className={cn("text-sm font-medium capitalize", weatherColor)}>
                            {report.weather_condition?.replace('_', ' ')}
                          </div>
                          {report.temperature_high !== undefined && report.temperature_low !== undefined && (
                            <div className="text-xs text-white/40">
                              {Math.round(report.temperature_high)}° / {Math.round(report.temperature_low)}°
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Narrative Preview */}
                  {report.narrative && (
                    <p className="text-sm text-white/50 line-clamp-2 mb-4">
                      {report.narrative}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center gap-6">
                      {report.total_crew_count > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-white/40" />
                          <span className="text-white/60">
                            <span className="font-medium text-white">{report.total_crew_count}</span> crew
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-white/30 group-hover:text-amber-400 transition-colors">
                      <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">View</span>
                      <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
