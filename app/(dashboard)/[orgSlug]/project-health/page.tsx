/**
 * Project Health Overview Page - Industrial Luxury Dark Theme
 */

import { getOrgProjectsHealth } from '@/lib/actions/project-health'
import { ProjectHealthCard } from '@/components/project-health/project-card'
import { cn } from '@/lib/utils'
import { Activity, AlertTriangle, CheckCircle2, TrendingUp, DollarSign, FileText, HeartPulse } from 'lucide-react'

export default async function ProjectHealthPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const projectsResult = await getOrgProjectsHealth(orgSlug)

  if (!projectsResult.success || !projectsResult.data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-6">
        <div className={cn(
          "flex items-center gap-3 rounded-lg p-4",
          "bg-red-500/10 border border-red-500/20"
        )}>
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <p className="text-sm text-red-400">
            Error loading project health data: {!projectsResult.success ? projectsResult.error : 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }

  const projects = projectsResult.data

  // Calculate aggregate stats
  const totalProjects = projects.length
  const healthyProjects = projects.filter((p) => p.healthStatus === 'healthy').length
  const warningProjects = projects.filter((p) => p.healthStatus === 'warning').length
  const criticalProjects = projects.filter((p) => p.healthStatus === 'critical').length
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0)
  const totalSpent = projects.reduce((sum, p) => sum + p.totalSpent, 0)
  const totalInvoices = projects.reduce((sum, p) => sum + p.invoiceCount.total, 0)

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <HeartPulse className="h-5 w-5 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Project Health Overview</h1>
        </div>
        <p className="text-white/50">
          Monitor cost tracking and budget status across all projects
        </p>
      </div>

      {/* Summary Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        {/* Total Projects */}
        <div className={cn(
          "rounded-xl p-5",
          "bg-white/[0.02] border border-white/[0.06]"
        )}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white/60">Total Projects</span>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Activity className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{totalProjects}</div>
          <div className="flex gap-3 text-xs">
            <span className="text-emerald-400">{healthyProjects} healthy</span>
            <span className="text-amber-400">{warningProjects} warning</span>
            <span className="text-red-400">{criticalProjects} critical</span>
          </div>
        </div>

        {/* Total Budget */}
        <div className={cn(
          "rounded-xl p-5",
          "bg-white/[0.02] border border-white/[0.06]"
        )}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white/60">Total Budget</span>
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            ${(totalBudget / 1000000).toFixed(1)}M
          </div>
          <p className="text-xs text-white/40">Across all projects</p>
        </div>

        {/* Total Spent */}
        <div className={cn(
          "rounded-xl p-5",
          "bg-white/[0.02] border border-white/[0.06]"
        )}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white/60">Total Spent</span>
            <div className="p-2 rounded-lg bg-amber-500/10">
              <TrendingUp className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            ${(totalSpent / 1000000).toFixed(1)}M
          </div>
          <p className="text-xs text-white/40">
            {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}% of total budget
          </p>
        </div>

        {/* Total Invoices */}
        <div className={cn(
          "rounded-xl p-5",
          "bg-white/[0.02] border border-white/[0.06]"
        )}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white/60">Total Invoices</span>
            <div className="p-2 rounded-lg bg-purple-500/10">
              <FileText className="h-4 w-4 text-purple-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{totalInvoices}</div>
          <p className="text-xs text-white/40">Uploaded across all projects</p>
        </div>
      </div>

      {/* Project Count Header */}
      <div className="mb-6 flex items-center gap-4">
        <h2 className="text-lg font-semibold text-white">All Projects</h2>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-white/60">{healthyProjects} healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span className="text-white/60">{warningProjects} warning</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-white/60">{criticalProjects} critical</span>
          </div>
        </div>
      </div>

      {/* Project Grid */}
      {projects.length === 0 ? (
        <div className={cn(
          "rounded-xl p-12 text-center",
          "bg-white/[0.02] border border-white/[0.06]"
        )}>
          <p className="text-white/40">No projects found in this organization.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectHealthCard key={project.id} project={project} orgSlug={orgSlug} />
          ))}
        </div>
      )}
    </div>
  )
}
