/**
 * ✅ PHASE 3 OPTIMIZATION: Memoized to prevent unnecessary re-renders in project health grids
 */

import { memo } from 'react';
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { HealthIndicator } from './health-indicator'
import { FileText, Calendar } from 'lucide-react'
import type { ProjectHealth } from '@/lib/actions/project-health'

interface ProjectCardProps {
  project: ProjectHealth
  orgSlug: string
}

export const ProjectCard = memo(function ProjectCard({ project, orgSlug }: ProjectCardProps) {
  const latestInvoiceDate = project.latestInvoiceDate
    ? new Date(project.latestInvoiceDate).toLocaleDateString()
    : 'No invoices'

  return (
    <Link href={`/${orgSlug}/project-health/${project.id}`}>
      <Card className="hover:border-primary transition-colors cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <Badge variant="secondary" className="mt-2">
                {project.status}
              </Badge>
            </div>
            <HealthIndicator status={project.healthStatus} percentSpent={project.percentSpent} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Budget Progress */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-neutral-600">Budget Usage</span>
              <span className="font-semibold">
                ${project.totalSpent.toLocaleString()} / ${project.budget.toLocaleString()}
              </span>
            </div>
            <Progress value={project.percentSpent} className="h-2" />
            <p className="text-xs text-neutral-500 mt-1">{project.percentSpent.toFixed(1)}% spent</p>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-neutral-600">Labor</p>
              <p className="font-semibold">${project.categoryBreakdown.labor.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-neutral-600">Materials</p>
              <p className="font-semibold">${project.categoryBreakdown.materials.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-neutral-600">Equipment</p>
              <p className="font-semibold">${project.categoryBreakdown.equipment.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-neutral-600">Other</p>
              <p className="font-semibold">${project.categoryBreakdown.other.toLocaleString()}</p>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="flex items-center justify-between pt-3 border-t text-sm">
            <div className="flex items-center gap-2 text-neutral-600">
              <FileText className="h-4 w-4" />
              <span>
                {project.invoiceCount.total} invoice{project.invoiceCount.total !== 1 ? 's' : ''}
              </span>
              <span className="text-green-600">({project.invoiceCount.approved} approved)</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-500">
              <Calendar className="h-3 w-3" />
              <span className="text-xs">{latestInvoiceDate}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
});
