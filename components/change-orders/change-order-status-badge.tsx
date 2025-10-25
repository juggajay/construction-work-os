/**
 * Change Order Status Badge Component
 *
 * Displays the current status of a change order with appropriate color coding
 */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ChangeOrderStatus } from '@/lib/types'

interface ChangeOrderStatusBadgeProps {
  status: ChangeOrderStatus
  className?: string
}

const statusConfig: Record<
  ChangeOrderStatus,
  { label: string; variant: string; className: string }
> = {
  contemplated: {
    label: 'Contemplated',
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  },
  potential: {
    label: 'PCO',
    variant: 'default',
    className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
  },
  proposed: {
    label: 'COR',
    variant: 'default',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  },
  approved: {
    label: 'Approved',
    variant: 'default',
    className: 'bg-green-100 text-green-700 hover:bg-green-200',
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive',
    className: 'bg-red-50 text-red-700 hover:bg-red-100',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive',
    className: 'bg-red-50 text-red-700 hover:bg-red-100',
  },
  invoiced: {
    label: 'Invoiced',
    variant: 'outline',
    className: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
  },
}

export function ChangeOrderStatusBadge({
  status,
  className,
}: ChangeOrderStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.contemplated

  return (
    <Badge
      variant={config!.variant as any}
      className={cn(config!.className, className)}
    >
      {config!.label}
    </Badge>
  )
}

/**
 * Utility function to format status for display
 */
export function formatChangeOrderStatus(status: string): string {
  return statusConfig[status as ChangeOrderStatus]?.label || status
}
