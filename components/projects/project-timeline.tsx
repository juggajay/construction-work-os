'use client'

import { Calendar, Building2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ProjectCardData } from './project-card'

interface ProjectTimelineProps {
  projects: ProjectCardData[]
  orgSlug: string
}

interface TimelineProject extends ProjectCardData {
  startDate?: Date
  endDate?: Date
}

const healthColors = {
  'on-track': { bg: 'from-emerald-500 to-emerald-600', text: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  'at-risk': { bg: 'from-amber-500 to-amber-600', text: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  'delayed': { bg: 'from-red-500 to-red-600', text: 'text-red-400', badge: 'bg-red-500/15 text-red-400 border-red-500/30' },
  'completed': { bg: 'from-blue-500 to-blue-600', text: 'text-blue-400', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
}

const statusLabels: Record<string, string> = {
  'active': 'Active',
  'planning': 'Planning',
  'on_hold': 'On Hold',
  'archived': 'Archived',
}

// Determine the best time interval for the timeline based on total span
function getTimeInterval(totalMonths: number): 'month' | 'quarter' | 'year' {
  if (totalMonths <= 12) return 'month'
  if (totalMonths <= 48) return 'quarter'
  return 'year'
}

// Generate time markers based on interval
function generateTimeMarkers(minDate: Date, maxDate: Date, interval: 'month' | 'quarter' | 'year'): Date[] {
  const markers: Date[] = []
  const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1)

  // Align to interval start
  if (interval === 'quarter') {
    current.setMonth(Math.floor(current.getMonth() / 3) * 3)
  } else if (interval === 'year') {
    current.setMonth(0)
  }

  while (current <= maxDate) {
    markers.push(new Date(current))
    if (interval === 'month') {
      current.setMonth(current.getMonth() + 1)
    } else if (interval === 'quarter') {
      current.setMonth(current.getMonth() + 3)
    } else {
      current.setFullYear(current.getFullYear() + 1)
    }
  }

  return markers
}

// Format marker label based on interval
function formatMarkerLabel(date: Date, interval: 'month' | 'quarter' | 'year'): string {
  if (interval === 'year') {
    return date.getFullYear().toString()
  }
  if (interval === 'quarter') {
    const quarter = Math.floor(date.getMonth() / 3) + 1
    return `Q${quarter} ${date.getFullYear()}`
  }
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export function ProjectTimeline({ projects, orgSlug }: ProjectTimelineProps) {
  // For demo purposes, generate dates if not available
  const timelineProjects: TimelineProject[] = projects.map((project, index) => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - (index * 30))

    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + (project.daysRemaining || 90))

    return {
      ...project,
      startDate,
      endDate,
    }
  })

  if (timelineProjects.length === 0) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-16 rounded-xl",
        "border-2 border-dashed border-white/[0.06]",
        "text-white/30"
      )}>
        <Building2 className="h-10 w-10 mb-3" />
        <p className="text-sm">No projects to display</p>
      </div>
    )
  }

  // Calculate timeline bounds
  const allDates = timelineProjects.flatMap((p) => [p.startDate!, p.endDate!])
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())))
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) || 1

  // Calculate total months to determine appropriate interval
  const totalMonths = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + (maxDate.getMonth() - minDate.getMonth())
  const interval = getTimeInterval(totalMonths)
  const markers = generateTimeMarkers(minDate, maxDate, interval)

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <div className={cn(
        "sticky top-0 z-10 p-4 rounded-xl",
        "bg-[#111] border border-white/[0.06]"
      )}>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Calendar className="h-4 w-4 text-amber-400" />
          </div>
          <h3 className="font-semibold text-white">Project Timeline</h3>
          <span className="ml-auto text-xs text-white/40">
            {minDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {maxDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Time markers */}
        <div className="relative h-10 rounded-lg bg-white/[0.02] border border-white/[0.06] overflow-hidden">
          <div className="absolute inset-0 flex">
            {markers.map((marker, index) => {
              const markerStart = marker.getTime()
              // Calculate next marker or end date
              const nextMarker = markers[index + 1]
              const markerEnd = nextMarker
                ? nextMarker.getTime()
                : maxDate.getTime()

              const daysInPeriod = Math.ceil((markerEnd - markerStart) / (1000 * 60 * 60 * 24))
              const widthPercent = Math.max((daysInPeriod / totalDays) * 100, 0)

              return (
                <div
                  key={index}
                  className="flex-shrink-0 border-r border-white/[0.06] px-2 py-2 overflow-hidden"
                  style={{ width: `${widthPercent}%`, minWidth: '60px' }}
                >
                  <div className="text-xs font-medium text-white/60 whitespace-nowrap truncate">
                    {formatMarkerLabel(marker, interval)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="space-y-3">
        {timelineProjects.map((project) => {
          const projectStart = project.startDate!.getTime()
          const projectEnd = project.endDate!.getTime()
          const projectDuration = Math.ceil((projectEnd - projectStart) / (1000 * 60 * 60 * 24))

          const startOffset =
            ((projectStart - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100
          const widthPercent = (projectDuration / totalDays) * 100

          const colors = healthColors[project.health]

          return (
            <Link key={project.id} href={`/${orgSlug}/projects/${project.id}`}>
              <div className={cn(
                "p-4 rounded-xl cursor-pointer transition-all duration-200",
                "bg-white/[0.02] border border-white/[0.06]",
                "hover:bg-white/[0.04] hover:border-white/[0.1]",
                "group"
              )}>
                <div className="flex items-start gap-4">
                  {/* Project Info */}
                  <div className="flex-shrink-0 w-56 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white text-sm line-clamp-1 group-hover:text-amber-400 transition-colors">
                        {project.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-medium uppercase border",
                        colors.badge
                      )}>
                        {project.health.replace('-', ' ')}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.05] text-white/50">
                        {statusLabels[project.status] || project.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <span>{project.number}</span>
                      <span>•</span>
                      <span>{project.startDate!.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {project.endDate!.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Timeline Bar */}
                  <div className="flex-1 relative h-14">
                    <div className="absolute inset-y-0 left-0 right-0">
                      <div
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 h-10 rounded-lg transition-all overflow-hidden",
                          `bg-gradient-to-r ${colors.bg}`
                        )}
                        style={{
                          left: `${startOffset}%`,
                          width: `${Math.max(widthPercent, 5)}%`, // Minimum 5% width for visibility
                        }}
                      >
                        {/* Completion overlay */}
                        <div
                          className="absolute inset-0 bg-white/20"
                          style={{ width: `${project.completion}%` }}
                        />
                        {/* Completion text */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-semibold text-white drop-shadow-sm">
                            {project.completion}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="flex-shrink-0 w-20 text-right">
                    {project.budget && (
                      <div className="text-sm font-medium text-white">
                        ${project.budget.toFixed(1)}M
                      </div>
                    )}
                    {project.daysRemaining !== undefined && (
                      <div className={cn(
                        "text-xs",
                        project.daysRemaining < 0 ? "text-red-400" :
                        project.daysRemaining < 30 ? "text-amber-400" : "text-white/40"
                      )}>
                        {project.daysRemaining < 0
                          ? `${Math.abs(project.daysRemaining)}d overdue`
                          : `${project.daysRemaining}d left`
                        }
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
