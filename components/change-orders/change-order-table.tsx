/**
 * Change Order Table Component
 *
 * Displays change orders in a table format with filtering and sorting
 */

'use client'

import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChangeOrderStatusBadge } from '@/components/change-orders/change-order-status-badge'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChangeOrderStatus, ChangeOrderType } from '@/lib/types'

interface ChangeOrder {
  id: string
  number: string
  title: string
  type: ChangeOrderType
  status: ChangeOrderStatus
  cost_impact: string | number
  schedule_impact_days: number | null
  created_at: string
}

interface ChangeOrderTableProps {
  changeOrders: ChangeOrder[]
  orgSlug: string
  projectId: string
  isLoading?: boolean
}

export function ChangeOrderTable({
  changeOrders,
  orgSlug,
  projectId,
  isLoading = false,
}: ChangeOrderTableProps) {
  const router = useRouter()

  const handleRowClick = (changeOrderId: string) => {
    router.push(
      `/${orgSlug}/projects/${projectId}/change-orders/${changeOrderId}`
    )
  }

  // Format currency
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  // Format type for display
  const formatType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CO #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="text-right">Cost Impact</TableHead>
              <TableHead className="text-right">Schedule Impact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  if (changeOrders.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CO #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="text-right">Cost Impact</TableHead>
              <TableHead className="text-right">Schedule Impact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No change orders found. Create your first change order to get started.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>CO #</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead className="text-right">Cost Impact</TableHead>
            <TableHead className="text-right">Schedule Impact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {changeOrders.map((co) => {
            const costImpact = parseFloat(co.cost_impact?.toString() || '0')
            return (
              <TableRow
                key={co.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleRowClick(co.id)}
              >
                <TableCell className="font-medium">{co.number}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatType(co.type)}
                </TableCell>
                <TableCell className="max-w-md truncate">{co.title}</TableCell>
                <TableCell className="text-right font-medium">
                  <span
                    className={cn(
                      costImpact > 0
                        ? 'text-red-600'
                        : costImpact < 0
                        ? 'text-green-600'
                        : ''
                    )}
                  >
                    {costImpact > 0 ? '+' : ''}
                    {formatCurrency(costImpact)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {co.schedule_impact_days ? (
                    <span
                      className={cn(
                        co.schedule_impact_days > 0
                          ? 'text-red-600'
                          : co.schedule_impact_days < 0
                          ? 'text-green-600'
                          : ''
                      )}
                    >
                      {co.schedule_impact_days > 0 ? '+' : ''}
                      {co.schedule_impact_days} days
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <ChangeOrderStatusBadge status={co.status} />
                </TableCell>
                <TableCell>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
