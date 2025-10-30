import { getOrganizationBySlug } from '@/lib/actions/organization-helpers'
import { getOrganizationProjects, getBatchProjectMetrics } from '@/lib/actions/project-helpers'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProjectCard, ProjectCardData } from '@/components/projects/project-card'
import { ProjectTable } from '@/components/projects/project-table'
import { ProjectKanban } from '@/components/projects/project-kanban'
import { ProjectTimeline } from '@/components/projects/project-timeline'
import Link from 'next/link'
import { Plus, Building2, Filter, ArrowUpDown, Grid3x3, List, Columns, Calendar } from 'lucide-react'

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

  const projects = await getOrganizationProjects((org as any).id)

  // Fetch metrics for all projects in batch
  const projectIds = projects.map((p: any) => p.id)
  const metricsMap = await getBatchProjectMetrics(projectIds)

  // Transform projects to ProjectCardData format
  const projectsData: ProjectCardData[] = projects.map((project: any) => {
    // Calculate days remaining if dates are available
    let daysRemaining: number | undefined
    if (project.end_date) {
      const endDate = new Date(project.end_date)
      const today = new Date()
      daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Generate sample health status based on project status
    let health: 'on-track' | 'at-risk' | 'delayed' | 'completed' = 'on-track'
    if (project.status === 'archived') {
      health = 'completed'
    } else if (project.status === 'on_hold') {
      health = 'at-risk'
    } else if (daysRemaining !== undefined && daysRemaining < 0) {
      health = 'delayed'
    }

    // Get actual metrics for this project
    const metrics = metricsMap[project.id] || {
      totalSpent: 0,
      rfiCount: 0,
      teamSize: 0,
      completionPercentage: 0,
    }

    // Calculate budget variance
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
      team: [], // Team members are not displayed in cards currently
    }
  })

  // Calculate stats
  const activeCount = projectsData.filter(p => p.status === 'active').length
  const onHoldCount = projectsData.filter(p => p.status === 'on_hold').length
  const archivedCount = projectsData.filter(p => p.status === 'archived').length
  const totalValue = projectsData.reduce((sum, p) => sum + (p.budget || 0), 0)

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header with Filters */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="mt-2 text-muted-foreground">
            {activeCount} active, {onHoldCount} on hold, {archivedCount} archived
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Sort
          </Button>
          <Button asChild>
            <Link href={`/${orgSlug}/projects/new`}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[400px] flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">No projects yet</h2>
            <p className="mb-6 text-center text-muted-foreground">
              Get started by creating your first project
            </p>
            <Button asChild>
              <Link href={`/${orgSlug}/projects/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="grid" className="w-full">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <TabsList>
              <TabsTrigger value="grid">
                <Grid3x3 className="h-4 w-4 mr-2" />
                Grid
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-4 w-4 mr-2" />
                List
              </TabsTrigger>
              <TabsTrigger value="kanban">
                <Columns className="h-4 w-4 mr-2" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <Calendar className="h-4 w-4 mr-2" />
                Timeline
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Badge variant="outline">{projectsData.length} projects</Badge>
              <Badge variant="outline">${totalValue.toFixed(1)}M total</Badge>
            </div>
          </div>

          <TabsContent value="grid" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projectsData.map((project) => (
                <ProjectCard key={project.id} project={project} orgSlug={orgSlug} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            <ProjectTable projects={projectsData} orgSlug={orgSlug} />
          </TabsContent>

          <TabsContent value="kanban" className="mt-0">
            <ProjectKanban projects={projectsData} orgSlug={orgSlug} />
          </TabsContent>

          <TabsContent value="timeline" className="mt-0">
            <ProjectTimeline projects={projectsData} orgSlug={orgSlug} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
