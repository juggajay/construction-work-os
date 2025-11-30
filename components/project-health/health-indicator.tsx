/**
 * Health Indicator Badge - Industrial Luxury Dark Theme
 */

import { cn } from '@/lib/utils'
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'

interface HealthIndicatorProps {
  status: 'healthy' | 'warning' | 'critical'
  percentSpent: number
  size?: 'sm' | 'default' | 'lg'
}

const sizeConfig = {
  sm: { icon: 12, text: 'text-[10px]', padding: 'px-1.5 py-0.5' },
  default: { icon: 14, text: 'text-xs', padding: 'px-2 py-1' },
  lg: { icon: 16, text: 'text-sm', padding: 'px-3 py-1.5' },
}

export function HealthIndicator({ status, percentSpent, size = 'default' }: HealthIndicatorProps) {
  const config = sizeConfig[size]

  if (status === 'healthy') {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 rounded-lg font-medium",
        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        config.padding,
        config.text
      )}>
        <CheckCircle2 style={{ width: config.icon, height: config.icon }} />
        <span>Healthy ({percentSpent.toFixed(1)}%)</span>
      </div>
    )
  }

  if (status === 'warning') {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 rounded-lg font-medium",
        "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        config.padding,
        config.text
      )}>
        <AlertTriangle style={{ width: config.icon, height: config.icon }} />
        <span>Warning ({percentSpent.toFixed(1)}%)</span>
      </div>
    )
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-lg font-medium",
      "bg-red-500/10 text-red-400 border border-red-500/20",
      config.padding,
      config.text
    )}>
      <AlertCircle style={{ width: config.icon, height: config.icon }} />
      <span>Critical ({percentSpent.toFixed(1)}%)</span>
    </div>
  )
}
