import { getOrganizationBySlug } from '@/lib/actions/organization-helpers'
import { getOrganizationMembers } from '@/lib/actions/organization-members'
import { redirect } from 'next/navigation'
import { OrgTeamClient } from './org-team-client'

export default async function OrganizationTeamPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

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
  const teamResult = await getOrganizationMembers((org as any).id)
  const teamMembers = teamResult.success ? teamResult.data || [] : []

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Team</h1>
        <p className="mt-2 text-neutral-600">Manage your organization&apos;s team members</p>
      </div>

      {/* Client component for interactive team management */}
      <OrgTeamClient
        orgId={(org as any).id}
        orgSlug={orgSlug}
        initialTeamMembers={teamMembers}
        isOwnerOrAdmin={isOwnerOrAdmin}
      />
    </div>
  )
}
