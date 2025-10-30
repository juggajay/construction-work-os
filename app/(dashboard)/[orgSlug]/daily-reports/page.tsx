/**
 * Organization-Level Daily Reports Page
 *
 * Displays all daily reports across all projects in the organization
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
import { DailyReportStatusBadge } from '@/components/daily-reports/daily-report-status-badge'
import { Search, FileText, Users, Cloud, Building2, Calendar } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

type DailyReportStatus = 'draft' | 'submitted' | 'approved' | 'archived'

export default function OrganizationDailyReportsPage() {
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
        .select('id, name, number')
        .eq('org_id', org.id)
        .is('deleted_at', null)
        .order('name')

      if (error) throw error
      return data || []
    },
    enabled: !!org?.id,
  })

  // Fetch Daily Reports across all projects
  const { data: dailyReports, isLoading } = useQuery({
    queryKey: ['org-daily-reports', org?.id, statusFilter, projectFilter],
    queryFn: async () => {
      if (!org?.id) return []
      const supabase = createClient()

      const projectIds = projects?.map((p) => p.id) || []
      if (projectIds.length === 0) return []

      let query = supabase
        .from('daily_reports')
        .select(
          `
          id,
          report_date,
          status,
          weather_condition,
          temperature_high,
          total_crew_count,
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
        .order('report_date', { ascending: false })

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

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!dailyReports) {
      return {
        total: 0,
        submitted: 0,
        approved: 0,
        thisWeek: 0,
      }
    }

    const total = dailyReports.length
    const submitted = dailyReports.filter((r: any) => r.status === 'submitted').length
    const approved = dailyReports.filter((r: any) => r.status === 'approved').length

    // Calculate reports from this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const thisWeek = dailyReports.filter((r: any) => {
      const reportDate = new Date(r.report_date)
      return reportDate >= oneWeekAgo
    }).length

    return {
      total,
      submitted,
      approved,
      thisWeek,
    }
  }, [dailyReports])

  // Client-side search filtering
  const filteredReports = dailyReports?.filter((report: any) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      report.project?.name?.toLowerCase().includes(query) ||
      new Date(report.report_date).toLocaleDateString().includes(query)
    )
  })

  const handleRowClick = (reportId: string, projectId: string) => {
    router.push(`/${orgSlug}/projects/${projectId}/daily-reports/${reportId}`)
  }

  const getWeatherIcon = (condition: string | null) => {
    if (!condition) return null
    return <Cloud className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Daily Reports</h1>
          <p className="text-muted-foreground">Track daily activities and progress across projects</p>
        </div>
        <Button variant="outline" size="sm">
          <Building2 className="h-4 w-4 mr-2" />
          {projects?.length || 0} Projects
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold">{metrics.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{metrics.thisWeek}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="text-2xl font-bold text-warning">{metrics.submitted}</p>
              </div>
              <Users className="h-8 w-8 text-warning/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/50 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-success">{metrics.approved}</p>
              </div>
              <FileText className="h-8 w-8 text-success/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Reports List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daily Report Log</CardTitle>
              <CardDescription>All daily reports across all projects</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
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
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Weather</TableHead>
                <TableHead>Crew</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredReports && filteredReports.length > 0 ? (
                filteredReports.map((report: any) => (
                  <TableRow
                    key={report.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(report.id, report.project_id)}
                  >
                    <TableCell className="font-medium">
                      {new Date(report.report_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[150px]">{report.project?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DailyReportStatusBadge status={report.status as DailyReportStatus} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getWeatherIcon(report.weather_condition)}
                        <span className="text-sm">
                          {report.temperature_high ? `${Math.round(report.temperature_high)}°F` : '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>{report.total_crew_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No daily reports found
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
