/**
 * Organization-Level RFI List Page
 *
 * Displays all RFIs across all projects in the organization
 */

'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RFIStatusBadge, type RFIStatus } from '@/components/rfis/rfi-status-badge'
import { RFITable } from '@/components/rfis/rfi-table'
import { isOverdue, calculateResponseTime } from '@/lib/rfis/sla-calculations'
import { Plus, Search, FileText, Clock, AlertCircle, TrendingDown, Filter, Building2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

export default function OrganizationRFIsPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [overdueFilter, setOverdueFilter] = useState<string>('all')
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
        .select('id, name, number')
        .eq('org_id', org.id)
        .is('deleted_at', null)
        .order('name')

      if (error) throw error
      return data || []
    },
    enabled: !!org?.id,
  })

  // Fetch RFIs across all projects
  const { data: rfis, isLoading } = useQuery({
    queryKey: ['org-rfis', org?.id, statusFilter, projectFilter],
    queryFn: async () => {
      if (!org?.id) return []
      const supabase = createClient()

      // Get all project IDs for this organization
      const projectIds = projects?.map((p) => p.id) || []
      if (projectIds.length === 0) return []

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
          assigned_to_id,
          discipline,
          spec_section,
          project_id,
          project:projects (
            id,
            name,
            number
          )
        `)
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

      // Fetch assigned user profiles for all RFIs that have assigned_to_id
      const assignedUserIds = [...new Set(data?.filter((rfi: any) => rfi.assigned_to_id).map((rfi: any) => rfi.assigned_to_id))]
      let assignedUsers: Record<string, any> = {}

      if (assignedUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', assignedUserIds)

        if (profiles) {
          assignedUsers = profiles.reduce((acc: any, profile: any) => {
            acc[profile.id] = profile
            return acc
          }, {})
        }
      }

      // Attach assigned_to profile to each RFI
      const rfisWithProfiles = (data || []).map((rfi: any) => ({
        ...rfi,
        assigned_to: rfi.assigned_to_id ? assignedUsers[rfi.assigned_to_id] : null,
      }))

      // Filter overdue in memory (complex logic)
      let filtered = rfisWithProfiles
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
    enabled: !!org?.id && !!projects,
  })

  // Client-side search filtering
  const filteredRfis = rfis?.filter((rfi: any) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      rfi.number?.toLowerCase().includes(query) ||
      rfi.title?.toLowerCase().includes(query) ||
      rfi.project?.name?.toLowerCase().includes(query)
    )
  })

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!rfis) {
      return {
        total: 0,
        pending: 0,
        overdue: 0,
        avgResponseTime: 0,
      }
    }

    const total = rfis.length
    const pending = rfis.filter(
      (rfi: any) => rfi.status === 'submitted' || rfi.status === 'under_review'
    ).length
    const overdue = rfis.filter((rfi: any) =>
      isOverdue({
        status: rfi.status,
        submitted_at: rfi.submitted_at,
        response_due_date: rfi.response_due_date,
        answered_at: rfi.answered_at,
        closed_at: rfi.closed_at,
      })
    ).length

    // Calculate average response time in days
    const responseTimes = rfis
      .map((rfi: any) =>
        calculateResponseTime({
          status: rfi.status,
          submitted_at: rfi.submitted_at,
          response_due_date: rfi.response_due_date,
          answered_at: rfi.answered_at,
          closed_at: rfi.closed_at,
        })
      )
      .filter((time): time is number => time !== null)

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / 24 // Convert hours to days
        : 0

    return {
      total,
      pending,
      overdue,
      avgResponseTime: Math.round(avgResponseTime * 10) / 10, // Round to 1 decimal
    }
  }, [rfis])

  const handleRowClick = (rfiId: string, projectId: string) => {
    router.push(`/${orgSlug}/projects/${projectId}/rfis/${rfiId}`)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RFIs</h1>
          <p className="text-muted-foreground">All requests for information across projects</p>
        </div>
        <Button variant="outline" size="sm">
          <Building2 className="h-4 w-4 mr-2" />
          {projects?.length || 0} Projects
        </Button>
      </div>

      {/* RFI Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total RFIs</p>
                <p className="text-2xl font-bold">{metrics.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Response</p>
                <p className="text-2xl font-bold text-warning">{metrics.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-warning/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-danger/50 bg-danger/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-danger">{metrics.overdue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-danger/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">
                  {metrics.avgResponseTime > 0
                    ? `${metrics.avgResponseTime} days`
                    : '-'}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-success/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RFI List with Ball-in-Court Tracking */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>RFI Log</CardTitle>
              <CardDescription>Track all requests for information across all projects</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search RFIs..."
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
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="answered">Answered</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <RFITable
            rfis={filteredRfis || []}
            isLoading={isLoading}
            onRowClick={(rfiId) => {
              const rfi = filteredRfis?.find((r: any) => r.id === rfiId)
              if (rfi) handleRowClick(rfiId, rfi.project_id)
            }}
            showProject={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}
