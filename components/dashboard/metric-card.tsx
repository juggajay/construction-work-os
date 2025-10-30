'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkline } from '@/components/charts/sparkline'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type ColorVariant = 'primary' | 'warning' | 'info' | 'danger'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon: LucideIcon
  color?: ColorVariant
  sparklineData?: number[]
  className?: string
}

const colorClasses: Record<ColorVariant, { icon: string; sparkline: string }> = {
  primary: {
    icon: 'text-primary bg-primary/10',
    sparkline: 'rgb(99, 102, 241)',
  },
  warning: {
    icon: 'text-warning bg-warning/10',
    sparkline: 'rgb(234, 179, 8)',
  },
  info: {
    icon: 'text-info bg-info/10',
    sparkline: 'rgb(59, 130, 246)',
  },
  danger: {
    icon: 'text-danger bg-danger/10',
    sparkline: 'rgb(239, 68, 68)',
  },
}

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  color = 'primary',
  sparklineData = [3, 5, 2, 8, 4, 9, 7],
  className,
}: MetricCardProps) {
  const colors = colorClasses[color]

  return (
    <Card
      className={cn(
        'hover:shadow-lg transition-all hover:-translate-y-0.5 duration-200',
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {change !== undefined && change !== 0 && (
              <p
                className={cn(
                  'text-sm mt-2 flex items-center gap-1',
                  change > 0 ? 'text-danger' : 'text-success'
                )}
              >
                {change > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {Math.abs(change)}% from last week
              </p>
            )}
          </div>
          <div
            className={cn(
              'h-12 w-12 rounded-lg flex items-center justify-center',
              colors.icon
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 h-12">
          <Sparkline data={sparklineData} color={colors.sparkline} />
        </div>
      </CardContent>
    </Card>
  )
}
