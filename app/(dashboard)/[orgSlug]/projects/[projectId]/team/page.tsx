/**
 * Project Team Page
 * Main page for managing project team members
 */

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/permissions'
import {
  getProjectTeam,
  getAvailableOrgMembers,
} from '@/lib/actions/projects/team-management'
import { TeamHeader } from './_components/team-header'
import { TeamStats } from './_components/team-stats'
import { TeamMemberList } from './_components/team-member-list'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface TeamPageProps {
  params: {
    orgSlug: string
    projectId: string
  }
}

async function TeamContent({ projectId, orgSlug }: { projectId: string; orgSlug: string }) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return notFound()
  }

  // Get organization ID from slug
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single()

  if (!org) {
    return notFound()
  }

  // Check view permission
  const canView = await hasPermission({
    permission: 'view_project',
    projectId,
  })

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          You don&apos;t have permission to view this project&apos;s team.
        </p>
      </div>
    )
  }

  // Check manage permission
  const canManage = await hasPermission({
    permission: 'manage_team',
    projectId,
  })

  // Fetch team members and available org members in parallel
  const [teamResult, availableResult] = await Promise.all([
    getProjectTeam(projectId),
    canManage ? getAvailableOrgMembers({ orgId: org.id, projectId }) : Promise.resolve({ success: true, data: [] }),
  ])

  if (!teamResult.success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-2xl font-semibold mb-2">Error Loading Team</h2>
        <p className="text-muted-foreground">{teamResult.error}</p>
      </div>
    )
  }

  const members = teamResult.data || []
  const availableMembers = availableResult.success ? availableResult.data || [] : []

  return (
    <TeamClientContent
      projectId={projectId}
      initialMembers={members}
      initialAvailableMembers={availableMembers}
      canManage={canManage}
    />
  )
}

function TeamClientContent({
  projectId,
  initialMembers,
  initialAvailableMembers,
  canManage,
}: {
  projectId: string
  initialMembers: any[]
  initialAvailableMembers: any[]
  canManage: boolean
}) {
  return (
    <div className="space-y-6">
      <TeamHeader
        projectId={projectId}
        availableMembers={initialAvailableMembers}
      />

      {initialMembers.length > 0 && <TeamStats members={initialMembers} />}

      <TeamMemberList
        members={initialMembers}
        canManage={canManage}
      />
    </div>
  )
}

function TeamPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Team List Skeleton */}
      <Card>
        <div className="divide-y">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { projectId, orgSlug } = params

  return (
    <Suspense fallback={<TeamPageSkeleton />}>
      <TeamContent projectId={projectId} orgSlug={orgSlug} />
    </Suspense>
  )
}
