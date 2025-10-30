'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatItem {
  label: string
  value: string | number
  color?: string
}

interface StatCardProps {
  title: string
  icon?: LucideIcon
  stats: StatItem[]
  className?: string
}

export const StatCard = memo(function StatCard({ title, icon: Icon, stats, className }: StatCardProps) {
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
        <div className="space-y-3">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">{stat.label}</span>
              <span
                className={cn(
                  'text-sm font-semibold',
                  stat.color || 'text-neutral-900'
                )}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
})
