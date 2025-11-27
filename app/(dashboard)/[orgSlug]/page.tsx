import { getOrganizationBySlug } from '@/lib/actions/organization-helpers'
import { getOrganizationProjects } from '@/lib/actions/project-helpers'
import { getCurrentUser } from '@/lib/actions/auth'
import { getOrganizationKPIs, getProjectAnalytics } from '@/lib/actions/analytics'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Plus,
  ArrowUpRight,
  ArrowRight,
  Building2,
  DollarSign,
  Users,
  FileText,
  ClipboardList,
  Calendar,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// ORGANIZATION DASHBOARD - INDUSTRIAL LUXURY
// Dark, refined, amber accents, data-forward design
// ============================================================================

export const revalidate = 60

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

  const org = orgResult as any
  const projectsResult = await getOrganizationProjects(org.id)
  const projects = projectsResult.success ? projectsResult.data.projects : []

  const kpisResult = await getOrganizationKPIs(org.id)
  const analyticsResult = await getProjectAnalytics(org.id)

  const kpis = kpisResult.success && kpisResult.data ? kpisResult.data : null
  const analytics = analyticsResult.success && analyticsResult.data ? analyticsResult.data : null

  const user = userResult.success ? userResult.data : null
  const userName = user?.email?.split('@')[0] || 'User'
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1)

  // Get greeting based on time
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  // Calculate budget percentage
  const totalBudget = analytics?.totalBudget || 0
  const totalSpent = analytics?.totalSpent || 0
  const remaining = totalBudget - totalSpent
  const budgetPercentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return `$${amount.toFixed(0)}`
  }

  // Quick actions
  const quickActions = [
    {
      href: `/${orgSlug}/daily-reports/new`,
      icon: Calendar,
      label: 'Daily Report',
      description: "Log today's progress",
    },
    {
      href: `/${orgSlug}/rfis/new`,
      icon: FileText,
      label: 'New RFI',
      description: 'Request information',
    },
    {
      href: `/${orgSlug}/submittals/new`,
      icon: ClipboardList,
      label: 'New Submittal',
      description: 'Submit for approval',
    },
    {
      href: `/${orgSlug}/change-orders/new`,
      icon: DollarSign,
      label: 'Change Order',
      description: 'Create modification',
    },
  ]

  // Recent projects (top 4 by activity)
  const recentProjects = projects.slice(0, 4)

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Noise texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Ambient glow */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-amber-500/[0.03] rounded-full blur-[150px] pointer-events-none" />

      {/* Main content - offset for sidebar */}
      <main className="relative z-10 ml-[260px] min-h-screen">
        <div className="max-w-[1400px] mx-auto px-8 py-8">

          {/* ================================================================
              HEADER
              ================================================================ */}
          <header className="mb-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/40 mb-1">{currentDate}</p>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  {greeting}, <span className="text-gradient-amber">{displayName}</span>
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/${orgSlug}/project-health`}
                  className={cn(
                    "flex items-center gap-2 h-10 px-4 rounded-xl",
                    "bg-white/[0.03] border border-white/[0.06]",
                    "text-sm font-medium text-white/60",
                    "hover:bg-white/[0.06] hover:text-white",
                    "transition-all duration-200"
                  )}
                >
                  <Activity className="h-4 w-4" />
                  Health Report
                </Link>
                <Link
                  href={`/${orgSlug}/projects/new`}
                  className={cn(
                    "flex items-center gap-2 h-10 px-4 rounded-xl",
                    "bg-gradient-to-r from-amber-500 to-amber-600 text-black",
                    "text-sm font-medium",
                    "hover:shadow-lg hover:shadow-amber-500/25",
                    "transition-all duration-200"
                  )}
                >
                  <Plus className="h-4 w-4" />
                  New Project
                </Link>
              </div>
            </div>
          </header>

          {/* ================================================================
              STATS ROW
              ================================================================ */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              {
                label: 'Active Projects',
                value: kpis?.activeProjects || 0,
                subtext: `of ${kpis?.totalProjects || 0} total`,
                icon: Building2,
                color: 'amber',
              },
              {
                label: 'Open RFIs',
                value: kpis?.openRFIs || 0,
                subtext: 'requiring action',
                icon: FileText,
                color: 'blue',
                href: `/${orgSlug}/rfis`,
              },
              {
                label: 'Pending Submittals',
                value: kpis?.pendingSubmittals || 0,
                subtext: 'awaiting review',
                icon: ClipboardList,
                color: 'purple',
                href: `/${orgSlug}/submittals`,
              },
              {
                label: 'Team Members',
                value: kpis?.totalTeamMembers || 0,
                subtext: 'across projects',
                icon: Users,
                color: 'emerald',
                href: `/${orgSlug}/team`,
              },
            ].map((stat) => {
              const Icon = stat.icon
              const content = (
                <div
                  className={cn(
                    "relative p-6 rounded-2xl overflow-hidden",
                    "bg-[#111] border border-white/[0.06]",
                    "transition-all duration-300",
                    "hover:border-white/10",
                    "group"
                  )}
                >
                  {/* Top glow line on hover */}
                  <div className={cn(
                    "absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity",
                    stat.color === 'amber' && "bg-gradient-to-r from-transparent via-amber-500/50 to-transparent",
                    stat.color === 'blue' && "bg-gradient-to-r from-transparent via-blue-500/50 to-transparent",
                    stat.color === 'purple' && "bg-gradient-to-r from-transparent via-purple-500/50 to-transparent",
                    stat.color === 'emerald' && "bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent",
                  )} />

                  <div className="flex items-start justify-between mb-4">
                    <p className="text-xs font-medium text-white/40 uppercase tracking-wider">{stat.label}</p>
                    <div className={cn(
                      "p-2 rounded-lg",
                      stat.color === 'amber' && "bg-amber-500/10 text-amber-400",
                      stat.color === 'blue' && "bg-blue-500/10 text-blue-400",
                      stat.color === 'purple' && "bg-purple-500/10 text-purple-400",
                      stat.color === 'emerald' && "bg-emerald-500/10 text-emerald-400",
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-white tracking-tight">{stat.value}</p>
                  <p className="text-sm text-white/30 mt-1">{stat.subtext}</p>
                </div>
              )

              return stat.href ? (
                <Link key={stat.label} href={stat.href}>{content}</Link>
              ) : (
                <div key={stat.label}>{content}</div>
              )
            })}
          </div>

          {/* ================================================================
              MAIN GRID
              ================================================================ */}
          <div className="grid grid-cols-12 gap-6">

            {/* Budget & Completion - Left column */}
            <div className="col-span-5 space-y-6">

              {/* Budget Card */}
              <div className="p-6 rounded-2xl bg-[#111] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10">
                      <DollarSign className="h-5 w-5 text-emerald-400" />
                    </div>
                    <p className="text-sm font-medium text-white/60">Budget Overview</p>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium",
                    budgetPercentUsed > 90
                      ? "bg-red-500/15 text-red-400"
                      : budgetPercentUsed > 70
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-emerald-500/15 text-emerald-400"
                  )}>
                    {budgetPercentUsed.toFixed(0)}% used
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-white/40 mb-1">Total Budget</p>
                    <p className="text-3xl font-bold text-white">{formatCurrency(totalBudget)}</p>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        budgetPercentUsed > 90 ? "bg-red-500" :
                        budgetPercentUsed > 70 ? "bg-amber-500" : "bg-emerald-500"
                      )}
                      style={{ width: `${Math.min(budgetPercentUsed, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="text-white/40">Spent</p>
                      <p className="text-white font-medium">{formatCurrency(totalSpent)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/40">Remaining</p>
                      <p className="text-emerald-400 font-medium">{formatCurrency(remaining)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Completion Progress */}
              <div className="p-6 rounded-2xl bg-[#111] border border-white/[0.06]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-amber-500/10">
                    <TrendingUp className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/60">Average Completion</p>
                  </div>
                </div>

                <div className="flex items-end gap-4 mb-4">
                  <p className="text-5xl font-bold text-white tracking-tight">
                    {(analytics?.averageCompletion ?? 0).toFixed(0)}
                  </p>
                  <p className="text-2xl text-white/40 mb-1">%</p>
                </div>

                {/* Large progress ring visualization */}
                <div className="relative h-4 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
                    style={{ width: `${analytics?.averageCompletion ?? 0}%` }}
                  />
                </div>
                <p className="text-sm text-white/30 mt-3">
                  Across {kpis?.activeProjects || 0} active projects
                </p>
              </div>
            </div>

            {/* Projects & Quick Actions - Right column */}
            <div className="col-span-7 space-y-6">

              {/* Recent Projects */}
              <div className="p-6 rounded-2xl bg-[#111] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Projects</h2>
                  <Link
                    href={`/${orgSlug}/projects`}
                    className="text-sm text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                  >
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {recentProjects.length > 0 ? (
                    recentProjects.map((project: any) => (
                      <Link
                        key={project.id}
                        href={`/${orgSlug}/projects/${project.id}`}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl",
                          "bg-white/[0.02] border border-white/[0.04]",
                          "hover:bg-white/[0.04] hover:border-white/[0.08]",
                          "transition-all duration-200 group"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                            "bg-gradient-to-br from-amber-500/20 to-amber-600/10"
                          )}>
                            🏗️
                          </div>
                          <div>
                            <p className="font-medium text-white group-hover:text-amber-400 transition-colors">
                              {project.name}
                            </p>
                            <p className="text-sm text-white/40">
                              {formatCurrency(project.budget || 0)} budget
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-white">
                              {project.completion_percentage || 0}%
                            </p>
                            <div className="w-20 h-1.5 rounded-full bg-white/[0.06] mt-1 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-amber-500"
                                style={{ width: `${project.completion_percentage || 0}%` }}
                              />
                            </div>
                          </div>
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            project.status === 'active' && "bg-emerald-500/15 text-emerald-400",
                            project.status === 'on_hold' && "bg-amber-500/15 text-amber-400",
                            project.status === 'completed' && "bg-blue-500/15 text-blue-400",
                            !['active', 'on_hold', 'completed'].includes(project.status) && "bg-white/10 text-white/50"
                          )}>
                            {project.status || 'draft'}
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Building2 className="h-12 w-12 text-white/20 mx-auto mb-4" />
                      <p className="text-white/40 mb-4">No projects yet</p>
                      <Link
                        href={`/${orgSlug}/projects/new`}
                        className={cn(
                          "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                          "bg-amber-500/10 text-amber-400",
                          "hover:bg-amber-500/20 transition-colors"
                        )}
                      >
                        <Plus className="h-4 w-4" />
                        Create your first project
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-6 rounded-2xl bg-[#111] border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-5">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <Link
                        key={action.href}
                        href={action.href}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl",
                          "bg-white/[0.02] border border-white/[0.04]",
                          "hover:bg-white/[0.04] hover:border-amber-500/20",
                          "transition-all duration-200 group"
                        )}
                      >
                        <div className={cn(
                          "p-2.5 rounded-lg",
                          "bg-white/[0.04] group-hover:bg-amber-500/10",
                          "text-white/50 group-hover:text-amber-400",
                          "transition-colors"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{action.label}</p>
                          <p className="text-xs text-white/40">{action.description}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
