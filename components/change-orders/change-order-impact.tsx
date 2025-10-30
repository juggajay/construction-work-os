/**
 * Change Order Impact Component
 *
 * Visual impact analysis showing cost impact, schedule impact, and approval chain
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Check, Clock, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Approval {
  id: string
  role: string
  name: string
  status: 'approved' | 'pending' | 'not_started'
  date?: string
}

interface ChangeOrderImpactProps {
  costImpact: number
  originalBudget: number
  scheduleImpact: number
  approvals: Approval[]
  className?: string
}

export function ChangeOrderImpact({
  costImpact,
  originalBudget,
  scheduleImpact,
  approvals,
  className,
}: ChangeOrderImpactProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount))
  }

  // Calculate cost impact percentage (capped at 100%)
  const costImpactPercent = Math.min(
    (Math.abs(costImpact) / originalBudget) * 100,
    100
  )

  // Calculate schedule impact percentage (based on 30 days as baseline)
  const scheduleImpactPercent = Math.min(
    (Math.abs(scheduleImpact) / 30) * 100,
    100
  )

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Impact Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cost Impact */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Cost Impact</span>
            <span
              className={cn(
                'font-bold text-base',
                costImpact > 0 ? 'text-red-600' : costImpact < 0 ? 'text-green-600' : ''
              )}
            >
              {costImpact > 0 ? '+' : costImpact < 0 ? '-' : ''}
              {formatCurrency(costImpact)}
            </span>
          </div>
          <Progress
            value={costImpactPercent}
            className={cn(
              'h-2',
              costImpact > 0 ? '[&>div]:bg-red-600' : costImpact < 0 ? '[&>div]:bg-green-600' : ''
            )}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {costImpactPercent.toFixed(1)}% of original budget
          </p>
        </div>

        {/* Schedule Impact */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Schedule Impact</span>
            <span
              className={cn(
                'font-bold text-base',
                scheduleImpact > 0
                  ? 'text-red-600'
                  : scheduleImpact < 0
                  ? 'text-green-600'
                  : ''
              )}
            >
              {scheduleImpact > 0 ? '+' : ''}
              {scheduleImpact} days
            </span>
          </div>
          <Progress
            value={scheduleImpactPercent}
            className={cn(
              'h-2',
              scheduleImpact > 0
                ? '[&>div]:bg-red-600'
                : scheduleImpact < 0
                ? '[&>div]:bg-green-600'
                : ''
            )}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {scheduleImpact === 0
              ? 'No schedule impact'
              : scheduleImpact > 0
              ? 'Schedule delay'
              : 'Accelerated schedule'}
          </p>
        </div>

        {/* Approval Chain */}
        {approvals && approvals.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-3">Approval Chain</p>
            <div className="space-y-3">
              {approvals.map((approval) => (
                <div key={approval.id} className="flex items-center gap-3">
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                      approval.status === 'approved'
                        ? 'bg-green-100 text-green-600'
                        : approval.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {approval.status === 'approved' ? (
                      <Check className="h-4 w-4" />
                    ) : approval.status === 'pending' ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{approval.role}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {approval.name}
                    </p>
                  </div>
                  {approval.date && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {approval.date}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
