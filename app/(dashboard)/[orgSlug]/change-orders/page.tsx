/**
 * Organization-Level Change Orders Page
 * Industrial Luxury aesthetic
 */

'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { ChangeOrderStatusBadge } from '@/components/change-orders/change-order-status-badge'
import { Search, DollarSign, TrendingUp, Clock, Building2, ChevronRight, Filter, ChevronDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { ChangeOrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function OrganizationChangeOrdersPage() {
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
        .select('id, name, number, budget')
        .eq('org_id', org.id)
        .is('deleted_at', null)
        .order('name')

      if (error) throw error
      return data || []
    },
    enabled: !!org?.id,
  })

  // Fetch Change Orders across all projects
  const { data: changeOrders, isLoading } = useQuery({
    queryKey: ['org-change-orders', org?.id, statusFilter, projectFilter],
    queryFn: async () => {
      if (!org?.id) return []
      const supabase = createClient()

      const projectIds = projects?.map((p) => p.id) || []
      if (projectIds.length === 0) return []

      let query = supabase
        .from('change_orders')
        .select(
          `
          id,
          number,
          title,
          type,
          status,
          cost_impact,
          schedule_impact_days,
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
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any)
      }

      if (projectFilter !== 'all') {
        query = query.eq('project_id', projectFilter)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    },
    enabled: !!org?.id && !!projects,
  })

  // Calculate financial summary
  const metrics = useMemo(() => {
    const totalBudget = projects?.reduce((sum, p) => sum + parseFloat(p.budget?.toString() || '0'), 0) || 0
    const approvedChanges = changeOrders
      ?.filter((co: any) => co.status === 'approved' || co.status === 'invoiced')
      .reduce((sum: number, co: any) => sum + parseFloat(co.cost_impact || '0'), 0) || 0
    const pendingChanges = changeOrders
      ?.filter((co: any) => co.status === 'proposed' || co.status === 'potential')
      .reduce((sum: number, co: any) => sum + parseFloat(co.cost_impact || '0'), 0) || 0
    const totalCount = changeOrders?.length || 0
    const approvedCount = changeOrders?.filter((co: any) => co.status === 'approved').length || 0

    return {
      totalBudget,
      approvedChanges,
      pendingChanges,
      currentContract: totalBudget + approvedChanges,
      totalCount,
      approvedCount,
    }
  }, [projects, changeOrders])

  // Client-side search filtering
  const filteredChangeOrders = changeOrders?.filter((co: any) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      co.number?.toLowerCase().includes(query) ||
      co.title?.toLowerCase().includes(query) ||
      co.project?.name?.toLowerCase().includes(query)
    )
  })

  const handleRowClick = (coId: string, projectId: string) => {
    router.push(`/${orgSlug}/projects/${projectId}/change-orders/${coId}`)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-white tracking-tight">Change Orders</h1>
          <p className="text-white/50 text-sm mt-1">
            Track cost and schedule impacts across projects
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
        {/* Total Change Orders */}
        <div className={cn(
          "relative rounded-xl p-5 overflow-hidden group",
          "bg-white/[0.02] border border-white/[0.06]",
          "hover:border-white/[0.1] transition-all duration-300"
        )}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Total COs</p>
              <p className="text-3xl font-bold text-white mt-1">{metrics.totalCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Approved Count */}
        <div className={cn(
          "relative rounded-xl p-5 overflow-hidden group",
          "bg-white/[0.02] border border-emerald-500/20",
          "hover:border-emerald-500/40 transition-all duration-300"
        )}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Approved</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">{metrics.approvedCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <Clock className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Approved Value */}
        <div className={cn(
          "relative rounded-xl p-5 overflow-hidden group",
          "bg-white/[0.02] border border-white/[0.06]",
          "hover:border-emerald-500/30 transition-all duration-300"
        )}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Approved Value</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">
                ${(metrics.approvedChanges / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Pending Value */}
        <div className={cn(
          "relative rounded-xl p-5 overflow-hidden group",
          "bg-white/[0.02] border border-amber-500/20",
          "hover:border-amber-500/40 transition-all duration-300"
        )}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Pending Value</p>
              <p className="text-3xl font-bold text-amber-400 mt-1">
                ${(metrics.pendingChanges / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Change Orders List */}
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
              <h2 className="text-lg font-semibold text-white">Change Order Log</h2>
              <p className="text-sm text-white/40 mt-0.5">
                All change orders across all projects
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "w-[180px] pl-10 pr-4 py-2 text-sm rounded-lg",
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
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className={cn(
                  "px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer",
                  "bg-white/[0.03] border border-white/[0.08]",
                  "text-white/70",
                  "focus:outline-none focus:border-amber-500/50"
                )}
              >
                <option value="all">All Projects</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={cn(
                  "px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer",
                  "bg-white/[0.03] border border-white/[0.08]",
                  "text-white/70",
                  "focus:outline-none focus:border-amber-500/50"
                )}
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="potential">Potential</option>
                <option value="proposed">Proposed</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="invoiced">Invoiced</option>
              </select>

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
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">Number</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">Project</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">Title</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40 hidden md:table-cell">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">Cost Impact</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40 hidden lg:table-cell">Schedule</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-white/40">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : filteredChangeOrders && filteredChangeOrders.length > 0 ? (
                filteredChangeOrders.map((co: any) => {
                  const costImpact = parseFloat(co.cost_impact || '0')
                  return (
                    <tr
                      key={co.id}
                      className={cn(
                        "group cursor-pointer border-b border-white/[0.03]",
                        "hover:bg-white/[0.02] transition-colors duration-200"
                      )}
                      onClick={() => handleRowClick(co.id, co.project_id)}
                    >
                      <td className="px-5 py-4">
                        <span className="font-medium text-white/80">#{co.number}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-white/60">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate max-w-[150px]">{co.project?.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-white line-clamp-1 max-w-[250px]">{co.title}</p>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-sm text-white/50 capitalize">{co.type?.replace('_', ' ')}</span>
                      </td>
                      <td className="px-5 py-4">
                        <ChangeOrderStatusBadge status={co.status as ChangeOrderStatus} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={cn(
                          "font-medium",
                          costImpact > 0 ? "text-red-400" : costImpact < 0 ? "text-emerald-400" : "text-white/50"
                        )}>
                          {costImpact > 0 ? '+' : ''}${costImpact.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right hidden lg:table-cell">
                        <span className="text-sm text-white/50">
                          {co.schedule_impact_days ? `${co.schedule_impact_days}d` : '-'}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="h-4 w-4 text-white/40" />
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-white/40">
                    No change orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
