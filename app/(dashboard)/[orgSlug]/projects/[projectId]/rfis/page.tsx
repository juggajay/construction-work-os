/**
 * RFI List Page
 *
 * Displays all RFIs for a project with filtering, search, and sorting
 */

'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RFIStatusBadge, type RFIStatus } from '@/components/rfis/rfi-status-badge'
import { isOverdue } from '@/lib/rfis/sla-calculations'
import { Plus, Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

export default function RFIsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const orgSlug = params.orgSlug as string

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [overdueFilter, setOverdueFilter] = useState<string>('all')

  // Fetch RFIs
  const { data: rfis, isLoading } = useQuery({
    queryKey: ['rfis', projectId, statusFilter, overdueFilter],
    queryFn: async () => {
      const supabase = createClient()

      let query = supabase
        .from('rfis')
        .select(`
          id,
          number,
          title,
          status,
          priority,
          response_due_date,
          submitted_at,
          answered_at,
          closed_at,
          created_at,
          assigned_to_id
        `)
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error

      // Filter overdue in memory (complex logic)
      let filtered = data || []
      if (overdueFilter === 'overdue') {
        filtered = filtered.filter((rfi: any) =>
          isOverdue({
            status: rfi.status,
            submitted_at: rfi.submitted_at,
            response_due_date: rfi.response_due_date,
            answered_at: rfi.answered_at,
            closed_at: rfi.closed_at,
          })
        )
      }

      return filtered
    },
  })

  // Client-side search filtering
  const filteredRfis = rfis?.filter((rfi: any) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      rfi.number?.toLowerCase().includes(query) ||
      rfi.title?.toLowerCase().includes(query)
    )
  })

  const handleCreateRFI = () => {
    router.push(`/${orgSlug}/projects/${projectId}/rfis/new`)
  }

  const handleRowClick = (rfiId: string) => {
    router.push(`/${orgSlug}/projects/${projectId}/rfis/${rfiId}`)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RFIs</h1>
          <p className="text-muted-foreground">
            Manage Requests for Information
          </p>
        </div>
        <Button onClick={handleCreateRFI}>
          <Plus className="mr-2 h-4 w-4" />
          Create RFI
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by number or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="answered">Answered</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={overdueFilter} onValueChange={setOverdueFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by due date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All RFIs</SelectItem>
            <SelectItem value="overdue">Overdue Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredRfis?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No RFIs found. Create your first RFI to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredRfis?.map((rfi: any) => {
                const rfiIsOverdue = isOverdue({
                  status: rfi.status,
                  submitted_at: rfi.submitted_at,
                  response_due_date: rfi.response_due_date,
                  answered_at: rfi.answered_at,
                  closed_at: rfi.closed_at,
                })

                return (
                  <TableRow
                    key={rfi.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(rfi.id)}
                  >
                    <TableCell className="font-medium">{rfi.number}</TableCell>
                    <TableCell className="max-w-md truncate">{rfi.title}</TableCell>
                    <TableCell>
                      <RFIStatusBadge status={rfi.status as RFIStatus} isOverdue={rfiIsOverdue} />
                    </TableCell>
                    <TableCell className="capitalize">{rfi.priority}</TableCell>
                    <TableCell>
                      {rfi.assigned_to_id ? 'Assigned' : 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      {rfi.response_due_date
                        ? new Date(rfi.response_due_date).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(rfi.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      {filteredRfis && filteredRfis.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredRfis.length} RFI{filteredRfis.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
