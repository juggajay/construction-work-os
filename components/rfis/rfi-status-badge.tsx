/**
 * RFI Status Badge Component
 *
 * Displays the current status of an RFI with appropriate color coding
 * Industrial Luxury aesthetic
 */

import { memo } from 'react';
import { cn } from '@/lib/utils'

export type RFIStatus = 'draft' | 'submitted' | 'under_review' | 'answered' | 'closed' | 'cancelled'

interface RFIStatusBadgeProps {
  status: RFIStatus
  isOverdue?: boolean
  className?: string
}

const statusConfig: Record<RFIStatus, { label: string; bgClass: string; textClass: string }> = {
  draft: {
    label: 'Draft',
    bgClass: 'bg-white/[0.05]',
    textClass: 'text-white/50',
  },
  submitted: {
    label: 'Submitted',
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-400',
  },
  under_review: {
    label: 'Under Review',
    bgClass: 'bg-purple-500/10',
    textClass: 'text-purple-400',
  },
  answered: {
    label: 'Answered',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
  },
  closed: {
    label: 'Closed',
    bgClass: 'bg-white/[0.03]',
    textClass: 'text-white/40',
  },
  cancelled: {
    label: 'Cancelled',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-400',
  },
}

export const RFIStatusBadge = memo(function RFIStatusBadge({ status, isOverdue = false, className }: RFIStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft

  // Override styling if overdue
  if (isOverdue && (status === 'submitted' || status === 'under_review')) {
    return (
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg",
            "bg-red-500/10 text-red-400",
            className
          )}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400"></span>
          </span>
          {config.label}
        </span>
        <span className={cn(
          "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded",
          "bg-red-500/20 text-red-400"
        )}>
          Overdue
        </span>
      </div>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex px-2.5 py-1 text-xs font-medium rounded-lg",
        config.bgClass,
        config.textClass,
        className
      )}
    >
      {config.label}
    </span>
  )
});

/**
 * Utility function to format status for display
 */
export function formatRFIStatus(status: string): string {
  return statusConfig[status as RFIStatus]?.label || status
}
