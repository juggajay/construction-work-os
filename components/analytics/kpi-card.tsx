'use client'

import { memo, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowDown, ArrowUp, Minus, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface KPICardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    label: string
  }
  subtitle?: string
  className?: string
}

export const KPICard = memo(function KPICard({ title, value, icon: Icon, trend, subtitle, className }: KPICardProps) {
  const trendIcon = useMemo(() => {
    if (!trend) return null
    if (trend.value > 0) return <ArrowUp className="h-3 w-3" />
    if (trend.value < 0) return <ArrowDown className="h-3 w-3" />
    return <Minus className="h-3 w-3" />
  }, [trend])

  const trendColor = useMemo(() => {
    if (!trend) return ''
    if (trend.value > 0) return 'text-green-600 bg-green-50'
    if (trend.value < 0) return 'text-red-600 bg-red-50'
    return 'text-neutral-600 bg-neutral-50'
  }, [trend])

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-600">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-neutral-900">{value}</h3>
              {trend && (
                <div
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                    trendColor
                  )}
                >
                  {trendIcon}
                  <span>{Math.abs(trend.value)}%</span>
                </div>
              )}
            </div>
            {subtitle && <p className="mt-1 text-xs text-neutral-500">{subtitle}</p>}
            {trend && <p className="mt-1 text-xs text-neutral-500">{trend.label}</p>}
          </div>

          <div className="rounded-lg bg-amber-50 p-3">
            <Icon className="h-6 w-6 text-amber-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
