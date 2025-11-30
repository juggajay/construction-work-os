import { getProjectById, getProjectMetrics } from '@/lib/actions/project-helpers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Share,
  Download,
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  Users,
  MapPin,
  Clock,
  ClipboardList,
  FileCheck,
  AlertTriangle,
  Building2,
  ChevronRight,
  BarChart3,
  Settings,
  Folder,
} from 'lucide-react'
import type { Project } from '@/lib/types'

const healthColors = {
  'on-track': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  'at-risk': { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  'delayed': { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-400' },
  'completed': { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-400' },
}

const statusLabels: Record<string, string> = {
  'active': 'Active',
  'planning': 'Planning',
  'on_hold': 'On Hold',
  'archived': 'Archived',
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ orgSlug: string; projectId: string }>
}) {
  const { orgSlug, projectId } = await params
  const projectResult = await getProjectById(projectId)

  if (!projectResult.success) {
    redirect(`/${orgSlug}`)
  }

  const project = projectResult.data.project as Project

  // Fetch real metrics from database
  const metricsResult = await getProjectMetrics(projectId)

  // Use metrics if available, otherwise use safe defaults
  const metrics = metricsResult.success
    ? metricsResult.data
    : {
        totalSpent: 0,
        rfiCount: 0,
        teamSize: 0,
        completionPercentage: 0,
      }

  // Calculate metrics
  const budget = project.budget ? project.budget / 1000000 : 0
  const spent = metrics.totalSpent / 1000000 // Convert to millions
  const completion = metrics.completionPercentage

  let daysRemaining = 0
  let duration = 0
  if (project.end_date && project.start_date) {
    const endDate = new Date(project.end_date)
    const startDate = new Date(project.start_date)
    const today = new Date()
    daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
  }

  // Determine health status
  let health: 'on-track' | 'at-risk' | 'delayed' | 'completed' = 'on-track'
  if (project.status === 'archived') {
    health = 'completed'
  } else if (project.status === 'on_hold') {
    health = 'at-risk'
  } else if (daysRemaining < 0) {
    health = 'delayed'
  }

  const colors = healthColors[health]

  const rfiCount = metrics.rfiCount
  const teamSize = metrics.teamSize

  // Navigation items for project management
  const navigationItems = [
    {
      title: 'Costs',
      description: 'Track expenses, invoices & budget',
      href: `/${orgSlug}/projects/${projectId}/costs`,
      icon: DollarSign,
      color: 'emerald',
      count: spent > 0 ? `$${spent.toFixed(1)}M spent` : undefined,
    },
    {
      title: 'RFIs',
      description: 'Requests for information',
      href: `/${orgSlug}/projects/${projectId}/rfis`,
      icon: FileText,
      color: 'blue',
      count: rfiCount > 0 ? `${rfiCount} open` : undefined,
    },
    {
      title: 'Submittals',
      description: 'Document submissions & approvals',
      href: `/${orgSlug}/projects/${projectId}/submittals`,
      icon: FileCheck,
      color: 'purple',
    },
    {
      title: 'Change Orders',
      description: 'Scope & budget modifications',
      href: `/${orgSlug}/projects/${projectId}/change-orders`,
      icon: ClipboardList,
      color: 'amber',
    },
    {
      title: 'Daily Reports',
      description: 'Field logs & progress updates',
      href: `/${orgSlug}/projects/${projectId}/daily-reports`,
      icon: Clock,
      color: 'cyan',
    },
    {
      title: 'Team',
      description: 'Project members & roles',
      href: `/${orgSlug}/projects/${projectId}/team`,
      icon: Users,
      color: 'pink',
      count: teamSize > 0 ? `${teamSize} members` : undefined,
    },
    {
      title: 'Snag List',
      description: 'Punch list & defects',
      href: `/${orgSlug}/projects/${projectId}/snag-list`,
      icon: AlertTriangle,
      color: 'orange',
    },
    {
      title: 'Documents',
      description: 'Plans, specs & files',
      href: `/${orgSlug}/projects/${projectId}/documents`,
      icon: Folder,
      color: 'slate',
    },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      {/* Header */}
      <div className="mb-8">
        {/* Back button and actions */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/${orgSlug}/projects`}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
              "text-white/60 hover:text-white hover:bg-white/[0.05]"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Projects</span>
          </Link>

          <div className="flex items-center gap-2">
            <button className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
              "bg-white/[0.03] border border-white/[0.06] text-white/60",
              "hover:bg-white/[0.06] hover:text-white"
            )}>
              <Share className="h-4 w-4" />
              <span className="text-sm">Share</span>
            </button>
            <button className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
              "bg-white/[0.03] border border-white/[0.06] text-white/60",
              "hover:bg-white/[0.06] hover:text-white"
            )}>
              <Download className="h-4 w-4" />
              <span className="text-sm">Export</span>
            </button>
            <Link
              href={`/${orgSlug}/projects/${projectId}/settings`}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                "bg-amber-500/10 border border-amber-500/20 text-amber-400",
                "hover:bg-amber-500/20"
              )}
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
          </div>
        </div>

        {/* Project Title & Status */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("p-2 rounded-lg", colors.bg)}>
                <Building2 className={cn("h-5 w-5", colors.text)} />
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium uppercase border",
                  colors.bg, colors.text, colors.border
                )}>
                  {health.replace('-', ' ')}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-white/[0.05] text-white/60">
                  {statusLabels[project.status || 'planning']}
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
            <div className="flex items-center gap-4 text-sm text-white/50">
              {project.number && <span>Project #{project.number}</span>}
              {project.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{project.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Completion Ring */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="8"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${completion * 2.26} 226`}
                  className={colors.text}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{completion}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-white/40">Completion</p>
              <p className="text-lg font-semibold text-white">
                {daysRemaining > 0 ? `${daysRemaining} days left` : daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : 'Due today'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 p-4 rounded-xl",
        "bg-white/[0.02] border border-white/[0.06]"
      )}>
        <MetricItem
          icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
          label="Budget"
          value={budget > 0 ? `$${budget.toFixed(1)}M` : 'Not set'}
        />
        <MetricItem
          icon={<TrendingUp className="h-4 w-4 text-amber-400" />}
          label="Spent"
          value={spent > 0 ? `$${spent.toFixed(2)}M` : '$0.00M'}
          subtext={budget > 0 ? `${((spent / budget) * 100).toFixed(0)}% of budget` : undefined}
        />
        <MetricItem
          icon={<Calendar className="h-4 w-4 text-blue-400" />}
          label="Duration"
          value={duration > 0 ? `${duration} months` : 'Not set'}
        />
        <MetricItem
          icon={<BarChart3 className="h-4 w-4 text-purple-400" />}
          label="Progress"
          value={`${completion}%`}
        />
        <MetricItem
          icon={<FileText className="h-4 w-4 text-cyan-400" />}
          label="Open RFIs"
          value={rfiCount.toString()}
        />
        <MetricItem
          icon={<Users className="h-4 w-4 text-pink-400" />}
          label="Team Size"
          value={teamSize > 0 ? `${teamSize}` : '0'}
        />
      </div>

      {/* Project Details Row */}
      <div className={cn(
        "grid md:grid-cols-2 gap-4 mb-8 p-4 rounded-xl",
        "bg-white/[0.02] border border-white/[0.06]"
      )}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white/[0.05]">
            <MapPin className="h-4 w-4 text-white/40" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/60">Location</p>
            <p className="text-sm text-white">{project.address || 'No address set'}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-white/[0.05]">
            <Calendar className="h-4 w-4 text-white/40" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/60">Timeline</p>
            <p className="text-sm text-white">
              {project.start_date && project.end_date ? (
                <>
                  {new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </>
              ) : (
                'Not set'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Project Management Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Project Management</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "group p-5 rounded-xl transition-all duration-200",
                  "bg-white/[0.02] border border-white/[0.06]",
                  "hover:bg-white/[0.04] hover:border-white/[0.12]"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn(
                    "p-2.5 rounded-lg transition-colors",
                    item.color === 'emerald' && "bg-emerald-500/10 group-hover:bg-emerald-500/20",
                    item.color === 'blue' && "bg-blue-500/10 group-hover:bg-blue-500/20",
                    item.color === 'purple' && "bg-purple-500/10 group-hover:bg-purple-500/20",
                    item.color === 'amber' && "bg-amber-500/10 group-hover:bg-amber-500/20",
                    item.color === 'cyan' && "bg-cyan-500/10 group-hover:bg-cyan-500/20",
                    item.color === 'pink' && "bg-pink-500/10 group-hover:bg-pink-500/20",
                    item.color === 'orange' && "bg-orange-500/10 group-hover:bg-orange-500/20",
                    item.color === 'slate' && "bg-slate-500/10 group-hover:bg-slate-500/20",
                  )}>
                    <Icon className={cn(
                      "h-5 w-5",
                      item.color === 'emerald' && "text-emerald-400",
                      item.color === 'blue' && "text-blue-400",
                      item.color === 'purple' && "text-purple-400",
                      item.color === 'amber' && "text-amber-400",
                      item.color === 'cyan' && "text-cyan-400",
                      item.color === 'pink' && "text-pink-400",
                      item.color === 'orange' && "text-orange-400",
                      item.color === 'slate' && "text-slate-400",
                    )} />
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/40 transition-colors" />
                </div>
                <h3 className="font-medium text-white mb-1 group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-white/40 mb-2">{item.description}</p>
                {item.count && (
                  <span className="text-xs text-white/60 font-medium">{item.count}</span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className={cn(
        "flex flex-wrap gap-3 p-4 rounded-xl",
        "bg-white/[0.02] border border-white/[0.06]"
      )}>
        <Link
          href={`/${orgSlug}/projects/${projectId}/rfis/new`}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
            "bg-blue-500/10 border border-blue-500/20 text-blue-400",
            "hover:bg-blue-500/20"
          )}
        >
          <FileText className="h-4 w-4" />
          <span className="text-sm font-medium">New RFI</span>
        </Link>
        <Link
          href={`/${orgSlug}/projects/${projectId}/daily-reports/new`}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
            "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400",
            "hover:bg-cyan-500/20"
          )}
        >
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">New Daily Report</span>
        </Link>
        <Link
          href={`/${orgSlug}/projects/${projectId}/costs/new`}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
            "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
            "hover:bg-emerald-500/20"
          )}
        >
          <DollarSign className="h-4 w-4" />
          <span className="text-sm font-medium">Add Cost</span>
        </Link>
        <Link
          href={`/${orgSlug}/projects/${projectId}/change-orders/new`}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
            "bg-amber-500/10 border border-amber-500/20 text-amber-400",
            "hover:bg-amber-500/20"
          )}
        >
          <ClipboardList className="h-4 w-4" />
          <span className="text-sm font-medium">New Change Order</span>
        </Link>
      </div>
    </div>
  )
}

// MetricItem Component
function MetricItem({
  icon,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subtext?: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs text-white/40">{label}</p>
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
      {subtext && (
        <p className="text-xs text-white/40">{subtext}</p>
      )}
    </div>
  )
}
