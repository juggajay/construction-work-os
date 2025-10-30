'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimelineData {
  startDate: string
  endDate: string
  currentDate: string
  completionPercentage: number
}

interface ProjectTimelineChartProps {
  data: TimelineData
  projectName?: string
  className?: string
}

export function ProjectTimelineChart({ data, projectName, className }: ProjectTimelineChartProps) {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  const current = new Date(data.currentDate)

  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const elapsedDays = Math.ceil((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const remainingDays = totalDays - elapsedDays

  const timeElapsedPercentage = Math.min((elapsedDays / totalDays) * 100, 100)
  const scheduleHealth = data.completionPercentage - timeElapsedPercentage

  const getScheduleStatus = () => {
    if (scheduleHealth > 10) return { label: 'Ahead of Schedule', color: 'text-green-600' }
    if (scheduleHealth < -10) return { label: 'Behind Schedule', color: 'text-red-600' }
    return { label: 'On Schedule', color: 'text-blue-600' }
  }

  const status = getScheduleStatus()

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-amber-50 p-2">
            <Calendar className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base font-semibold">Project Timeline</CardTitle>
            {projectName && <p className="text-sm text-neutral-500 mt-0.5">{projectName}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Timeline Visual */}
        <div className="mb-6">
          {/* Time Progress */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
              <span>Time Elapsed</span>
              <span>{timeElapsedPercentage.toFixed(0)}%</span>
            </div>
            <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-400 rounded-full"
                style={{ width: `${timeElapsedPercentage}%` }}
              />
            </div>
          </div>

          {/* Work Progress */}
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
              <span>Work Completed</span>
              <span>{data.completionPercentage.toFixed(0)}%</span>
            </div>
            <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  scheduleHealth > 10
                    ? 'bg-green-500'
                    : scheduleHealth < -10
                    ? 'bg-red-500'
                    : 'bg-blue-500'
                )}
                style={{ width: `${data.completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Schedule Status */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <Clock className={cn('h-4 w-4', status.color)} />
            <span className={cn('text-sm font-medium', status.color)}>{status.label}</span>
            {scheduleHealth !== 0 && (
              <span className="text-xs text-neutral-500">
                ({Math.abs(scheduleHealth).toFixed(0)}%)
              </span>
            )}
          </div>
        </div>

        {/* Timeline Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Start Date</span>
            <span className="text-sm font-medium text-neutral-900">{formatDate(start)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">End Date</span>
            <span className="text-sm font-medium text-neutral-900">{formatDate(end)}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
            <span className="text-sm text-neutral-600">Days Elapsed</span>
            <span className="text-sm font-semibold text-neutral-900">{elapsedDays} days</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Days Remaining</span>
            <span className="text-sm font-semibold text-neutral-900">{remainingDays} days</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Total Duration</span>
            <span className="text-sm font-semibold text-neutral-900">{totalDays} days</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
