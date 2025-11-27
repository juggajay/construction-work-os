/**
 * Daily Report Status Badge Component
 * Industrial Luxury aesthetic
 * ✅ PHASE 3 OPTIMIZATION: Memoized to prevent unnecessary re-renders in lists
 */

import { memo } from 'react'
import { cn } from '@/lib/utils'

type DailyReportStatus = 'draft' | 'submitted' | 'approved' | 'archived'

interface DailyReportStatusBadgeProps {
  status: DailyReportStatus
  className?: string
}

const statusConfig: Record<
  DailyReportStatus,
  { label: string; bgClass: string; textClass: string }
> = {
  draft: { label: 'Draft', bgClass: 'bg-white/[0.05]', textClass: 'text-white/50' },
  submitted: { label: 'Submitted', bgClass: 'bg-amber-500/10', textClass: 'text-amber-400' },
  approved: { label: 'Approved', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-400' },
  archived: { label: 'Archived', bgClass: 'bg-white/[0.05]', textClass: 'text-white/30' },
}

export const DailyReportStatusBadge = memo(function DailyReportStatusBadge({
  status,
  className,
}: DailyReportStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex px-2.5 py-1 text-xs font-medium rounded-lg',
        config.bgClass,
        config.textClass,
        className
      )}
    >
      {config.label}
    </span>
  )
})
