import { getOrganizationBySlug } from '@/lib/actions/organization-helpers'
import { getOrganizationProjects } from '@/lib/actions/project-helpers'
import { getCurrentUser } from '@/lib/actions/auth'
import { getOrganizationKPIs, getProjectAnalytics } from '@/lib/actions/analytics'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Calendar } from 'lucide-react'
import { KPICard } from '@/components/analytics/kpi-card'
import { StatCard } from '@/components/analytics/stat-card'

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const orgResult = await getOrganizationBySlug(orgSlug)
  const userResult = await getCurrentUser()

  if (!orgResult) {
    redirect('/dashboard')
  }

  // After the redirect check, we know org is defined
  const org = orgResult as any
  const projectsResult = await getOrganizationProjects(org.id)
  const projects = projectsResult.success ? projectsResult.data.projects : []

  // Get analytics data
  const kpisResult = await getOrganizationKPIs(org.id)
  const analyticsResult = await getProjectAnalytics(org.id)

  const kpis = kpisResult.success && kpisResult.data ? kpisResult.data : null
  const analytics = analyticsResult.success && analyticsResult.data ? analyticsResult.data : null

  // Get user's first name for welcome message
  const user = userResult.success ? userResult.data : null
  const userName = user?.email?.split('@')[0] || 'User'
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1)

  // Get current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="space-y-4 lg:space-y-6 lg:p-6 -m-4 lg:m-0">
      {/* Header with Actions */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-4 lg:p-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {displayName}</p>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Calendar className="mr-2 h-4 w-4" />
            {currentDate}
          </Button>
          <Button asChild size="sm" className="touch-manipulation">
            <Link href={`/${orgSlug}/projects/new`}>
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Quick Add</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid - Enhanced KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 lg:gap-4 px-4 lg:px-0">
        <KPICard
          title="Active Projects"
          value={kpis?.activeProjects || 0}
          icon="Building2"
          subtitle={`${kpis?.totalProjects || 0} total projects`}
        />
        <KPICard
          title="Team Members"
          value={kpis?.totalTeamMembers || 0}
          icon="Users"
          subtitle="Across all projects"
        />
        <KPICard
          title="Open RFIs"
          value={kpis?.openRFIs || 0}
          icon="FileText"
          subtitle="Requiring response"
        />
        <KPICard
          title="Budget Utilization"
          value={`${(kpis?.budgetUtilization ?? 0).toFixed(0)}%`}
          icon="TrendingUp"
          trend={
            kpis && kpis.budgetUtilization > 0
              ? {
                  value: kpis.budgetUtilization > 75 ? 10 : -5,
                  label: kpis.budgetUtilization > 75 ? 'vs last month' : 'under budget',
                }
              : undefined
          }
        />
      </div>

      {/* Analytics Overview */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:gap-4 px-4 lg:px-0">
        <StatCard
          title="Project Status"
          icon="Building2"
          stats={[
            { label: 'Active', value: analytics?.activeProjects || 0, color: 'text-green-600' },
            { label: 'Completed', value: analytics?.completedProjects || 0, color: 'text-blue-600' },
            { label: 'On Hold', value: analytics?.onHoldProjects || 0, color: 'text-amber-600' },
          ]}
        />

        <StatCard
          title="Budget Overview"
          icon="DollarSign"
          stats={[
            {
              label: 'Total Budget',
              value: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
              }).format(analytics?.totalBudget || 0),
            },
            {
              label: 'Total Spent',
              value: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
              }).format(analytics?.totalSpent || 0),
              color: 'text-red-600',
            },
            {
              label: 'Remaining',
              value: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
              }).format((analytics?.totalBudget || 0) - (analytics?.totalSpent || 0)),
              color: 'text-green-600',
            },
          ]}
        />

        <StatCard
          title="Workflow Items"
          icon="ClipboardList"
          stats={[
            { label: 'Open RFIs', value: kpis?.openRFIs || 0 },
            { label: 'Pending Submittals', value: kpis?.pendingSubmittals || 0 },
            { label: 'Avg Completion', value: `${(analytics?.averageCompletion ?? 0).toFixed(0)}%` },
          ]}
        />
      </div>
    </div>
  )
}
