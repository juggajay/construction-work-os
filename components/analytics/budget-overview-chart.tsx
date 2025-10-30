'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BudgetData {
  budget: number
  spent: number
  committed: number
  remaining: number
}

interface BudgetOverviewChartProps {
  data: BudgetData
  projectName?: string
  className?: string
}

export function BudgetOverviewChart({ data, projectName, className }: BudgetOverviewChartProps) {
  // Safe percentage calculations to prevent division by zero
  const spentPercentage = data.budget > 0 ? (data.spent / data.budget) * 100 : 0
  const committedPercentage = data.budget > 0 ? (data.committed / data.budget) * 100 : 0
  const remainingPercentage = data.budget > 0 ? (data.remaining / data.budget) * 100 : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-amber-50 p-2">
            <DollarSign className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base font-semibold">Budget Overview</CardTitle>
            {projectName && <p className="text-sm text-neutral-500 mt-0.5">{projectName}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Show message if no budget allocated */}
        {data.budget === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">No budget allocated for this project</p>
          </div>
        ) : (
          <>
            {/* Visual Budget Bar */}
            <div className="mb-6">
              <div className="h-8 w-full bg-neutral-100 rounded-lg overflow-hidden flex">
            <div
              className="bg-red-500 flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${spentPercentage}%` }}
            >
              {spentPercentage > 10 && `${spentPercentage.toFixed(0)}%`}
            </div>
            <div
              className="bg-amber-500 flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${committedPercentage}%` }}
            >
              {committedPercentage > 10 && `${committedPercentage.toFixed(0)}%`}
            </div>
            <div
              className="bg-green-500 flex items-center justify-center text-xs font-medium text-white"
              style={{ width: `${remainingPercentage}%` }}
            >
              {remainingPercentage > 10 && `${remainingPercentage.toFixed(0)}%`}
            </div>
          </div>

          <div className="flex gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-red-500" />
              <span className="text-neutral-600">Spent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-amber-500" />
              <span className="text-neutral-600">Committed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded bg-green-500" />
              <span className="text-neutral-600">Remaining</span>
            </div>
          </div>
        </div>

        {/* Budget Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-neutral-100">
            <span className="text-sm font-medium text-neutral-700">Total Budget</span>
            <span className="text-sm font-bold text-neutral-900">{formatCurrency(data.budget)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Spent</span>
            <span className="text-sm font-semibold text-red-600">{formatCurrency(data.spent)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Committed</span>
            <span className="text-sm font-semibold text-amber-600">
              {formatCurrency(data.committed)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Remaining</span>
            <span className="text-sm font-semibold text-green-600">
              {formatCurrency(data.remaining)}
            </span>
          </div>

          {data.remaining < 0 && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-xs font-medium text-red-800">
                ⚠️ Budget Overrun: {formatCurrency(Math.abs(data.remaining))} over budget
              </p>
            </div>
          )}
        </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
