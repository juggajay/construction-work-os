/**
 * Organization-Level Submittals Page
 * Display submittals across all projects in a simple table view
 */

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, Building2 } from 'lucide-react'

interface PageProps {
  params: Promise<{
    orgSlug: string
  }>
}

// Status badge mapping
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100',
  gc_review: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-100',
  ae_review: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-100',
  owner_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-100',
  complete: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-100',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-100',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  gc_review: 'GC Review',
  ae_review: 'AE Review',
  owner_review: 'Owner Review',
  complete: 'Approved',
  rejected: 'Rejected',
}

export default async function OrganizationSubmittalsPage({ params }: PageProps) {
  const { orgSlug } = await params

  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', orgSlug)
    .single()

  if (orgError || !org) {
    notFound()
  }

  // Get all projects for organization
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, number')
    .eq('org_id', org.id)
    .is('deleted_at', null)
    .order('name')

  const projectIds = projects?.map((p) => p.id) || []

  // Get all submittals across projects
  const { data: submittals } = await supabase
    .from('submittals')
    .select(`
      id,
      number,
      title,
      current_stage,
      status,
      due_date,
      project_id,
      csi_code,
      spec_section,
      created_at,
      project:projects (
        id,
        name,
        number
      )
    `)
    .in('project_id', projectIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const totalSubmittals = submittals?.length || 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Submittals</h1>
          <p className="text-muted-foreground">Track and manage all submittals across projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Building2 className="h-4 w-4 mr-2" />
            {projects?.length || 0} Projects
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Submittal
          </Button>
        </div>
      </div>

      {/* Submittals Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Submittals</CardTitle>
              <CardDescription>{totalSubmittals} total submittals</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>CSI Code</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!submittals || submittals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No submittals found
                  </TableCell>
                </TableRow>
              ) : (
                submittals.map((submittal: any) => (
                  <TableRow
                    key={submittal.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      window.location.href = `/${orgSlug}/projects/${submittal.project_id}/submittals/${submittal.id}`
                    }}
                  >
                    <TableCell className="font-medium">#{submittal.number}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{submittal.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[150px]">{submittal.project?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{submittal.csi_code || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[submittal.current_stage] || ''}
                      >
                        {STATUS_LABELS[submittal.current_stage] || submittal.current_stage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {submittal.due_date
                        ? new Date(submittal.due_date).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(submittal.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
