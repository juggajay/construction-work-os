'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ConstructionBadge } from '@/components/ui/construction-badge'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'
import Link from 'next/link'
import { ProjectCardData } from './project-card'

interface ProjectTimelineProps {
  projects: ProjectCardData[]
  orgSlug: string
}

interface TimelineProject extends ProjectCardData {
  startDate?: Date
  endDate?: Date
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

  // Calculate timeline bounds
  const allDates = timelineProjects.flatMap((p) => [p.startDate!, p.endDate!])
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())))
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))

  // Generate month markers
  const months: Date[] = []
  const currentMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
  while (currentMonth <= maxDate) {
    months.push(new Date(currentMonth))
    currentMonth.setMonth(currentMonth.getMonth() + 1)
  }

  return (
    <div className="space-y-4">
      {/* Timeline Header - Months */}
      <div className="sticky top-0 z-10 bg-background pb-2">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Project Timeline</h3>
        </div>
        <div className="relative h-12 bg-muted/30 rounded-lg border">
          <div className="absolute inset-0 flex">
            {months.map((month, index) => {
              const monthStart = month.getTime()
              const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0).getTime()
              const daysInMonth = Math.ceil((monthEnd - monthStart) / (1000 * 60 * 60 * 24))
              const widthPercent = (daysInMonth / totalDays) * 100

              return (
                <div
                  key={index}
                  className="flex-shrink-0 border-r border-border px-2 py-2"
                  style={{ width: `${widthPercent}%` }}
                >
                  <div className="text-xs font-medium">
                    {month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
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

          return (
            <Link key={project.id} href={`/${orgSlug}/projects/${project.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Project Info */}
                    <div className="flex-shrink-0 w-64 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm line-clamp-1">{project.name}</h4>
                        <ConstructionBadge status={project.health} className="flex-shrink-0">
                          {project.health}
                        </ConstructionBadge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {project.status}
                        </Badge>
                        <span>{project.number}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {project.startDate!.toLocaleDateString()} -{' '}
                        {project.endDate!.toLocaleDateString()}
                      </div>
                    </div>

                    {/* Timeline Bar */}
                    <div className="flex-1 relative h-12">
                      <div className="absolute inset-y-0 left-0 right-0">
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-8 rounded-md transition-all"
                          style={{
                            left: `${startOffset}%`,
                            width: `${widthPercent}%`,
                            background:
                              project.health === 'on-track'
                                ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                                : project.health === 'at-risk'
                                ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                                : project.health === 'delayed'
                                ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                                : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                          }}
                        >
                          <div className="absolute inset-0 flex items-center px-2">
                            <div
                              className="h-full bg-white/30 rounded-l-md transition-all"
                              style={{ width: `${project.completion}%` }}
                            />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {project.completion}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {timelineProjects.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">No projects to display</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
