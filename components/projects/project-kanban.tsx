'use client'

import { MapPin, Building2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ProjectCardData } from './project-card'

interface ProjectKanbanProps {
  projects: ProjectCardData[]
  orgSlug: string
}

const columns = [
  { id: 'planning', title: 'Planning', status: 'planning' as const, color: 'blue' },
  { id: 'active', title: 'Active', status: 'active' as const, color: 'emerald' },
  { id: 'on_hold', title: 'On Hold', status: 'on_hold' as const, color: 'amber' },
  { id: 'archived', title: 'Archived', status: 'archived' as const, color: 'gray' },
]

const healthColors = {
  'on-track': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'at-risk': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'delayed': 'bg-red-500/15 text-red-400 border-red-500/30',
  'completed': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
}

export function ProjectKanban({ projects, orgSlug }: ProjectKanbanProps) {
  const getProjectsByStatus = (status: string) => {
    return projects.filter((p) => p.status === status)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => {
        const columnProjects = getProjectsByStatus(column.status)

        return (
          <div key={column.id} className="space-y-3">
            {/* Column Header */}
            <div className={cn(
              "flex items-center justify-between p-3 rounded-xl",
              "bg-white/[0.02] border border-white/[0.06]"
            )}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  column.color === 'blue' && "bg-blue-400",
                  column.color === 'emerald' && "bg-emerald-400",
                  column.color === 'amber' && "bg-amber-400",
                  column.color === 'gray' && "bg-gray-400",
                )} />
                <h3 className="font-medium text-white text-sm">{column.title}</h3>
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded-md text-xs font-medium",
                "bg-white/[0.05] text-white/60"
              )}>
                {columnProjects.length}
              </span>
            </div>

            {/* Column Content */}
            <div className="space-y-3 min-h-[200px]">
              {columnProjects.length === 0 ? (
                <div className={cn(
                  "flex flex-col items-center justify-center py-8 rounded-xl",
                  "border-2 border-dashed border-white/[0.06]",
                  "text-white/30"
                )}>
                  <Building2 className="h-6 w-6 mb-2" />
                  <p className="text-xs">No projects</p>
                </div>
              ) : (
                columnProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/${orgSlug}/projects/${project.id}`}
                  >
                    <div className={cn(
                      "p-4 rounded-xl cursor-pointer transition-all duration-200",
                      "bg-white/[0.02] border border-white/[0.06]",
                      "hover:bg-white/[0.04] hover:border-white/[0.1]",
                      "group"
                    )}>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h4 className="font-medium text-white text-sm line-clamp-2 group-hover:text-amber-400 transition-colors">
                          {project.name}
                        </h4>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-medium uppercase border flex-shrink-0",
                          healthColors[project.health]
                        )}>
                          {project.health.replace('-', ' ')}
                        </span>
                      </div>

                      {/* Project Number */}
                      <p className="text-xs text-white/40 mb-3">{project.number}</p>

                      {/* Address */}
                      {project.address && (
                        <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{project.address}</span>
                        </div>
                      )}

                      {/* Progress */}
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/40">Progress</span>
                          <span className="font-medium text-white">{project.completion}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              project.completion >= 75 ? "bg-emerald-500" :
                              project.completion >= 50 ? "bg-amber-500" :
                              project.completion >= 25 ? "bg-blue-500" : "bg-white/30"
                            )}
                            style={{ width: `${project.completion}%` }}
                          />
                        </div>
                      </div>

                      {/* Budget */}
                      {project.budget && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/40">Budget</span>
                          <span className="font-medium text-white">${project.budget.toFixed(1)}M</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
