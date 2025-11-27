/**
 * Daily Report Detail Page
 * Industrial Luxury aesthetic
 */

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Edit,
  Download,
  Printer,
  Users,
  Wrench,
  Package,
  AlertTriangle,
  ImageIcon,
  Clock,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  Snowflake,
  CloudFog,
  Wind,
  Droplets,
  Thermometer,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface PageProps {
  params: Promise<{
    orgSlug: string
    projectId: string
    reportId: string
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

// Weather icons and colors
const WEATHER_CONFIG: Record<string, { icon: React.ElementType; color: string; bgClass: string }> = {
  clear: { icon: Sun, color: 'text-amber-400', bgClass: 'bg-amber-500/10' },
  partly_cloudy: { icon: CloudSun, color: 'text-blue-400', bgClass: 'bg-blue-500/10' },
  overcast: { icon: Cloud, color: 'text-white/50', bgClass: 'bg-white/[0.05]' },
  rain: { icon: CloudRain, color: 'text-blue-400', bgClass: 'bg-blue-500/10' },
  snow: { icon: Snowflake, color: 'text-cyan-400', bgClass: 'bg-cyan-500/10' },
  fog: { icon: CloudFog, color: 'text-white/40', bgClass: 'bg-white/[0.05]' },
  wind: { icon: Wind, color: 'text-white/50', bgClass: 'bg-white/[0.05]' },
}

// Severity config for incidents
const SEVERITY_CONFIG: Record<string, { bgClass: string; textClass: string }> = {
  critical: { bgClass: 'bg-red-500/10', textClass: 'text-red-400' },
  high: { bgClass: 'bg-orange-500/10', textClass: 'text-orange-400' },
  medium: { bgClass: 'bg-amber-500/10', textClass: 'text-amber-400' },
  low: { bgClass: 'bg-blue-500/10', textClass: 'text-blue-400' },
}

export default async function DailyReportDetailPage({ params }: PageProps) {
  const { orgSlug, projectId, reportId } = await params

  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get daily report with all related data
  const { data: report, error: reportError } = await supabase
    .from('daily_reports')
    .select(
      `
      *,
      project:projects(id, name, org_id),
      crew_entries:daily_report_crew_entries(*),
      equipment_entries:daily_report_equipment_entries(*),
      material_entries:daily_report_material_entries(*),
      incidents:daily_report_incidents(*),
      attachments:daily_report_attachments(*)
    `
    )
    .eq('id', reportId)
    .is('deleted_at', null)
    .single()

  if (reportError || !report) {
    notFound()
  }

  // Verify project match
  const reportData = report as any
  if (reportData.project_id !== projectId) {
    notFound()
  }

  const status = STATUS_CONFIG[reportData.status as DailyReportStatus] || STATUS_CONFIG.draft
  const weatherConfig = reportData.weather_condition ? WEATHER_CONFIG[reportData.weather_condition] : null
  const WeatherIcon = weatherConfig?.icon || Cloud

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href={`/${orgSlug}/projects/${projectId}/daily-reports`}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl",
              "bg-white/[0.03] border border-white/[0.06]",
              "text-white/60 hover:text-white hover:border-white/[0.12]",
              "transition-all duration-200"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {new Date(reportData.report_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h1>
              <span className={cn(
                "inline-flex px-2.5 py-1 text-xs font-medium rounded-lg",
                status.bgClass,
                status.textClass
              )}>
                {status.label}
              </span>
            </div>
            <p className="text-white/50 text-sm">{reportData.project.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {reportData.status === 'draft' && (
            <Link
              href={`/${orgSlug}/projects/${projectId}/daily-reports/${reportId}/edit`}
              className={cn(
                "inline-flex items-center gap-2 h-10 px-4 rounded-xl",
                "bg-white/[0.03] border border-white/[0.06]",
                "text-white/60 text-sm font-medium",
                "hover:text-white hover:border-white/[0.12]",
                "transition-all duration-200"
              )}
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          )}
          <button
            className={cn(
              "inline-flex items-center gap-2 h-10 px-4 rounded-xl",
              "bg-white/[0.03] border border-white/[0.06]",
              "text-white/60 text-sm font-medium",
              "hover:text-white hover:border-white/[0.12]",
              "transition-all duration-200"
            )}
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          <button
            className={cn(
              "inline-flex items-center gap-2 h-10 px-4 rounded-xl",
              "bg-white/[0.03] border border-white/[0.06]",
              "text-white/60 text-sm font-medium",
              "hover:text-white hover:border-white/[0.12]",
              "transition-all duration-200"
            )}
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      {/* Weather Section */}
      {reportData.weather_condition && (
        <div className={cn(
          "rounded-xl p-6 overflow-hidden",
          "bg-white/[0.02] border border-white/[0.06]"
        )}>
          <div className="flex items-center gap-4 mb-4">
            <div className={cn("p-3 rounded-xl", weatherConfig?.bgClass || 'bg-white/[0.05]')}>
              <WeatherIcon className={cn("h-6 w-6", weatherConfig?.color || 'text-white/50')} />
            </div>
            <div>
              <h2 className={cn("text-lg font-semibold capitalize", weatherConfig?.color || 'text-white')}>
                {reportData.weather_condition?.replace('_', ' ')}
              </h2>
              {reportData.temperature_high !== undefined && reportData.temperature_low !== undefined && (
                <p className="text-2xl font-bold text-white">
                  {Math.round(reportData.temperature_high)}° / {Math.round(reportData.temperature_low)}°F
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reportData.precipitation !== undefined && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Droplets className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider">Precipitation</p>
                  <p className="font-medium text-white">{reportData.precipitation}%</p>
                </div>
              </div>
            )}
            {reportData.wind_speed !== undefined && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/[0.05]">
                  <Wind className="h-4 w-4 text-white/60" />
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider">Wind</p>
                  <p className="font-medium text-white">{reportData.wind_speed} mph</p>
                </div>
              </div>
            )}
            {reportData.humidity !== undefined && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Droplets className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider">Humidity</p>
                  <p className="font-medium text-white">{reportData.humidity}%</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Narrative */}
      {reportData.narrative && (
        <div className={cn(
          "rounded-xl p-6",
          "bg-white/[0.02] border border-white/[0.06]"
        )}>
          <h2 className="text-lg font-semibold text-white mb-3">Daily Summary</h2>
          <p className="text-white/70 whitespace-pre-wrap leading-relaxed">{reportData.narrative}</p>
        </div>
      )}

      {/* Crew Entries */}
      {reportData.crew_entries && reportData.crew_entries.length > 0 && (
        <div className={cn(
          "rounded-xl overflow-hidden",
          "bg-white/[0.02] border border-white/[0.06]"
        )}>
          <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Users className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Crew</h2>
              <p className="text-sm text-white/40">{reportData.total_crew_count} total workers</p>
            </div>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {reportData.crew_entries.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between p-5">
                <div>
                  <p className="font-medium text-white">{entry.trade}</p>
                  {entry.classification && (
                    <p className="text-sm text-white/40">{entry.classification}</p>
                  )}
                </div>
                <div className="flex items-center gap-8 text-sm">
                  <div className="text-right">
                    <p className="text-white/40">Headcount</p>
                    <p className="font-medium text-white">{entry.headcount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/40">Hours</p>
                    <p className="font-medium text-white">{entry.hours_worked}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipment Entries */}
      {reportData.equipment_entries && reportData.equipment_entries.length > 0 && (
        <div className={cn(
          "rounded-xl overflow-hidden",
          "bg-white/[0.02] border border-white/[0.06]"
        )}>
          <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Wrench className="h-4 w-4 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Equipment</h2>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {reportData.equipment_entries.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between p-5">
                <div>
                  <p className="font-medium text-white">{entry.equipment_description}</p>
                  {entry.equipment_id && (
                    <p className="text-sm text-white/40">ID: {entry.equipment_id}</p>
                  )}
                </div>
                <div className="flex items-center gap-8 text-sm">
                  <div className="text-right">
                    <p className="text-white/40">Quantity</p>
                    <p className="font-medium text-white">{entry.quantity}</p>
                  </div>
                  {entry.hours_used && (
                    <div className="text-right">
                      <p className="text-white/40">Hours</p>
                      <p className="font-medium text-white">{entry.hours_used}</p>
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
        <div className={cn(
          "rounded-xl overflow-hidden",
          "bg-white/[0.02] border border-white/[0.06]"
        )}>
          <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Package className="h-4 w-4 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Material Deliveries</h2>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {reportData.material_entries.map((entry: any) => (
              <div key={entry.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-white">{entry.material_description}</p>
                  <p className="text-sm">
                    <span className="font-medium text-white">{entry.quantity}</span>{' '}
                    <span className="text-white/40">{entry.unit}</span>
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-white/40">
                  {entry.supplier && <span>Supplier: {entry.supplier}</span>}
                  {entry.delivery_time && <span>Delivered at {entry.delivery_time}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incidents */}
      {reportData.incidents && reportData.incidents.length > 0 && (
        <div className={cn(
          "rounded-xl overflow-hidden",
          "bg-white/[0.02] border border-red-500/20"
        )}>
          <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Incidents & Notes</h2>
          </div>
          <div className="p-5 space-y-4">
            {reportData.incidents.map((incident: any) => {
              const severity = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.low

              return (
                <div key={incident.id} className={cn(
                  "p-4 rounded-xl",
                  "bg-white/[0.02] border border-white/[0.06]"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white capitalize">
                        {incident.incident_type.replace('_', ' ')}
                      </span>
                      {incident.severity && (
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-lg capitalize",
                          severity.bgClass,
                          severity.textClass
                        )}>
                          {incident.severity}
                        </span>
                      )}
                    </div>
                    {incident.time_occurred && (
                      <span className="text-sm text-white/40 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {incident.time_occurred}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/70 mb-2">{incident.description}</p>
                  {incident.corrective_action && (
                    <p className="text-sm text-white/50">
                      <span className="font-medium text-amber-400">Action: </span>
                      {incident.corrective_action}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Attachments/Photos */}
      {reportData.attachments && reportData.attachments.length > 0 && (
        <div className={cn(
          "rounded-xl overflow-hidden",
          "bg-white/[0.02] border border-white/[0.06]"
        )}>
          <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <ImageIcon className="h-4 w-4 text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Photos ({reportData.attachments.length})</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {reportData.attachments.map((attachment: any) => (
                <div key={attachment.id} className={cn(
                  "group relative aspect-square rounded-xl overflow-hidden",
                  "border border-white/[0.06]"
                )}>
                  <Image
                    src={`/api/storage/daily-report-photos/${attachment.storage_path}`}
                    alt={attachment.caption || 'Daily report photo'}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    priority={false}
                  />
                  {attachment.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm text-white text-xs p-3">
                      {attachment.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className={cn(
        "rounded-xl p-6",
        "bg-white/[0.02] border border-white/[0.06]"
      )}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-white/40 mb-1">Created</p>
            <p className="text-sm text-white/70">{formatDistanceToNow(new Date(reportData.created_at))} ago</p>
            {reportData.created_by_user && (
              <p className="text-sm text-white/50">by {reportData.created_by_user.full_name}</p>
            )}
          </div>
          {reportData.submitted_at && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40 mb-1">Submitted</p>
              <p className="text-sm text-white/70">{formatDistanceToNow(new Date(reportData.submitted_at))} ago</p>
              {reportData.submitted_by_user && (
                <p className="text-sm text-white/50">by {reportData.submitted_by_user.full_name}</p>
              )}
            </div>
          )}
          {reportData.approved_at && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40 mb-1">Approved</p>
              <p className="text-sm text-white/70">{formatDistanceToNow(new Date(reportData.approved_at))} ago</p>
              {reportData.approved_by_user && (
                <p className="text-sm text-white/50">by {reportData.approved_by_user.full_name}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
