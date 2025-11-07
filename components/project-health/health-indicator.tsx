import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'

interface HealthIndicatorProps {
  status: 'healthy' | 'warning' | 'critical'
  percentSpent: number
  size?: 'sm' | 'default' | 'lg'
}

export function HealthIndicator({ status, percentSpent, size = 'default' }: HealthIndicatorProps) {
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 20 : 16

  if (status === 'healthy') {
    return (
      <Badge variant="outline" className="gap-1 border-green-500 bg-green-50 text-green-700">
        <CheckCircle2 className="h-[{iconSize}px] w-[{iconSize}px]" />
        <span>Healthy ({percentSpent.toFixed(1)}%)</span>
      </Badge>
    )
  }

  if (status === 'warning') {
    return (
      <Badge variant="outline" className="gap-1 border-yellow-500 bg-yellow-50 text-yellow-700">
        <AlertTriangle className="h-[{iconSize}px] w-[{iconSize}px]" />
        <span>Warning ({percentSpent.toFixed(1)}%)</span>
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1 border-red-500 bg-red-50 text-red-700">
      <AlertCircle className="h-[{iconSize}px] w-[{iconSize}px]" />
      <span>Critical ({percentSpent.toFixed(1)}%)</span>
    </Badge>
  )
}
