'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  CheckCircle,
  XCircle,
  MessageSquare,
  DollarSign,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ActivityType =
  | 'rfi_created'
  | 'submittal_approved'
  | 'submittal_rejected'
  | 'comment_added'
  | 'change_order_created'
  | 'daily_report_submitted'

interface Activity {
  id: string
  type: ActivityType
  user: {
    name: string
    avatar?: string
    initials: string
  }
  description: string
  timestamp: string
  metadata?: {
    project?: string
    status?: string
  }
}

interface ActivityFeedProps {
  activities?: Activity[]
  className?: string
}

const activityConfig: Record<
  ActivityType,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  rfi_created: {
    icon: FileText,
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  submittal_approved: {
    icon: CheckCircle,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  submittal_rejected: {
    icon: XCircle,
    color: 'text-danger',
    bgColor: 'bg-danger/10',
  },
  comment_added: {
    icon: MessageSquare,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  change_order_created: {
    icon: DollarSign,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  daily_report_submitted: {
    icon: ClipboardList,
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
}

const defaultActivities: Activity[] = [
  {
    id: '1',
    type: 'rfi_created',
    user: {
      name: 'Sarah Johnson',
      initials: 'SJ',
    },
    description: 'Created RFI #142 for structural beam clarification',
    timestamp: '5 minutes ago',
    metadata: {
      project: 'Downtown Office Tower',
      status: 'Open',
    },
  },
  {
    id: '2',
    type: 'submittal_approved',
    user: {
      name: 'Mike Chen',
      initials: 'MC',
    },
    description: 'Approved submittal for HVAC equipment specifications',
    timestamp: '1 hour ago',
    metadata: {
      project: 'Riverside Apartments',
      status: 'Approved',
    },
  },
  {
    id: '3',
    type: 'change_order_created',
    user: {
      name: 'Tom Wilson',
      initials: 'TW',
    },
    description: 'Created Change Order #47 for site conditions',
    timestamp: '2 hours ago',
    metadata: {
      project: 'Tech Campus Phase 2',
      status: 'Pending',
    },
  },
  {
    id: '4',
    type: 'comment_added',
    user: {
      name: 'Lisa Martinez',
      initials: 'LM',
    },
    description: 'Added comment to RFI #138',
    timestamp: '3 hours ago',
    metadata: {
      project: 'Healthcare Center',
    },
  },
  {
    id: '5',
    type: 'daily_report_submitted',
    user: {
      name: 'John Davis',
      initials: 'JD',
    },
    description: 'Submitted daily report with 45 workers on site',
    timestamp: '5 hours ago',
    metadata: {
      project: 'Shopping Mall Renovation',
    },
  },
]

export function ActivityFeed({
  activities = defaultActivities,
  className,
}: ActivityFeedProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates across all projects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const config = activityConfig[activity.type]
            const Icon = config.icon

            return (
              <div key={activity.id} className="flex items-start gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center',
                      config.bgColor
                    )}
                  >
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  {index < activities.length - 1 && (
                    <div className="w-px h-full bg-border mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={activity.user.avatar} />
                        <AvatarFallback className="text-xs">
                          {activity.user.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">
                        {activity.user.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {activity.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activity.description}
                  </p>
                  {activity.metadata && (
                    <div className="flex items-center gap-2 mt-2">
                      {activity.metadata.project && (
                        <Badge variant="outline" className="text-xs">
                          {activity.metadata.project}
                        </Badge>
                      )}
                      {activity.metadata.status && (
                        <Badge variant="secondary" className="text-xs">
                          {activity.metadata.status}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
