'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

type ScheduleStatus = 'upcoming' | 'today' | 'overdue'

interface ScheduleItem {
  id: string
  date: string
  project: string
  title: string
  status: ScheduleStatus
  type: 'deadline' | 'milestone' | 'meeting' | 'inspection'
}

interface UpcomingScheduleProps {
  items?: ScheduleItem[]
  className?: string
}

const statusConfig: Record<ScheduleStatus, { color: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
  today: {
    color: 'border-l-warning',
    variant: 'default',
  },
  upcoming: {
    color: 'border-l-info',
    variant: 'secondary',
  },
  overdue: {
    color: 'border-l-danger',
    variant: 'destructive',
  },
}

const typeConfig: Record<
  ScheduleItem['type'],
  { label: string; color: string }
> = {
  deadline: {
    label: 'Deadline',
    color: 'text-danger',
  },
  milestone: {
    label: 'Milestone',
    color: 'text-success',
  },
  meeting: {
    label: 'Meeting',
    color: 'text-info',
  },
  inspection: {
    label: 'Inspection',
    color: 'text-warning',
  },
}

const defaultItems: ScheduleItem[] = [
  {
    id: '1',
    date: 'Today, 2:00 PM',
    project: 'Downtown Office Tower',
    title: 'City inspection - structural',
    status: 'today',
    type: 'inspection',
  },
  {
    id: '2',
    date: 'Tomorrow',
    project: 'Riverside Apartments',
    title: 'RFI response deadline',
    status: 'upcoming',
    type: 'deadline',
  },
  {
    id: '3',
    date: 'Oct 31',
    project: 'Tech Campus Phase 2',
    title: 'Foundation milestone completion',
    status: 'upcoming',
    type: 'milestone',
  },
  {
    id: '4',
    date: 'Nov 2',
    project: 'Healthcare Center',
    title: 'Weekly coordination meeting',
    status: 'upcoming',
    type: 'meeting',
  },
  {
    id: '5',
    date: 'Nov 5',
    project: 'Shopping Mall Renovation',
    title: 'MEP rough-in deadline',
    status: 'upcoming',
    type: 'deadline',
  },
]

export function UpcomingSchedule({
  items = defaultItems,
  className,
}: UpcomingScheduleProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Upcoming Schedule</CardTitle>
        <CardDescription>Deadlines and milestones to watch</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const statusStyle = statusConfig[item.status]
            const typeStyle = typeConfig[item.type]

            return (
              <div
                key={item.id}
                className={cn(
                  'p-4 rounded-lg border-l-4 hover:bg-muted/50 transition-colors cursor-pointer',
                  statusStyle.color
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium">{item.date}</span>
                    </div>
                    <h4 className="font-medium text-sm leading-tight mb-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.project}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    <Badge variant={statusStyle.variant} className="text-xs">
                      {item.status === 'today'
                        ? 'Today'
                        : item.status === 'overdue'
                        ? 'Overdue'
                        : 'Upcoming'}
                    </Badge>
                    <span className={cn('text-xs font-medium', typeStyle.color)}>
                      {typeStyle.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
