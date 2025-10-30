'use client'

import React, { memo, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ProjectHealthChartProps {
  className?: string
}

// Placeholder component for project health visualization
// This can be replaced with a real chart library (recharts, chart.js, etc.)
export const ProjectHealthChart = memo(function ProjectHealthChart({ className }: ProjectHealthChartProps) {
  const healthData = useMemo(() => [
    { status: 'On Track', count: 8, color: 'bg-success', percentage: 67 },
    { status: 'At Risk', count: 3, color: 'bg-warning', percentage: 25 },
    { status: 'Delayed', count: 1, color: 'bg-danger', percentage: 8 },
  ], [])

  const projectBlocks = useMemo(() => Array.from({ length: 12 }), [])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {healthData.map((item) => (
            <div key={item.status} className="flex items-center gap-2">
              <div className={cn('h-3 w-3 rounded-full', item.color)} />
              <span className="text-sm font-medium">{item.status}</span>
              <Badge variant="secondary" className="text-xs">
                {item.count}
              </Badge>
            </div>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          Total: {healthData.reduce((sum, item) => sum + item.count, 0)} projects
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-4">
        {healthData.map((item) => (
          <div key={item.status} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{item.status}</span>
              <span className="text-muted-foreground">{item.percentage}%</span>
            </div>
            <div className="h-8 bg-muted rounded-lg overflow-hidden">
              <div
                className={cn('h-full transition-all duration-500', item.color)}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Projects by Status - Visual Grid */}
      <div className="grid grid-cols-10 gap-2 pt-4 border-t">
        {projectBlocks.map((_, index) => {
          let statusColor = 'bg-success/20'
          if (index >= 8 && index < 11) {
            statusColor = 'bg-warning/20'
          } else if (index >= 11) {
            statusColor = 'bg-danger/20'
          }

          return (
            <div
              key={index}
              className={cn(
                'aspect-square rounded-md transition-all hover:scale-110',
                statusColor
              )}
              title={`Project ${index + 1}`}
            />
          )
        })}
      </div>
    </div>
  )
})
