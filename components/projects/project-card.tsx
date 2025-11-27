'use client'

/**
 * Project Card Component
 * Industrial Luxury aesthetic
 */

import { memo } from 'react';
import { MapPin, ArrowRight, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export interface ProjectCardData {
  id: string
  name: string
  number: string
  address?: string
  status: 'planning' | 'active' | 'on_hold' | 'archived'
  health: 'on-track' | 'at-risk' | 'delayed' | 'completed'
  completion: number
  budget?: number
  budgetVariance?: number
  budgetStatus?: 'over' | 'under'
  daysRemaining?: number
  scheduleStatus?: 'on-track' | 'behind' | 'ahead'
  team?: Array<{
    id: string
    name: string
    avatar?: string
    initials: string
  }>
}

interface ProjectCardProps {
  project: ProjectCardData
  orgSlug: string
}

const statusConfig = {
  planning: { label: 'Planning', color: 'blue' },
  active: { label: 'Active', color: 'emerald' },
  on_hold: { label: 'On Hold', color: 'amber' },
  archived: { label: 'Archived', color: 'gray' },
}

const healthConfig = {
  'on-track': { label: 'On Track', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-400', borderClass: 'border-emerald-500/20' },
  'at-risk': { label: 'At Risk', bgClass: 'bg-amber-500/10', textClass: 'text-amber-400', borderClass: 'border-amber-500/20' },
  'delayed': { label: 'Delayed', bgClass: 'bg-red-500/10', textClass: 'text-red-400', borderClass: 'border-red-500/20' },
  'completed': { label: 'Completed', bgClass: 'bg-blue-500/10', textClass: 'text-blue-400', borderClass: 'border-blue-500/20' },
}

export const ProjectCard = memo(function ProjectCard({ project, orgSlug }: ProjectCardProps) {
  const status = statusConfig[project.status] || statusConfig.active
  const health = healthConfig[project.health] || healthConfig['on-track']

  return (
    <Link href={`/${orgSlug}/projects/${project.id}`}>
      <div
        className={cn(
          'group relative rounded-xl overflow-hidden h-full',
          'bg-white/[0.02] border border-white/[0.06]',
          'hover:border-white/[0.12] hover:bg-white/[0.04]',
          'transition-all duration-300 cursor-pointer'
        )}
      >
        {/* Top accent line based on status */}
        <div className={cn(
          "absolute top-0 left-0 w-full h-0.5",
          status.color === 'emerald' && "bg-gradient-to-r from-emerald-500 to-emerald-600",
          status.color === 'blue' && "bg-gradient-to-r from-blue-500 to-blue-600",
          status.color === 'amber' && "bg-gradient-to-r from-amber-500 to-amber-600",
          status.color === 'gray' && "bg-gradient-to-r from-gray-500 to-gray-600"
        )} />

        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate group-hover:text-amber-400 transition-colors">
                {project.name}
              </h3>
              <p className="text-sm text-white/40 mt-0.5">
                Project #{project.number}
              </p>
            </div>
            <span className={cn(
              "px-2.5 py-1 text-xs font-medium rounded-lg shrink-0",
              health.bgClass,
              health.textClass
            )}>
              {health.label}
            </span>
          </div>

          {/* Location */}
          {project.address && (
            <div className="flex items-center gap-2 text-sm text-white/50">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{project.address}</span>
            </div>
          )}

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/40">Completion</span>
              <span className="font-medium text-white">{project.completion}%</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  project.completion >= 100
                    ? "bg-emerald-500"
                    : project.completion >= 75
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-amber-500 to-amber-600"
                )}
                style={{ width: `${Math.min(project.completion, 100)}%` }}
              />
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/[0.06]">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Budget</p>
              <p className="font-bold text-white mt-1">
                {project.budget ? `$${project.budget.toFixed(1)}M` : 'N/A'}
              </p>
              {project.budgetVariance !== undefined && (
                <p
                  className={cn(
                    'text-xs flex items-center gap-1 mt-0.5',
                    project.budgetStatus === 'over' ? 'text-red-400' : 'text-emerald-400'
                  )}
                >
                  {project.budgetStatus === 'over' ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(project.budgetVariance)}% {project.budgetStatus}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Schedule</p>
              <p className="font-bold text-white mt-1">
                {project.daysRemaining !== undefined
                  ? project.daysRemaining < 0
                    ? `${Math.abs(project.daysRemaining)}d overdue`
                    : `${project.daysRemaining}d left`
                  : 'N/A'}
              </p>
              {project.scheduleStatus && (
                <p
                  className={cn(
                    'text-xs capitalize mt-0.5',
                    project.scheduleStatus === 'behind'
                      ? 'text-red-400'
                      : project.scheduleStatus === 'ahead'
                      ? 'text-emerald-400'
                      : 'text-white/40'
                  )}
                >
                  {project.scheduleStatus === 'on-track' ? 'On schedule' : project.scheduleStatus}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            {/* Status Badge */}
            <span className={cn(
              "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded",
              status.color === 'emerald' && "bg-emerald-500/10 text-emerald-400",
              status.color === 'blue' && "bg-blue-500/10 text-blue-400",
              status.color === 'amber' && "bg-amber-500/10 text-amber-400",
              status.color === 'gray' && "bg-white/[0.05] text-white/40"
            )}>
              {status.label}
            </span>

            {/* Arrow indicator */}
            <div className="flex items-center gap-1 text-white/30 group-hover:text-amber-400 transition-colors">
              <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">View</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
});
