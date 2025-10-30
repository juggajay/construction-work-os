import { getOrganizationBySlug } from '@/lib/actions/organization-helpers'
import { getOrganizationMembers } from '@/lib/actions/organization-members'
import { getEnhancedTeamMembers } from '@/lib/actions/team-members'
import { redirect } from 'next/navigation'
import { OrgTeamClient } from './org-team-client'
import { TeamMemberGrid } from '@/components/team/team-member-grid'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LayoutGrid, List } from 'lucide-react'

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

  // Fetch team members (for list view)
  const teamResult = await getOrganizationMembers((org as any).id)
  const teamMembers = teamResult.success ? teamResult.data || [] : []

  // Get enhanced team members (for grid view)
  const enhancedResult = await getEnhancedTeamMembers((org as any).id)
  const enhancedMembers = enhancedResult.success && enhancedResult.data ? enhancedResult.data : []

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">Team Directory</h1>
        <p className="mt-2 text-neutral-600">
          Manage your organization&apos;s team members, roles, and certifications
        </p>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Grid View
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="mt-6">
          <TeamMemberGrid members={enhancedMembers} />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <OrgTeamClient
            orgId={(org as any).id}
            orgSlug={orgSlug}
            initialTeamMembers={teamMembers}
            isOwnerOrAdmin={isOwnerOrAdmin}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
