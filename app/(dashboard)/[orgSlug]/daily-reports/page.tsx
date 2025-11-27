/**
 * Organization-Level Daily Reports Page
 * Industrial Luxury aesthetic
 */

'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  FileText,
  Users,
  Cloud,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Filter,
  Sun,
  CloudRain,
  Snowflake,
  Wind,
  CloudFog,
  CloudSun,
  X,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

type DailyReportStatus = 'draft' | 'submitted' | 'approved' | 'archived'

// Status badge config - Industrial Luxury style
const STATUS_CONFIG: Record<DailyReportStatus, { label: string; bgClass: string; textClass: string }> = {
  draft: { label: 'Draft', bgClass: 'bg-white/[0.05]', textClass: 'text-white/50' },
  submitted: { label: 'Submitted', bgClass: 'bg-amber-500/10', textClass: 'text-amber-400' },
  approved: { label: 'Approved', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-400' },
  archived: { label: 'Archived', bgClass: 'bg-white/[0.05]', textClass: 'text-white/30' },
}

// Weather icon mapping
const WEATHER_ICONS: Record<string, typeof Sun> = {
  clear: Sun,
  partly_cloudy: CloudSun,
  overcast: Cloud,
  rain: CloudRain,
  snow: Snowflake,
  fog: CloudFog,
  wind: Wind,
}

export default function OrganizationDailyReportsPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch organization ID
  const { data: org } = useQuery({
    queryKey: ['organization', orgSlug],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', orgSlug)
        .single()

      if (error) throw error
      return data
    },
  })

  // Fetch all projects for organization
  const { data: projects } = useQuery({
    queryKey: ['projects', org?.id],
    queryFn: async () => {
      if (!org?.id) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, number')
        .eq('org_id', org.id)
        .is('deleted_at', null)
        .order('name')

      if (error) throw error
      return data || []
    },
    enabled: !!org?.id,
  })

  // Fetch Daily Reports across all projects
  const { data: dailyReports, isLoading } = useQuery({
    queryKey: ['org-daily-reports', org?.id, statusFilter, projectFilter],
    queryFn: async () => {
      if (!org?.id) return []
      const supabase = createClient()

      const projectIds = projects?.map((p) => p.id) || []
      if (projectIds.length === 0) return []

      let query = supabase
        .from('daily_reports')
        .select(
          `
          id,
          report_date,
          status,
          weather_condition,
          temperature_high,
          total_crew_count,
          created_at,
          submitted_at,
          approved_at,
          project_id,
          project:projects (
            id,
            name,
            number
          )
        `
        )
        .in('project_id', projectIds)
        .is('deleted_at', null)
        .order('report_date', { ascending: false })

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any)
      }

      // Apply project filter
      if (projectFilter !== 'all') {
        query = query.eq('project_id', projectFilter)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    },
    enabled: !!org?.id && !!projects,
  })

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!dailyReports) {
      return {
        total: 0,
        submitted: 0,
        approved: 0,
        thisWeek: 0,
      }
    }

    const total = dailyReports.length
    const submitted = dailyReports.filter((r: any) => r.status === 'submitted').length
    const approved = dailyReports.filter((r: any) => r.status === 'approved').length

    // Calculate reports from this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const thisWeek = dailyReports.filter((r: any) => {
      const reportDate = new Date(r.report_date)
      return reportDate >= oneWeekAgo
    }).length

    return {
      total,
      submitted,
      approved,
      thisWeek,
    }
  }, [dailyReports])

  // Client-side search filtering
  const filteredReports = dailyReports?.filter((report: any) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      report.project?.name?.toLowerCase().includes(query) ||
      new Date(report.report_date).toLocaleDateString().includes(query)
    )
  })

  const handleRowClick = (reportId: string, projectId: string) => {
    router.push(`/${orgSlug}/projects/${projectId}/daily-reports/${reportId}`)
  }

  const getWeatherIcon = (condition: string | null) => {
    if (!condition) return null
    const Icon = WEATHER_ICONS[condition] || Cloud
    return <Icon className="h-4 w-4 text-white/40" />
  }

  const activeFilters = (statusFilter !== 'all' ? 1 : 0) + (projectFilter !== 'all' ? 1 : 0)

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Daily Reports</h1>
          <p className="text-white/50 text-sm mt-1">
            Track daily activities and progress across projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg",
            "bg-white/[0.03] border border-white/[0.06]",
            "text-white/50 text-sm"
          )}>
            <Building2 className="h-4 w-4" />
            {projects?.length || 0} Projects
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Total Reports */}
        <div className={cn(
          "relative rounded-xl p-5 overflow-hidden group",
          "bg-white/[0.02] border border-white/[0.06]",
          "hover:border-white/[0.1] transition-all duration-300"
        )}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Total Reports</p>
              <p className="text-3xl font-bold text-white mt-1">{metrics.total}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </div>

        {/* This Week */}
        <div className={cn(
          "relative rounded-xl p-5 overflow-hidden group",
          "bg-white/[0.02] border border-white/[0.06]",
          "hover:border-white/[0.1] transition-all duration-300"
        )}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">This Week</p>
              <p className="text-3xl font-bold text-purple-400 mt-1">{metrics.thisWeek}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10">
              <Calendar className="h-5 w-5 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Submitted */}
        <div className={cn(
          "relative rounded-xl p-5 overflow-hidden group",
          "bg-white/[0.02] border border-amber-500/20",
          "hover:border-amber-500/40 transition-all duration-300"
        )}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Submitted</p>
              <p className="text-3xl font-bold text-amber-400 mt-1">{metrics.submitted}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Users className="h-5 w-5 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Approved */}
        <div className={cn(
          "relative rounded-xl p-5 overflow-hidden group",
          "bg-white/[0.02] border border-white/[0.06]",
          "hover:border-emerald-500/30 transition-all duration-300"
        )}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Approved</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">{metrics.approved}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <FileText className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Reports Table */}
      <div className={cn(
        "rounded-xl overflow-hidden",
        "bg-white/[0.02] border border-white/[0.06]"
      )}>
        {/* Card Header */}
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Daily Report Log</h2>
              <p className="text-sm text-white/40 mt-0.5">
                All daily reports across all projects
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "w-64 pl-10 pr-4 h-10 rounded-lg text-sm",
                    "bg-white/[0.03] border border-white/[0.08]",
                    "text-white placeholder:text-white/30",
                    "focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20",
                    "transition-all duration-200"
                  )}
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-medium",
                  "border transition-all duration-200",
                  showFilters || activeFilters > 0
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white hover:border-white/[0.15]"
                )}
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilters > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs">
                    {activeFilters}
                  </span>
                )}
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  showFilters && "rotate-180"
                )} />
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-3 pt-4 mt-4 border-t border-white/[0.06]">
                  {/* Project Filter */}
                  <select
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    className={cn(
                      "h-9 px-3 rounded-lg text-sm",
                      "bg-white/[0.03] border border-white/[0.08]",
                      "text-white/80",
                      "focus:outline-none focus:border-amber-500/50",
                      "transition-all duration-200"
                    )}
                  >
                    <option value="all" className="bg-[#0a0a0a]">All Projects</option>
                    {projects?.map((project) => (
                      <option key={project.id} value={project.id} className="bg-[#0a0a0a]">
                        {project.name}
                      </option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={cn(
                      "h-9 px-3 rounded-lg text-sm",
                      "bg-white/[0.03] border border-white/[0.08]",
                      "text-white/80",
                      "focus:outline-none focus:border-amber-500/50",
                      "transition-all duration-200"
                    )}
                  >
                    <option value="all" className="bg-[#0a0a0a]">All Statuses</option>
                    <option value="draft" className="bg-[#0a0a0a]">Draft</option>
                    <option value="submitted" className="bg-[#0a0a0a]">Submitted</option>
                    <option value="approved" className="bg-[#0a0a0a]">Approved</option>
                    <option value="archived" className="bg-[#0a0a0a]">Archived</option>
                  </select>

                  {/* Clear Filters */}
                  {activeFilters > 0 && (
                    <button
                      onClick={() => {
                        setStatusFilter('all')
                        setProjectFilter('all')
                      }}
                      className="inline-flex items-center gap-1 px-3 h-9 rounded-lg text-sm text-white/50 hover:text-white transition-colors"
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                  Date
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                  Project
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40 hidden md:table-cell">
                  Weather
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40 hidden lg:table-cell">
                  Crew
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40 hidden lg:table-cell">
                  Created
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-white/40">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                      Loading reports...
                    </div>
                  </td>
                </tr>
              ) : !filteredReports || filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-white/40">
                    No daily reports found
                  </td>
                </tr>
              ) : (
                filteredReports.map((report: any) => {
                  const status = STATUS_CONFIG[report.status as DailyReportStatus] || STATUS_CONFIG.draft

                  return (
                    <tr
                      key={report.id}
                      className={cn(
                        "group cursor-pointer border-b border-white/[0.03]",
                        "hover:bg-white/[0.02] transition-colors duration-200"
                      )}
                      onClick={() => handleRowClick(report.id, report.project_id)}
                    >
                      <td className="px-5 py-4">
                        <span className="font-medium text-white">
                          {new Date(report.report_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-white/60">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate max-w-[180px]">{report.project?.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn(
                          "inline-flex px-2.5 py-1 text-xs font-medium rounded-lg",
                          status.bgClass,
                          status.textClass
                        )}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          {getWeatherIcon(report.weather_condition)}
                          <span className="text-sm text-white/50">
                            {report.temperature_high ? `${Math.round(report.temperature_high)}°F` : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-white/50">
                          <Users className="h-3.5 w-3.5" />
                          <span>{report.total_crew_count || 0}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-sm text-white/40">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-4">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="h-4 w-4 text-white/40" />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
