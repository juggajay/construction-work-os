/**
 * Team Header Component
 * Page header with title, description, and actions
 */

'use client'

import { PermissionGate } from '@/components/permissions/permission-gate'
import { AddTeamMemberDialog } from './add-team-member-dialog'
import type { OrgMember } from '@/lib/actions/projects/team-management'

interface TeamHeaderProps {
  projectId: string
  availableMembers: OrgMember[]
}

export function TeamHeader({ projectId, availableMembers }: TeamHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Project Team</h1>
        <p className="text-muted-foreground">
          Manage team members and their roles on this project
        </p>
      </div>

      <PermissionGate permission="manage_team" projectId={projectId}>
        <AddTeamMemberDialog
          projectId={projectId}
          availableMembers={availableMembers}
        />
      </PermissionGate>
    </div>
  )
}
