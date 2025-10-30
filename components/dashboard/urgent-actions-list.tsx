'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type Priority = 'high' | 'medium' | 'low'

interface UrgentAction {
  id: string
  title: string
  description: string
  time: string
  priority: Priority
}

interface UrgentActionsListProps {
  actions?: UrgentAction[]
  className?: string
}

const priorityConfig: Record<
  Priority,
  { icon: React.ElementType; color: string; label: string }
> = {
  high: {
    icon: AlertCircle,
    color: 'text-danger',
    label: 'High',
  },
  medium: {
    icon: AlertTriangle,
    color: 'text-warning',
    label: 'Medium',
  },
  low: {
    icon: Info,
    color: 'text-info',
    label: 'Low',
  },
}

const defaultActions: UrgentAction[] = [
  {
    id: '1',
    title: 'RFI Response Overdue',
    description: 'Structural steel clarification needed',
    time: '2 days overdue',
    priority: 'high',
  },
  {
    id: '2',
    title: 'Budget Variance Alert',
    description: 'MEP costs exceeding forecast by 15%',
    time: 'Today',
    priority: 'high',
  },
  {
    id: '3',
    title: 'Submittal Approval Pending',
    description: 'Elevator specifications awaiting review',
    time: '1 day left',
    priority: 'medium',
  },
  {
    id: '4',
    title: 'Change Order Review',
    description: 'Site conditions change order #47',
    time: '3 days left',
    priority: 'medium',
  },
]

export function UrgentActionsList({
  actions = defaultActions,
  className,
}: UrgentActionsListProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {actions.map((action) => {
        const config = priorityConfig[action.priority]
        const Icon = config.icon

        return (
          <div
            key={action.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className={cn('mt-0.5', config.color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-sm leading-tight">
                  {action.title}
                </h4>
                <Badge
                  variant={
                    action.priority === 'high'
                      ? 'destructive'
                      : action.priority === 'medium'
                      ? 'default'
                      : 'secondary'
                  }
                  className="shrink-0 text-xs"
                >
                  {config.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {action.description}
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {action.time}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
