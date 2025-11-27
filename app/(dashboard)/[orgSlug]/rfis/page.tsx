/**
 * Organization-Level RFI List Page
 *
 * Displays all RFIs across all projects in the organization
 * Industrial Luxury aesthetic
 */

'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { RFIStatusBadge, type RFIStatus } from '@/components/rfis/rfi-status-badge'
import { RFITable } from '@/components/rfis/rfi-table'
import { isOverdue, calculateResponseTime } from '@/lib/rfis/sla-calculations'
import {
  Plus,
  Search,
  FileText,
  Clock,
  AlertCircle,
  TrendingDown,
  Building2,
  ChevronDown,
  Filter
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

export default function OrganizationRFIsPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [overdueFilter, setOverdueFilter] = useState<string>('all')
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

  // Fetch RFIs across all projects
  const { data: rfis, isLoading } = useQuery({
    queryKey: ['org-rfis', org?.id, statusFilter, projectFilter],
    queryFn: async () => {
      if (!org?.id) return []
      const supabase = createClient()

      // Get all project IDs for this organization
      const projectIds = projects?.map((p) => p.id) || []
      if (projectIds.length === 0) return []

      let query = supabase
        .from('rfis')
        .select(`
          id,
          number,
          title,
          status,
          priority,
          response_due_date,
          submitted_at,
          answered_at,
          closed_at,
          created_at,
          assigned_to_id,
          discipline,
          spec_section,
          project_id,
          project:projects (
            id,
            name,
            number
          ),
          assigned_to:profiles!rfis_assigned_to_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .in('project_id', projectIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

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

      // Filter overdue in memory (complex logic)
      let filtered = data || []
      if (overdueFilter === 'overdue') {
        filtered = filtered.filter((rfi: any) =>
          isOverdue({
            status: rfi.status,
            submitted_at: rfi.submitted_at,
            response_due_date: rfi.response_due_date,
            answered_at: rfi.answered_at,
            closed_at: rfi.closed_at,
          })
        )
      }

      return filtered
    },
    enabled: !!org?.id && !!projects,
  })

  // Client-side search filtering
  const filteredRfis = rfis?.filter((rfi: any) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      rfi.number?.toLowerCase().includes(query) ||
      rfi.title?.toLowerCase().includes(query) ||
      rfi.project?.name?.toLowerCase().includes(query)
    )
  })

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!rfis) {
      return {
        total: 0,
        pending: 0,
        overdue: 0,
        avgResponseTime: 0,
      }
    }

    const total = rfis.length
    const pending = rfis.filter(
      (rfi: any) => rfi.status === 'submitted' || rfi.status === 'under_review'
    ).length
    const overdue = rfis.filter((rfi: any) =>
      isOverdue({
        status: rfi.status,
        submitted_at: rfi.submitted_at,
        response_due_date: rfi.response_due_date,
        answered_at: rfi.answered_at,
        closed_at: rfi.closed_at,
      })
    ).length

    // Calculate average response time in days
    const responseTimes = rfis
      .map((rfi: any) =>
        calculateResponseTime({
          status: rfi.status,
          submitted_at: rfi.submitted_at,
          response_due_date: rfi.response_due_date,
          answered_at: rfi.answered_at,
          closed_at: rfi.closed_at,
        })
      )
      .filter((time): time is number => time !== null)

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / 24
        : 0

    return {
      total,
      pending,
      overdue,
      avgResponseTime: Math.round(avgResponseTime * 10) / 10,
    }
  }, [rfis])

  const handleRowClick = (rfiId: string, projectId: string) => {
    router.push(`/${orgSlug}/projects/${projectId}/rfis/${rfiId}`)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-white tracking-tight">RFIs</h1>
          <p className="text-white/50 text-sm mt-1">
            All requests for information across projects
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3"
        >
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg",
            "bg-white/[0.03] border border-white/[0.06]",
            "text-white/50 text-sm"
          )}>
            <Building2 className="h-4 w-4" />
            {projects?.length || 0} Projects
          </div>
        </motion.div>
      </div>

      {/* Metrics Row */}
      <motion.div
        className="grid gap-4 md:grid-cols-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Total RFIs */}
        <div className={cn(
          "relative rounded-xl p-5 overflow-hidden group",
          "bg-white/[0.02] border border-white/[0.06]",
          "hover:border-white/[0.1] transition-all duration-300"
        )}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Total RFIs</p>
              <p className="text-3xl font-bold text-white mt-1">{metrics.total}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Pending Response */}
        <div className={cn(
          "relative rounded-xl p-5 overflow-hidden group",
          "bg-white/[0.02] border border-amber-500/20",
          "hover:border-amber-500/40 transition-all duration-300"
        )}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Pending Response</p>
              <p className="text-3xl font-bold text-amber-400 mt-1">{metrics.pending}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Overdue */}
        <div className={cn(
          "relative rounded-xl p-5 overflow-hidden group",
          "bg-white/[0.02] border border-red-500/20",
          "hover:border-red-500/40 transition-all duration-300"
        )}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Overdue</p>
              <p className="text-3xl font-bold text-red-400 mt-1">{metrics.overdue}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
          </div>
        </div>

        {/* Avg Response */}
        <div className={cn(
          "relative rounded-xl p-5 overflow-hidden group",
          "bg-white/[0.02] border border-white/[0.06]",
          "hover:border-white/[0.1] transition-all duration-300"
        )}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Avg Response</p>
              <p className="text-3xl font-bold text-white mt-1">
                {metrics.avgResponseTime > 0 ? `${metrics.avgResponseTime}d` : '-'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <TrendingDown className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* RFI List Card */}
      <motion.div
        className={cn(
          "rounded-xl overflow-hidden",
          "bg-white/[0.02] border border-white/[0.06]"
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Card Header */}
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">RFI Log</h2>
              <p className="text-sm text-white/40 mt-0.5">
                Track all requests for information across all projects
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Search RFIs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "w-[200px] pl-10 pr-4 py-2 text-sm rounded-lg",
                    "bg-white/[0.03] border border-white/[0.08]",
                    "text-white placeholder:text-white/30",
                    "focus:outline-none focus:border-amber-500/50",
                    "transition-all duration-200"
                  )}
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                  "bg-white/[0.03] border border-white/[0.08]",
                  "text-white/70 hover:text-white hover:bg-white/[0.06]",
                  "transition-all duration-200",
                  showFilters && "border-amber-500/50 text-amber-400"
                )}
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  showFilters && "rotate-180"
                )} />
              </button>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/[0.06]"
            >
              {/* Project Filter */}
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className={cn(
                  "px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer",
                  "bg-white/[0.03] border border-white/[0.08]",
                  "text-white/70",
                  "focus:outline-none focus:border-amber-500/50",
                  "transition-all duration-200"
                )}
              >
                <option value="all">All Projects</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={cn(
                  "px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer",
                  "bg-white/[0.03] border border-white/[0.08]",
                  "text-white/70",
                  "focus:outline-none focus:border-amber-500/50",
                  "transition-all duration-200"
                )}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="answered">Answered</option>
                <option value="closed">Closed</option>
              </select>

              {/* Clear Filters */}
              {(projectFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setProjectFilter('all')
                    setStatusFilter('all')
                  }}
                  className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <RFITable
            rfis={filteredRfis || []}
            isLoading={isLoading}
            onRowClick={(rfiId) => {
              const rfi = filteredRfis?.find((r: any) => r.id === rfiId)
              if (rfi) handleRowClick(rfiId, rfi.project_id)
            }}
            showProject={true}
          />
        </div>
      </motion.div>
    </div>
  )
}
