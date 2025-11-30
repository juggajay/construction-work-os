/**
 * Project Health Card - Industrial Luxury Dark Theme
 * Memoized to prevent unnecessary re-renders in project health grids
 */

import { memo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { HealthIndicator } from './health-indicator'
import { FileText, Calendar, Briefcase, Package, Wrench, MoreHorizontal } from 'lucide-react'
import type { ProjectHealth } from '@/lib/actions/project-health'

interface ProjectHealthCardProps {
  project: ProjectHealth
  orgSlug: string
}

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  planning: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  on_hold: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  completed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  archived: 'bg-white/5 text-white/40 border-white/10',
}

export const ProjectHealthCard = memo(function ProjectHealthCard({ project, orgSlug }: ProjectHealthCardProps) {
  const latestInvoiceDate = project.latestInvoiceDate
    ? new Date(project.latestInvoiceDate).toLocaleDateString()
    : 'No invoices'

  const percentSpent = project.percentSpent
  const isOverBudget = percentSpent > 100
  const isWarning = percentSpent > 80 && percentSpent <= 100

  return (
    <Link href={`/${orgSlug}/project-health/${project.id}`}>
      <div className={cn(
        "rounded-xl p-5 cursor-pointer transition-all duration-200",
        "bg-white/[0.02] border border-white/[0.06]",
        "hover:bg-white/[0.04] hover:border-white/[0.1]",
        "group"
      )}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-base truncate group-hover:text-amber-400 transition-colors">
              {project.name}
            </h3>
            <span className={cn(
              "inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-medium uppercase border",
              statusStyles[project.status] || statusStyles.active
            )}>
              {project.status.replace('_', ' ')}
            </span>
          </div>
          <HealthIndicator status={project.healthStatus} percentSpent={project.percentSpent} />
        </div>

        {/* Budget Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-white/50">Budget Usage</span>
            <span className="font-medium text-white">
              ${project.totalSpent.toLocaleString()} / ${project.budget.toLocaleString()}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isOverBudget
                  ? "bg-gradient-to-r from-red-500 to-red-600"
                  : isWarning
                  ? "bg-gradient-to-r from-amber-500 to-amber-600"
                  : "bg-gradient-to-r from-emerald-500 to-emerald-600"
              )}
              style={{ width: `${Math.min(percentSpent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-white/40 mt-1">{percentSpent.toFixed(1)}% spent</p>
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-3.5 w-3.5 text-white/30" />
            <div>
              <p className="text-[10px] text-white/40 uppercase">Labor</p>
              <p className="text-sm font-medium text-white">${project.categoryBreakdown.labor.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-3.5 w-3.5 text-white/30" />
            <div>
              <p className="text-[10px] text-white/40 uppercase">Materials</p>
              <p className="text-sm font-medium text-white">${project.categoryBreakdown.materials.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wrench className="h-3.5 w-3.5 text-white/30" />
            <div>
              <p className="text-[10px] text-white/40 uppercase">Equipment</p>
              <p className="text-sm font-medium text-white">${project.categoryBreakdown.equipment.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MoreHorizontal className="h-3.5 w-3.5 text-white/30" />
            <div>
              <p className="text-[10px] text-white/40 uppercase">Other</p>
              <p className="text-sm font-medium text-white">${project.categoryBreakdown.other.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-sm">
          <div className="flex items-center gap-2 text-white/50">
            <FileText className="h-4 w-4" />
            <span>
              {project.invoiceCount.total} invoice{project.invoiceCount.total !== 1 ? 's' : ''}
            </span>
            <span className="text-emerald-400">({project.invoiceCount.approved} approved)</span>
          </div>
          <div className="flex items-center gap-1 text-white/40">
            <Calendar className="h-3 w-3" />
            <span className="text-xs">{latestInvoiceDate}</span>
          </div>
        </div>
      </div>
    </Link>
  )
})

// Keep backward compatibility with old import name
export { ProjectHealthCard as ProjectCard }
