'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConstructionBadge } from '@/components/ui/construction-badge'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { ProjectCardData } from './project-card'

interface ProjectTableProps {
  projects: ProjectCardData[]
  orgSlug: string
}

export function ProjectTable({ projects, orgSlug }: ProjectTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Team</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No projects found.
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => (
              <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link href={`/${orgSlug}/projects/${project.id}`} className="block">
                    <div className="space-y-1">
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Project #{project.number}
                      </p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <Badge variant="outline" className="w-fit capitalize">
                      {project.status}
                    </Badge>
                    <ConstructionBadge status={project.health}>
                      {project.health}
                    </ConstructionBadge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2 min-w-[120px]">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{project.completion}%</span>
                    </div>
                    <Progress value={project.completion} className="h-2" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {project.budget ? `$${project.budget.toFixed(1)}M` : 'N/A'}
                    </p>
                    {project.budgetVariance !== undefined && (
                      <p
                        className={`text-xs ${
                          project.budgetStatus === 'over' ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {project.budgetStatus === 'over' ? '↑' : '↓'}{' '}
                        {Math.abs(project.budgetVariance)}%
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {project.daysRemaining !== undefined ? `${project.daysRemaining}d` : 'N/A'}
                    </p>
                    {project.scheduleStatus && (
                      <p
                        className={`text-xs capitalize ${
                          project.scheduleStatus === 'behind'
                            ? 'text-red-600'
                            : project.scheduleStatus === 'ahead'
                            ? 'text-green-600'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {project.scheduleStatus}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {project.team && project.team.length > 0 ? (
                      <>
                        {project.team.slice(0, 3).map((member) => (
                          <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback className="text-xs">{member.initials}</AvatarFallback>
                          </Avatar>
                        ))}
                        {project.team.length > 3 && (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                            +{project.team.length - 3}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
