'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ConstructionBadge } from '@/components/ui/construction-badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { MapPin, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'
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

const statusColors = {
  planning: 'border-l-gray-500',
  active: 'border-l-green-500',
  on_hold: 'border-l-yellow-500',
  archived: 'border-l-blue-500',
}

export function ProjectCard({ project, orgSlug }: ProjectCardProps) {
  return (
    <Link href={`/${orgSlug}/projects/${project.id}`}>
      <Card
        className={cn(
          'hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer border-l-4 h-full',
          statusColors[project.status]
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl truncate">{project.name}</CardTitle>
              <CardDescription>
                Project #{project.number}
              </CardDescription>
            </div>
            <ConstructionBadge status={project.health} className="ml-2 flex-shrink-0">
              {project.health}
            </ConstructionBadge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Location */}
          {project.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{project.address}</span>
            </div>
          )}

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{project.completion}%</span>
            </div>
            <Progress value={project.completion} className="h-2" />
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="font-bold">
                {project.budget ? `$${project.budget.toFixed(1)}M` : 'N/A'}
              </p>
              {project.budgetVariance !== undefined && (
                <p
                  className={cn(
                    'text-xs flex items-center gap-1',
                    project.budgetStatus === 'over' ? 'text-red-600' : 'text-green-600'
                  )}
                >
                  {project.budgetStatus === 'over' ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(project.budgetVariance)}%
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Schedule</p>
              <p className="font-bold">
                {project.daysRemaining !== undefined ? `${project.daysRemaining}d` : 'N/A'}
              </p>
              {project.scheduleStatus && (
                <p
                  className={cn(
                    'text-xs capitalize',
                    project.scheduleStatus === 'behind'
                      ? 'text-red-600'
                      : project.scheduleStatus === 'ahead'
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                  )}
                >
                  {project.scheduleStatus}
                </p>
              )}
            </div>
          </div>

          {/* Team Avatars */}
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {project.team && project.team.length > 0 ? (
                <>
                  {project.team.slice(0, 4).map((member) => (
                    <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="text-xs">{member.initials}</AvatarFallback>
                    </Avatar>
                  ))}
                  {project.team.length > 4 && (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                      +{project.team.length - 4}
                    </div>
                  )}
                </>
              ) : (
                <span className="text-xs text-muted-foreground">No team members</span>
              )}
            </div>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
