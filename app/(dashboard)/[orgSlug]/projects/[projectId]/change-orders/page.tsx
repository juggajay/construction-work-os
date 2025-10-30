/**
 * Change Orders List Page
 *
 * Displays all change orders for a project with filtering, search, and sorting
 */

'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ChangeOrderStatusBadge } from '@/components/change-orders/change-order-status-badge'
import { Plus, Search, DollarSign } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { ChangeOrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function ChangeOrdersPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const orgSlug = params.orgSlug as string

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Fetch Project Budget
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select('budget')
        .eq('id', projectId)
        .single()

      if (error) throw error
      return data
    },
  })

  // Fetch Change Orders
  const { data: changeOrders, isLoading } = useQuery({
    queryKey: ['change-orders', projectId, statusFilter, typeFilter],
    queryFn: async () => {
      const supabase = createClient()

      let query = supabase
        .from('change_orders')
        .select(
          `
          id,
          number,
          title,
          type,
          status,
          cost_impact,
          schedule_impact_days,
          created_at,
          submitted_at,
          approved_at,
          created_by,
          current_version
        `
        )
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any)
      }

      // Apply type filter
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter as any)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    },
  })

  // Calculate financial summary
  const originalContract = project?.budget ? parseFloat(project.budget.toString()) : 0
  const approvedChanges = changeOrders
    ?.filter((co: any) => co.status === 'approved' || co.status === 'invoiced')
    .reduce((sum: number, co: any) => sum + parseFloat(co.cost_impact || '0'), 0) || 0
  const pendingChanges = changeOrders
    ?.filter((co: any) => co.status === 'proposed' || co.status === 'potential')
    .reduce((sum: number, co: any) => sum + parseFloat(co.cost_impact || '0'), 0) || 0
  const currentContract = originalContract + approvedChanges

  // Client-side search filtering
  const filteredChangeOrders = changeOrders?.filter((co: any) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      co.number?.toLowerCase().includes(query) ||
      co.title?.toLowerCase().includes(query)
    )
  })

  const handleCreateChangeOrder = () => {
    router.push(`/${orgSlug}/projects/${projectId}/change-orders/new`)
  }

  const handleRowClick = (changeOrderId: string) => {
    router.push(
      `/${orgSlug}/projects/${projectId}/change-orders/${changeOrderId}`
    )
  }

  // Format currency
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  // Format large currency values (with K/M suffix)
  const formatLargeCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return formatCurrency(amount)
  }

  // Format type for display
  const formatType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Change Orders</h1>
          <p className="text-muted-foreground">
            Manage contract modifications and cost impacts
          </p>
        </div>
        <Button onClick={handleCreateChangeOrder}>
          <Plus className="mr-2 h-4 w-4" />
          New Change Order
        </Button>
      </div>

      {/* Financial Impact Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Original Contract</p>
            <p className="text-2xl font-bold mt-1">
              {formatLargeCurrency(originalContract)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Approved Changes</p>
            <p className={cn(
              "text-2xl font-bold mt-1",
              approvedChanges > 0 ? "text-green-600" : approvedChanges < 0 ? "text-green-600" : ""
            )}>
              {approvedChanges > 0 ? '+' : ''}{formatLargeCurrency(approvedChanges)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending Changes</p>
            <p className={cn(
              "text-2xl font-bold mt-1",
              pendingChanges > 0 ? "text-yellow-600" : ""
            )}>
              {pendingChanges > 0 ? '+' : ''}{formatLargeCurrency(pendingChanges)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Current Contract</p>
            <p className="text-2xl font-bold mt-1">
              {formatLargeCurrency(currentContract)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Change Orders List Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Change Orders</CardTitle>
              <CardDescription>Track and manage all project change orders</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
                <SelectItem value="contemplated">Contemplated</SelectItem>
                <SelectItem value="potential">PCO</SelectItem>
                <SelectItem value="proposed">COR</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="invoiced">Invoiced</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="scope_change">Scope Change</SelectItem>
                <SelectItem value="design_change">Design Change</SelectItem>
                <SelectItem value="site_condition">Site Condition</SelectItem>
                <SelectItem value="owner_requested">Owner Requested</SelectItem>
                <SelectItem value="time_extension">Time Extension</SelectItem>
                <SelectItem value="cost_only">Cost Only</SelectItem>
                <SelectItem value="schedule_only">Schedule Only</SelectItem>
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
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Cost Impact</TableHead>
              <TableHead className="text-right">Schedule Impact</TableHead>
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
            ) : filteredChangeOrders?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No change orders found. Create your first change order to get
                  started.
                </TableCell>
              </TableRow>
            ) : (
              filteredChangeOrders?.map((co: any) => {
                return (
                  <TableRow
                    key={co.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(co.id)}
                  >
                    <TableCell className="font-medium">{co.number}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {co.title}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatType(co.type)}
                    </TableCell>
                    <TableCell>
                      <ChangeOrderStatusBadge
                        status={co.status as ChangeOrderStatus}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={cn(
                        parseFloat(co.cost_impact || '0') > 0 ? 'text-red-600' :
                        parseFloat(co.cost_impact || '0') < 0 ? 'text-green-600' : ''
                      )}>
                        {parseFloat(co.cost_impact || '0') > 0 ? '+' : ''}{formatCurrency(co.cost_impact || 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {co.schedule_impact_days ? (
                        <span className={cn(
                          co.schedule_impact_days > 0 ? 'text-red-600' :
                          co.schedule_impact_days < 0 ? 'text-green-600' : ''
                        )}>
                          {co.schedule_impact_days > 0 ? '+' : ''}{co.schedule_impact_days} days
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(co.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
            </Table>
          </div>

          {/* Summary */}
          {filteredChangeOrders && filteredChangeOrders.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
              <div>
                Showing {filteredChangeOrders.length} change order
                {filteredChangeOrders.length !== 1 ? 's' : ''}
              </div>
              <div>
                Total Cost Impact:{' '}
                <span className="font-medium text-foreground">
                  {formatCurrency(
                    filteredChangeOrders.reduce(
                      (sum: number, co: any) =>
                        sum + parseFloat(co.cost_impact || '0'),
                      0
                    )
                  )}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
