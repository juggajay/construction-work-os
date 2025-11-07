import { getOrgProjectsHealth } from '@/lib/actions/project-health'
import { ProjectCard } from '@/components/project-health/project-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react'

export default async function ProjectHealthPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const projectsResult = await getOrgProjectsHealth(orgSlug)

  if (!projectsResult.success || !projectsResult.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          <p>Error loading project health data: {!projectsResult.success ? projectsResult.error : 'Unknown error'}</p>
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
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Project Health Overview</h1>
        <p className="mt-2 text-neutral-600">
          Monitor cost tracking and budget status across all projects
        </p>
      </div>

      {/* Summary Stats */}
      <div className="mb-8 grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Activity className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <div className="mt-1 flex gap-2 text-xs">
              <span className="text-green-600">{healthyProjects} healthy</span>
              <span className="text-yellow-600">{warningProjects} warning</span>
              <span className="text-red-600">{criticalProjects} critical</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <TrendingUp className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
            <p className="mt-1 text-xs text-neutral-500">Across all projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}% of total budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <Activity className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="mt-1 text-xs text-neutral-500">Uploaded across all projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Project Count Header */}
      <div className="mb-6 flex items-center gap-4">
        <h2 className="text-lg font-semibold">All Projects</h2>
        <div className="flex gap-3 text-sm text-neutral-600">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            <span>{healthyProjects} healthy</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-yellow-500" />
            <span>{warningProjects} warning</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-red-500" />
            <span>{criticalProjects} critical</span>
          </div>
        </div>
      </div>

      {/* Project Grid */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            <p>No projects found in this organization.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} orgSlug={orgSlug} />
          ))}
        </div>
      )}
    </div>
  )
}
