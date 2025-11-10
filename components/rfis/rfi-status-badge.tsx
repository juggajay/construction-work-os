/**
 * RFI Status Badge Component
 *
 * Displays the current status of an RFI with appropriate color coding
 * ✅ PHASE 3 OPTIMIZATION: Memoized to prevent unnecessary re-renders in tables
 */

import { memo } from 'react';
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type RFIStatus = 'draft' | 'submitted' | 'under_review' | 'answered' | 'closed' | 'cancelled'

interface RFIStatusBadgeProps {
  status: RFIStatus
  isOverdue?: boolean
  className?: string
}

const statusConfig: Record<RFIStatus, { label: string; variant: string; className: string }> = {
  draft: {
    label: 'Draft',
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  },
  submitted: {
    label: 'Submitted',
    variant: 'default',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  },
  under_review: {
    label: 'Under Review',
    variant: 'default',
    className: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  },
  answered: {
    label: 'Answered',
    variant: 'default',
    className: 'bg-green-100 text-green-700 hover:bg-green-200',
  },
  closed: {
    label: 'Closed',
    variant: 'outline',
    className: 'bg-gray-50 text-gray-600 hover:bg-gray-100',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive',
    className: 'bg-red-50 text-red-700 hover:bg-red-100',
  },
}

export const RFIStatusBadge = memo(function RFIStatusBadge({ status, isOverdue = false, className }: RFIStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft

  // Override styling if overdue
  if (isOverdue && (status === 'submitted' || status === 'under_review')) {
    return (
      <div className="flex items-center gap-2">
        <Badge
          variant="destructive"
          className={cn('bg-red-100 text-red-700 hover:bg-red-200', className)}
        >
          <span className="relative mr-2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
          </span>
          {config.label}
        </Badge>
        <Badge variant="destructive" className="text-xs">
          Overdue
        </Badge>
      </div>
    )
  }

  return (
    <Badge variant={config.variant as any} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
});

/**
 * Utility function to format status for display
 */
export function formatRFIStatus(status: string): string {
  return statusConfig[status as RFIStatus]?.label || status
}
