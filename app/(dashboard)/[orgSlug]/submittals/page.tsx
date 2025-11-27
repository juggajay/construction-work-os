/**
 * Organization-Level Submittals Page
 * Industrial Luxury aesthetic
 */

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Building2, FileCheck, Clock, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageProps {
  params: Promise<{
    orgSlug: string
  }>
}

// Status badge mapping - Industrial Luxury style
const STATUS_CONFIG: Record<string, { label: string; bgClass: string; textClass: string }> = {
  draft: { label: 'Draft', bgClass: 'bg-white/[0.05]', textClass: 'text-white/50' },
  gc_review: { label: 'GC Review', bgClass: 'bg-blue-500/10', textClass: 'text-blue-400' },
  ae_review: { label: 'AE Review', bgClass: 'bg-purple-500/10', textClass: 'text-purple-400' },
  owner_review: { label: 'Owner Review', bgClass: 'bg-amber-500/10', textClass: 'text-amber-400' },
  complete: { label: 'Approved', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-400' },
  rejected: { label: 'Rejected', bgClass: 'bg-red-500/10', textClass: 'text-red-400' },
}

export default async function OrganizationSubmittalsPage({ params }: PageProps) {
  const { orgSlug } = await params

  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', orgSlug)
    .single()

  if (orgError || !org) {
    notFound()
  }

  // Get all projects for organization
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, number')
    .eq('org_id', org.id)
    .is('deleted_at', null)
    .order('name')

  const projectIds = projects?.map((p) => p.id) || []

  // Get all submittals across projects
  const { data: submittals } = await supabase
    .from('submittals')
    .select(`
      id,
      number,
      title,
      current_stage,
      status,
      due_date,
      project_id,
      csi_code,
      spec_section,
      created_at,
      project:projects (
        id,
        name,
        number
      )
    `)
    .in('project_id', projectIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const totalSubmittals = submittals?.length || 0
  const pendingCount = submittals?.filter((s: any) =>
    ['gc_review', 'ae_review', 'owner_review'].includes(s.current_stage)
  ).length || 0
  const approvedCount = submittals?.filter((s: any) => s.current_stage === 'complete').length || 0
  const overdueCount = submittals?.filter((s: any) => {
    if (!s.due_date || s.current_stage === 'complete') return false
    return new Date(s.due_date) < new Date()
  }).length || 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Submittals</h1>
          <p className="text-white/50 text-sm mt-1">
            Track and manage all submittals across projects
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
        {/* Total Submittals */}
        <div className={cn(
          "relative rounded-xl p-5 overflow-hidden group",
          "bg-white/[0.02] border border-white/[0.06]",
          "hover:border-white/[0.1] transition-all duration-300"
        )}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Total</p>
              <p className="text-3xl font-bold text-white mt-1">{totalSubmittals}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10">
              <FileCheck className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Pending Review */}
        <div className={cn(
          "relative rounded-xl p-5 overflow-hidden group",
          "bg-white/[0.02] border border-amber-500/20",
          "hover:border-amber-500/40 transition-all duration-300"
        )}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Pending Review</p>
              <p className="text-3xl font-bold text-amber-400 mt-1">{pendingCount}</p>
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
              <p className="text-3xl font-bold text-red-400 mt-1">{overdueCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10">
              <AlertCircle className="h-5 w-5 text-red-400" />
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
              <p className="text-3xl font-bold text-emerald-400 mt-1">{approvedCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Submittals Table */}
      <div className={cn(
        "rounded-xl overflow-hidden",
        "bg-white/[0.02] border border-white/[0.06]"
      )}>
        {/* Card Header */}
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">All Submittals</h2>
              <p className="text-sm text-white/40 mt-0.5">
                {totalSubmittals} total submittals across all projects
              </p>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40 w-24">
                  Number
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                  Title
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                  Project
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40 hidden md:table-cell">
                  CSI Code
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                  Stage
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40 hidden lg:table-cell">
                  Due Date
                </th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {!submittals || submittals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-white/40">
                    No submittals found
                  </td>
                </tr>
              ) : (
                submittals.map((submittal: any) => {
                  const status = STATUS_CONFIG[submittal.current_stage] || STATUS_CONFIG.draft
                  const isOverdue = submittal.due_date &&
                    new Date(submittal.due_date) < new Date() &&
                    submittal.current_stage !== 'complete'

                  return (
                    <tr
                      key={submittal.id}
                      className={cn(
                        "group cursor-pointer border-b border-white/[0.03]",
                        "hover:bg-white/[0.02] transition-colors duration-200"
                      )}
                      onClick={() => {
                        window.location.href = `/${orgSlug}/projects/${submittal.project_id}/submittals/${submittal.id}`
                      }}
                    >
                      <td className="px-5 py-4">
                        <span className="font-medium text-white/80">#{submittal.number}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-white line-clamp-1">{submittal.title}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-white/60">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{submittal.project?.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-sm text-white/50">{submittal.csi_code || '-'}</span>
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
                      <td className="px-5 py-4 hidden lg:table-cell">
                        {submittal.due_date ? (
                          <span className={cn(
                            "text-sm",
                            isOverdue ? "text-red-400 font-medium" : "text-white/60"
                          )}>
                            {new Date(submittal.due_date).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-sm text-white/30">-</span>
                        )}
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
    </div>
  )
}
