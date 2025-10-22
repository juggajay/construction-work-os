/**
 * RFI Dashboard Widget Component
 *
 * Displays RFI summary and recent activity on the project dashboard
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { isOverdue } from '@/lib/rfis/sla-calculations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, FileQuestion, Clock, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

interface RFIDashboardWidgetProps {
  projectId: string
  orgSlug: string
}

export function RFIDashboardWidget({ projectId, orgSlug }: RFIDashboardWidgetProps) {
  // Fetch RFI summary data
  const { data: summary, isLoading } = useQuery({
    queryKey: ['rfi-summary', projectId],
    queryFn: async () => {
      const supabase = createClient()

      const { data: rfis, error } = await supabase
        .from('rfis')
        .select(`
          id,
          number,
          title,
          status,
          priority,
          submitted_at,
          response_due_date,
          answered_at,
          closed_at,
          created_at,
          updated_at
        `)
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Calculate summary stats
      const total = rfis?.length || 0
      const open = rfis?.filter((rfi: any) =>
        rfi.status === 'draft' || rfi.status === 'submitted' || rfi.status === 'under_review'
      ).length || 0
      const closed = rfis?.filter((rfi: any) => rfi.status === 'closed').length || 0
      const overdue = rfis?.filter((rfi: any) =>
        isOverdue({
          status: rfi.status,
          submitted_at: rfi.submitted_at,
          response_due_date: rfi.response_due_date,
          answered_at: rfi.answered_at,
          closed_at: rfi.closed_at,
        })
      ).length || 0

      // Get recent activity (last 3 RFIs by update)
      const recentActivity = rfis?.slice(0, 3) || []

      return {
        total,
        open,
        closed,
        overdue,
        recentActivity,
      }
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5" />
            RFIs
          </CardTitle>
          <CardDescription>Request for Information tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileQuestion className="h-5 w-5" />
          RFIs
        </CardTitle>
        <CardDescription>Request for Information tracking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total</p>
              <FileQuestion className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold">{summary?.total || 0}</p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-700">Open</p>
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-blue-900">{summary?.open || 0}</p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-700">Overdue</p>
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-red-900">{summary?.overdue || 0}</p>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-700">Closed</p>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-green-900">{summary?.closed || 0}</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="mb-3 text-sm font-semibold">Recent RFI Activity</h3>
          {summary?.recentActivity && summary.recentActivity.length > 0 ? (
            <div className="space-y-2">
              {summary.recentActivity.map((rfi: any) => {
                const rfiIsOverdue = isOverdue({
                  status: rfi.status,
                  submitted_at: rfi.submitted_at,
                  response_due_date: rfi.response_due_date,
                  answered_at: rfi.answered_at,
                  closed_at: rfi.closed_at,
                })

                return (
                  <Link
                    key={rfi.id}
                    href={`/${orgSlug}/projects/${projectId}/rfis/${rfi.id}`}
                    className="block rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm font-medium">{rfi.number}</p>
                          {rfiIsOverdue && (
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {rfi.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Updated {new Date(rfi.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="shrink-0 capitalize"
                      >
                        {rfi.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <p className="mt-2 text-sm text-muted-foreground">No RFIs yet</p>
              <p className="text-xs text-muted-foreground">
                Create your first RFI to get started
              </p>
            </div>
          )}
        </div>

        {/* View All Link */}
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/${orgSlug}/projects/${projectId}/rfis`}>
            View All RFIs
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
