'use client'

import React from 'react'
import { cn } from '@/lib/utils'

// Color variants that work in both light and dark mode
const VARIANT_COLORS = {
  primary: 'hsl(var(--primary))',
  construction: 'hsl(18 100% 60%)', // construction-500
  success: 'hsl(142 76% 36%)', // success
  warning: 'hsl(38 92% 50%)', // warning
  danger: 'hsl(0 84% 60%)', // destructive
  info: 'hsl(199 89% 48%)', // info
  muted: 'hsl(var(--muted-foreground))',
} as const

type SparklineVariant = keyof typeof VARIANT_COLORS

interface SparklineProps {
  data: number[]
  /** Color variant - uses theme colors that work in dark mode */
  variant?: SparklineVariant
  /** Custom color (overrides variant) - use CSS color value */
  color?: string
  className?: string
  /** Show area fill under the line */
  showArea?: boolean
  /** Line thickness */
  strokeWidth?: number
}

export function Sparkline({
  data,
  variant = 'construction',
  color,
  className = '',
  showArea = false,
  strokeWidth = 2,
}: SparklineProps) {
  if (!data || data.length === 0) {
    return null
  }

  const width = 100
  const height = 100
  const padding = 2

  // Calculate min and max values for scaling
  const minValue = Math.min(...data)
  const maxValue = Math.max(...data)
  const valueRange = maxValue - minValue || 1 // Avoid division by zero

  // Generate points for the polyline
  const points = data
    .map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((value - minValue) / valueRange) * (height - 2 * padding)
      return `${x},${y}`
    })
    .join(' ')

  // For area fill, we need a closed path
  const areaPath = showArea
    ? `M ${padding},${height - padding} ${data
        .map((value, index) => {
          const x = padding + (index / (data.length - 1)) * (width - 2 * padding)
          const y = height - padding - ((value - minValue) / valueRange) * (height - 2 * padding)
          return `L ${x},${y}`
        })
        .join(' ')} L ${width - padding},${height - padding} Z`
    : ''

  const strokeColor = color ?? VARIANT_COLORS[variant]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('w-full h-full', className)}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {showArea && (
        <path
          d={areaPath}
          fill={strokeColor}
          fillOpacity={0.1}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
