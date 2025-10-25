import { getProjectById } from '@/lib/actions/project-helpers'
import { getProjectTeam } from '@/lib/actions/projects/team-management'
import { getOrganizationBySlug } from '@/lib/actions/organization-helpers'
import { redirect } from 'next/navigation'
import { TeamManagementClient } from './team-management-client'

export default async function ProjectTeamPage({
  params,
}: {
  params: Promise<{ orgSlug: string; projectId: string }>
}) {
  const { orgSlug, projectId } = await params

  // Fetch project
  const projectResult = await getProjectById(projectId)
  if (!projectResult) {
    redirect(`/${orgSlug}`)
  }
  const project = projectResult as any

  // Fetch organization to get user's role
  const org = await getOrganizationBySlug(orgSlug)
  if (!org) {
    redirect('/')
  }

  // Get user's org role
  const orgMember = (org as any).organization_members?.[0]
  const userOrgRole = orgMember?.role || 'member'
  const isOwnerOrAdmin = ['owner', 'admin'].includes(userOrgRole)

  // Fetch team members
  const teamResult = await getProjectTeam(projectId)
  const teamMembers = teamResult.success ? teamResult.data || [] : []

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Project Team</h1>
        <p className="mt-2 text-neutral-600">{project.name}</p>
      </div>

      {/* Client component for interactive team management */}
      <TeamManagementClient
        projectId={projectId}
        orgId={(org as any).id}
        orgSlug={orgSlug}
        initialTeamMembers={teamMembers}
        isOwnerOrAdmin={isOwnerOrAdmin}
      />
    </div>
  )
}
