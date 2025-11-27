'use client'

import { memo, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowDown, ArrowUp, Minus, Building2, Users, FileText, TrendingUp, DollarSign, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

// Icon mapping for server-to-client component boundary
const iconMap = {
  Building2,
  Users,
  FileText,
  TrendingUp,
  DollarSign,
  ClipboardList,
} as const

export type IconName = keyof typeof iconMap

export interface KPICardProps {
  title: string
  value: string | number
  icon: IconName
  trend?: {
    value: number
    label: string
  }
  subtitle?: string
  className?: string
}

export const KPICard = memo(function KPICard({ title, value, icon, trend, subtitle, className }: KPICardProps) {
  const Icon = iconMap[icon]
  const trendIcon = useMemo(() => {
    if (!trend) return null
    if (trend.value > 0) return <ArrowUp className="h-3 w-3" />
    if (trend.value < 0) return <ArrowDown className="h-3 w-3" />
    return <Minus className="h-3 w-3" />
  }, [trend])

  const trendColor = useMemo(() => {
    if (!trend) return ''
    if (trend.value > 0) return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10'
    if (trend.value < 0) return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10'
    return 'text-muted-foreground bg-muted'
  }, [trend])

  return (
    <Card
      depth={1}
      hoverable
      className={cn(
        'group transition-all duration-normal',
        className
      )}
    >
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-2xl lg:text-3xl font-bold text-foreground">{value}</h3>
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
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
            {trend && <p className="mt-1 text-xs text-muted-foreground">{trend.label}</p>}
          </div>

          <div className="rounded-lg bg-construction-500/10 p-2.5 lg:p-3 group-hover:bg-construction-500/20 transition-colors">
            <Icon className="h-5 w-5 lg:h-6 lg:w-6 text-construction-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
