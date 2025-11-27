import { getOrganizationBySlug } from '@/lib/actions/organization-helpers'
import { getOrganizationProjects, getBatchProjectMetrics } from '@/lib/actions/project-helpers'
import { notFound } from 'next/navigation'
import { ProjectCard, ProjectCardData } from '@/components/projects/project-card'
import { ProjectTable } from '@/components/projects/project-table'
import { ProjectKanban } from '@/components/projects/project-kanban'
import { ProjectTimeline } from '@/components/projects/project-timeline'
import Link from 'next/link'
import { Plus, Building2, Filter, ArrowUpDown, Grid3x3, List, Columns, Calendar, DollarSign, Briefcase, PauseCircle, Archive } from 'lucide-react'
import { ProjectsViewSwitcher } from '@/components/projects/projects-view-switcher'

// ✅ PHASE 2 OPTIMIZATION: Page-level caching
export const revalidate = 60

interface ProjectsPageProps {
  params: Promise<{
    orgSlug: string
  }>
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { orgSlug } = await params

  const org = await getOrganizationBySlug(orgSlug)

  if (!org) {
    notFound()
  }

  const projectsResult = await getOrganizationProjects((org as any).id)

  if (!projectsResult.success) {
    notFound()
  }

  const projects = projectsResult.data.projects

  // Fetch metrics for all projects in batch
  const projectIds = projects.map((p: any) => p.id)
  const metricsResult = await getBatchProjectMetrics(projectIds)
  const metricsMap = metricsResult.success ? metricsResult.data : {}

  // Transform projects to ProjectCardData format
  const projectsData: ProjectCardData[] = projects.map((project: any) => {
    let daysRemaining: number | undefined
    if (project.end_date) {
      const endDate = new Date(project.end_date)
      const today = new Date()
      daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }

    let health: 'on-track' | 'at-risk' | 'delayed' | 'completed' = 'on-track'
    if (project.status === 'archived') {
      health = 'completed'
    } else if (project.status === 'on_hold') {
      health = 'at-risk'
    } else if (daysRemaining !== undefined && daysRemaining < 0) {
      health = 'delayed'
    }

    const metrics = metricsMap[project.id] || {
      totalSpent: 0,
      rfiCount: 0,
      teamSize: 0,
      completionPercentage: 0,
    }

    const budgetInMillions = project.budget ? project.budget / 1000000 : 0
    const spentInMillions = metrics.totalSpent / 1000000
    const budgetVariance = budgetInMillions > 0
      ? Math.abs(Math.round(((spentInMillions - budgetInMillions) / budgetInMillions) * 100))
      : 0
    const budgetStatus: 'under' | 'over' = spentInMillions > budgetInMillions ? 'over' : 'under'

    return {
      id: project.id,
      name: project.name,
      number: project.number || 'N/A',
      address: project.address || undefined,
      status: project.status || 'active',
      health,
      completion: metrics.completionPercentage,
      budget: budgetInMillions > 0 ? budgetInMillions : undefined,
      budgetVariance,
      budgetStatus,
      daysRemaining,
      scheduleStatus: daysRemaining && daysRemaining > 30 ? 'on-track' : daysRemaining && daysRemaining < 0 ? 'behind' : 'on-track',
      team: [],
    }
  })

  // Calculate stats
  const activeCount = projectsData.filter(p => p.status === 'active').length
  const onHoldCount = projectsData.filter(p => p.status === 'on_hold').length
  const archivedCount = projectsData.filter(p => p.status === 'archived').length
  const planningCount = projectsData.filter(p => p.status === 'planning').length
  const totalValue = projectsData.reduce((sum, p) => sum + (p.budget || 0), 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Projects</h1>
          <p className="text-white/50 text-sm mt-1">
            Manage and track all your construction projects
          </p>
        </div>
        <Link
          href={`/${orgSlug}/projects/new`}
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium text-sm shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Active Projects */}
        <div className="relative rounded-xl p-5 overflow-hidden group bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/30 transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Active</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">{activeCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <Briefcase className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* On Hold */}
        <div className="relative rounded-xl p-5 overflow-hidden group bg-white/[0.02] border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">On Hold</p>
              <p className="text-3xl font-bold text-amber-400 mt-1">{onHoldCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10">
              <PauseCircle className="h-5 w-5 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Planning */}
        <div className="relative rounded-xl p-5 overflow-hidden group bg-white/[0.02] border border-white/[0.06] hover:border-blue-500/30 transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Planning</p>
              <p className="text-3xl font-bold text-blue-400 mt-1">{planningCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Total Value */}
        <div className="relative rounded-xl p-5 overflow-hidden group bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-all duration-300">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Total Value</p>
              <p className="text-3xl font-bold text-white mt-1">${totalValue.toFixed(1)}M</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10">
              <DollarSign className="h-5 w-5 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No projects yet</h2>
          <p className="text-white/50 mb-6">
            Get started by creating your first project
          </p>
          <Link
            href={`/${orgSlug}/projects/new`}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium text-sm shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Create Project
          </Link>
        </div>
      ) : (
        <ProjectsViewSwitcher projectsData={projectsData} orgSlug={orgSlug} totalValue={totalValue} />
      )}
    </div>
  )
}
