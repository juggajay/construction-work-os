/**
 * RFI Table Component
 *
 * Displays RFIs in a table with ball-in-court tracking
 * Industrial Luxury aesthetic
 */

'use client'

import { useRouter, useParams } from 'next/navigation'
import { RFIStatusBadge, type RFIStatus } from './rfi-status-badge'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isOverdue } from '@/lib/rfis/sla-calculations'

interface RFITableRow {
  id: string
  number: string
  title: string
  status: RFIStatus
  priority: string
  response_due_date: string | null
  submitted_at: string | null
  answered_at: string | null
  closed_at: string | null
  created_at: string
  project?: {
    id: string
    name: string
  }
  assigned_to?: {
    id: string
    full_name: string | null
    avatar_url?: string | null
  } | null
  discipline?: string | null
  spec_section?: string | null
}

interface RFITableProps {
  rfis: RFITableRow[]
  isLoading?: boolean
  showProject?: boolean
  onRowClick?: (rfiId: string) => void
}

function getDaysOpen(submittedAt: string | null): number {
  if (!submittedAt) return 0

  const submitted = new Date(submittedAt)
  const now = new Date()
  const diffMs = now.getTime() - submitted.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  return diffDays
}

function getInitials(name: string | null): string {
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  return 'NA'
}

export function RFITable({ rfis, isLoading = false, showProject = true, onRowClick }: RFITableProps) {
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectId as string
  const orgSlug = params.orgSlug as string

  const handleRowClick = (rfiId: string) => {
    if (onRowClick) {
      onRowClick(rfiId)
    } else {
      router.push(`/${orgSlug}/projects/${projectId}/rfis/${rfiId}`)
    }
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center text-white/40">
        <div className="inline-flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          Loading RFIs...
        </div>
      </div>
    )
  }

  if (rfis.length === 0) {
    return (
      <div className="p-12 text-center text-white/40">
        No RFIs found. Create your first RFI to get started.
      </div>
    )
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-white/[0.06]">
          <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40 w-24">
            RFI #
          </th>
          <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
            Subject
          </th>
          <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
            Project
          </th>
          <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
            Ball in Court
          </th>
          <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
            Days Open
          </th>
          <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
            Due Date
          </th>
          <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
            Status
          </th>
          <th className="w-12"></th>
        </tr>
      </thead>
      <tbody>
        {rfis.map((rfi, index) => {
          const rfiIsOverdue = isOverdue({
            status: rfi.status,
            submitted_at: rfi.submitted_at,
            response_due_date: rfi.response_due_date,
            answered_at: rfi.answered_at,
            closed_at: rfi.closed_at,
          })

          const daysOpen = getDaysOpen(rfi.submitted_at)

          return (
            <tr
              key={rfi.id}
              className={cn(
                "group cursor-pointer border-b border-white/[0.03]",
                "hover:bg-white/[0.02] transition-colors duration-200"
              )}
              onClick={() => handleRowClick(rfi.id)}
            >
              <td className="px-5 py-4">
                <span className="font-medium text-white/80">{rfi.number}</span>
              </td>
              <td className="px-5 py-4">
                <div>
                  <p className="font-medium text-white line-clamp-1">{rfi.title}</p>
                  {(rfi.discipline || rfi.spec_section) && (
                    <p className="text-xs text-white/40 mt-0.5">
                      {rfi.discipline}
                      {rfi.discipline && rfi.spec_section && ' • '}
                      {rfi.spec_section}
                    </p>
                  )}
                </div>
              </td>
              <td className="px-5 py-4">
                <span className="text-sm text-white/60">{rfi.project?.name || '-'}</span>
              </td>
              <td className="px-5 py-4">
                {rfi.assigned_to ? (
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium",
                      "bg-amber-500/10 text-amber-400"
                    )}>
                      {getInitials(rfi.assigned_to.full_name)}
                    </div>
                    <span className="text-sm text-white/70">
                      {rfi.assigned_to.full_name || 'Assigned User'}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-white/30">Unassigned</span>
                )}
              </td>
              <td className="px-5 py-4">
                {daysOpen > 0 ? (
                  <span className={cn(
                    "inline-flex px-2 py-0.5 text-xs font-medium rounded-md",
                    daysOpen > 5
                      ? "bg-red-500/10 text-red-400"
                      : "bg-white/[0.05] text-white/60"
                  )}>
                    {daysOpen} days
                  </span>
                ) : (
                  <span className="text-sm text-white/30">-</span>
                )}
              </td>
              <td className="px-5 py-4">
                {rfi.response_due_date ? (
                  <span
                    className={cn(
                      'text-sm',
                      rfiIsOverdue ? 'text-red-400 font-medium' : 'text-white/60'
                    )}
                  >
                    {new Date(rfi.response_due_date).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-sm text-white/30">-</span>
                )}
              </td>
              <td className="px-5 py-4">
                <RFIStatusBadge status={rfi.status} isOverdue={rfiIsOverdue} />
              </td>
              <td className="px-3 py-4">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-4 w-4 text-white/40" />
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
