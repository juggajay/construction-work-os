'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, FileText, TrendingUp, DollarSign, ClipboardList } from 'lucide-react'
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

interface StatItem {
  label: string
  value: string | number
  color?: string
}

interface StatCardProps {
  title: string
  icon?: IconName
  stats: StatItem[]
  className?: string
}

// Map light mode colors to dark mode equivalents
const colorMap: Record<string, string> = {
  'text-green-600': 'text-green-600 dark:text-green-400',
  'text-red-600': 'text-red-600 dark:text-red-400',
  'text-blue-600': 'text-blue-600 dark:text-blue-400',
  'text-amber-600': 'text-amber-600 dark:text-amber-400',
}

export const StatCard = memo(function StatCard({ title, icon, stats, className }: StatCardProps) {
  const Icon = icon ? iconMap[icon] : null
  return (
    <Card depth={1} hoverable className={cn('group transition-all duration-normal', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="rounded-lg bg-construction-500/10 p-2 group-hover:bg-construction-500/20 transition-colors">
              <Icon className="h-4 w-4 text-construction-500" />
            </div>
          )}
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <span
                className={cn(
                  'text-sm font-semibold',
                  stat.color ? (colorMap[stat.color] || stat.color) : 'text-foreground'
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
