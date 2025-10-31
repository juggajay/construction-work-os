/**
 * Organization-Level Change Orders Page
 *
 * Displays all change orders across all projects in the organization
 */

'use client'

import { useState, useMemo } from 'react'
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
import { Search, DollarSign, TrendingUp, Clock, Building2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { ChangeOrderStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function OrganizationChangeOrdersPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')

  // Fetch organization ID
  const { data: org } = useQuery({
    queryKey: ['organization', orgSlug],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', orgSlug)
        .single()

      if (error) throw error
      return data
    },
  })

  // Fetch all projects for organization
  const { data: projects } = useQuery({
    queryKey: ['projects', org?.id],
    queryFn: async () => {
      if (!org?.id) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, number, budget')
        .eq('org_id', org.id)
        .is('deleted_at', null)
        .order('name')

      if (error) throw error
      return data || []
    },
    enabled: !!org?.id,
  })

  // Fetch Change Orders across all projects
  const { data: changeOrders, isLoading } = useQuery({
    queryKey: ['org-change-orders', org?.id, statusFilter, projectFilter],
    queryFn: async () => {
      if (!org?.id) return []
      const supabase = createClient()

      const projectIds = projects?.map((p) => p.id) || []
      if (projectIds.length === 0) return []

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
          project_id,
          project:projects (
            id,
            name,
            number
          )
        `
        )
        .in('project_id', projectIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any)
      }

      // Apply project filter
      if (projectFilter !== 'all') {
        query = query.eq('project_id', projectFilter)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    },
    enabled: !!org?.id && !!projects,
  })

  // Calculate financial summary
  const metrics = useMemo(() => {
    const totalBudget = projects?.reduce((sum, p) => sum + parseFloat(p.budget?.toString() || '0'), 0) || 0
    const approvedChanges = changeOrders
      ?.filter((co: any) => co.status === 'approved' || co.status === 'invoiced')
      .reduce((sum: number, co: any) => sum + parseFloat(co.cost_impact || '0'), 0) || 0
    const pendingChanges = changeOrders
      ?.filter((co: any) => co.status === 'proposed' || co.status === 'potential')
      .reduce((sum: number, co: any) => sum + parseFloat(co.cost_impact || '0'), 0) || 0
    const totalCount = changeOrders?.length || 0
    const approvedCount = changeOrders?.filter((co: any) => co.status === 'approved').length || 0

    return {
      totalBudget,
      approvedChanges,
      pendingChanges,
      currentContract: totalBudget + approvedChanges,
      totalCount,
      approvedCount,
    }
  }, [projects, changeOrders])

  // Client-side search filtering
  const filteredChangeOrders = changeOrders?.filter((co: any) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      co.number?.toLowerCase().includes(query) ||
      co.title?.toLowerCase().includes(query) ||
      co.project?.name?.toLowerCase().includes(query)
    )
  })

  const handleRowClick = (coId: string, projectId: string) => {
    router.push(`/${orgSlug}/projects/${projectId}/change-orders/${coId}`)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Change Orders</h1>
          <p className="text-muted-foreground">Track cost and schedule impacts across projects</p>
        </div>
        <Button variant="outline" size="sm">
          <Building2 className="h-4 w-4 mr-2" />
          {projects?.length || 0} Projects
        </Button>
      </div>

      {/* Financial Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Change Orders</p>
                <p className="text-2xl font-bold">{metrics.totalCount}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{metrics.approvedCount}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/50 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved Changes</p>
                <p className="text-2xl font-bold text-success">
                  ${metrics.approvedChanges.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-success/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Changes</p>
                <p className="text-2xl font-bold text-warning">
                  ${metrics.pendingChanges.toLocaleString()}
                </p>
              </div>
              <Clock className="h-8 w-8 text-warning/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change Orders List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Change Order Log</CardTitle>
              <CardDescription>All change orders across all projects</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search change orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="potential">Potential</SelectItem>
                  <SelectItem value="proposed">Proposed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="invoiced">Invoiced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Project</TableHead>
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
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredChangeOrders && filteredChangeOrders.length > 0 ? (
                filteredChangeOrders.map((co: any) => (
                  <TableRow
                    key={co.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(co.id, co.project_id)}
                  >
                    <TableCell className="font-medium">#{co.number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[150px]">{co.project?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">{co.title}</TableCell>
                    <TableCell className="capitalize">{co.type?.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <ChangeOrderStatusBadge status={co.status as ChangeOrderStatus} />
                    </TableCell>
                    <TableCell className={cn(
                      'text-right font-medium',
                      parseFloat(co.cost_impact || '0') > 0 ? 'text-red-600' : 'text-green-600'
                    )}>
                      {parseFloat(co.cost_impact || '0') > 0 ? '+' : ''}
                      ${parseFloat(co.cost_impact || '0').toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {co.schedule_impact_days ? `${co.schedule_impact_days} days` : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(co.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No change orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
