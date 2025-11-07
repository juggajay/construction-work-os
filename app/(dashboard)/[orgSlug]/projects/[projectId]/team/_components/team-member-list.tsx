/**
 * Team Member List Component
 * Groups and displays team members by role
 */

'use client'

import { Card } from '@/components/ui/card'
import { TeamMemberRow } from './team-member-row'
import type { TeamMember, ProjectRole } from '@/lib/actions/projects/team-management'
import { Users } from 'lucide-react'

interface TeamMemberListProps {
  members: TeamMember[]
  canManage: boolean
}

export function TeamMemberList({ members, canManage }: TeamMemberListProps) {
  // Group members by role
  const membersByRole = members.reduce(
    (acc, member) => {
      if (!acc[member.role]) {
        acc[member.role] = []
      }
      acc[member.role].push(member)
      return acc
    },
    {} as Record<ProjectRole, TeamMember[]>
  )

  const roles: ProjectRole[] = ['manager', 'supervisor', 'viewer']

  const roleLabels: Record<ProjectRole, string> = {
    manager: 'Managers',
    supervisor: 'Supervisors',
    viewer: 'Viewers',
  }

  const roleDescriptions: Record<ProjectRole, string> = {
    manager: 'Full project control including budgets, approvals, and team management',
    supervisor: 'Field operations including costs, daily reports, and submittals',
    viewer: 'Read-only access to project data',
  }

  // Empty state
  if (members.length === 0) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {canManage
              ? 'Add organization members to this project to get started.'
              : 'This project has no team members assigned yet.'}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {roles.map((role) => {
        const roleMembers = membersByRole[role] || []

        // Skip empty roles
        if (roleMembers.length === 0) {
          return null
        }

        return (
          <div key={role}>
            <div className="mb-3">
              <div className="flex items-baseline gap-2">
                <h3 className="text-lg font-semibold capitalize">
                  {roleLabels[role]}
                </h3>
                <span className="text-sm text-muted-foreground">
                  ({roleMembers.length})
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {roleDescriptions[role]}
              </p>
            </div>

            <Card>
              <div className="divide-y">
                {roleMembers.map((member) => (
                  <TeamMemberRow
                    key={member.id}
                    member={member}
                    canManage={canManage}
                  />
                ))}
              </div>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
