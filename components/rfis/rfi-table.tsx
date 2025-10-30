/**
 * RFI Table Component
 *
 * Displays RFIs in a table with ball-in-court tracking
 */

'use client'

import { useRouter, useParams } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
    email: string
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

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
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
      <div className="p-12 text-center text-muted-foreground">
        Loading RFIs...
      </div>
    )
  }

  if (rfis.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        No RFIs found. Create your first RFI to get started.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-24">RFI #</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Ball in Court</TableHead>
          <TableHead>Days Open</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rfis.map((rfi) => {
          const rfiIsOverdue = isOverdue({
            status: rfi.status,
            submitted_at: rfi.submitted_at,
            response_due_date: rfi.response_due_date,
            answered_at: rfi.answered_at,
            closed_at: rfi.closed_at,
          })

          const daysOpen = getDaysOpen(rfi.submitted_at)

          return (
            <TableRow
              key={rfi.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleRowClick(rfi.id)}
            >
              <TableCell className="font-medium">{rfi.number}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium line-clamp-1">{rfi.title}</p>
                  {(rfi.discipline || rfi.spec_section) && (
                    <p className="text-xs text-muted-foreground">
                      {rfi.discipline}
                      {rfi.discipline && rfi.spec_section && ' • '}
                      {rfi.spec_section}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>{rfi.project?.name || '-'}</TableCell>
              <TableCell>
                {rfi.assigned_to ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={rfi.assigned_to.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(rfi.assigned_to.full_name, rfi.assigned_to.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {rfi.assigned_to.full_name || rfi.assigned_to.email}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Unassigned</span>
                )}
              </TableCell>
              <TableCell>
                {daysOpen > 0 ? (
                  <Badge variant={daysOpen > 5 ? 'destructive' : 'secondary'}>
                    {daysOpen} days
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {rfi.response_due_date ? (
                  <span
                    className={cn(
                      'text-sm',
                      rfiIsOverdue && 'text-danger font-medium'
                    )}
                  >
                    {new Date(rfi.response_due_date).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <RFIStatusBadge status={rfi.status} isOverdue={rfiIsOverdue} />
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
