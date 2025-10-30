'use client'

import { memo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressItem {
  label: string
  value: number
  max: number
  color?: string
}

interface ProgressCardProps {
  title: string
  icon?: LucideIcon
  items: ProgressItem[]
  className?: string
}

export const ProgressCard = memo(function ProgressCard({ title, icon: Icon, items, className }: ProgressCardProps) {
  const getProgressColor = useCallback((percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-amber-500'
    return 'bg-green-500'
  }, [])

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="rounded-lg bg-amber-50 p-2">
              <Icon className="h-4 w-4 text-amber-600" />
            </div>
          )}
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => {
            const percentage = (item.value / item.max) * 100
            const progressColor = item.color || getProgressColor(percentage)

            return (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-600">{item.label}</span>
                  <span className="text-sm font-semibold text-neutral-900">
                    {item.value} / {item.max}
                  </span>
                </div>
                {/* Custom Progress Bar */}
                <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full transition-all rounded-full', progressColor)}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
})
