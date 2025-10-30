'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConstructionBadge } from '@/components/ui/construction-badge'
import { Progress } from '@/components/ui/progress'
import { MapPin } from 'lucide-react'
import Link from 'next/link'
import { ProjectCardData } from './project-card'

interface ProjectKanbanProps {
  projects: ProjectCardData[]
  orgSlug: string
}

const columns = [
  { id: 'planning', title: 'Planning', status: 'planning' as const },
  { id: 'active', title: 'Active', status: 'active' as const },
  { id: 'on_hold', title: 'On Hold', status: 'on_hold' as const },
  { id: 'archived', title: 'Archived', status: 'archived' as const },
]

export function ProjectKanban({ projects, orgSlug }: ProjectKanbanProps) {
  const getProjectsByStatus = (status: string) => {
    return projects.filter((p) => p.status === status)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columns.map((column) => {
        const columnProjects = getProjectsByStatus(column.status)

        return (
          <div key={column.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{column.title}</h3>
              <Badge variant="outline">{columnProjects.length}</Badge>
            </div>

            <div className="space-y-3">
              {columnProjects.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex items-center justify-center py-8">
                    <p className="text-sm text-muted-foreground">No projects</p>
                  </CardContent>
                </Card>
              ) : (
                columnProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/${orgSlug}/projects/${project.id}`}
                  >
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base line-clamp-2">
                            {project.name}
                          </CardTitle>
                          <ConstructionBadge status={project.health} className="flex-shrink-0">
                            {project.health}
                          </ConstructionBadge>
                        </div>
                        <p className="text-xs text-muted-foreground">{project.number}</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {project.address && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{project.address}</span>
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{project.completion}%</span>
                          </div>
                          <Progress value={project.completion} className="h-1.5" />
                        </div>

                        {project.budget && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Budget: </span>
                            <span className="font-medium">${project.budget.toFixed(1)}M</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
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
