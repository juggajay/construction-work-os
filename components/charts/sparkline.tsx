'use client'

import React from 'react'

interface SparklineProps {
  data: number[]
  color?: string
  className?: string
}

export function Sparkline({ data, color = 'rgb(99, 102, 241)', className = '' }: SparklineProps) {
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

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full h-full ${className}`}
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
