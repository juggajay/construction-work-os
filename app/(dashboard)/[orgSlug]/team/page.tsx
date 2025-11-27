/**
 * Organization Team Page
 * Industrial Luxury aesthetic
 */

import { getOrganizationBySlug } from '@/lib/actions/organization-helpers'
import { getOrganizationMembers } from '@/lib/actions/organization-members'
import { getEnhancedTeamMembers } from '@/lib/actions/team-members'
import { redirect } from 'next/navigation'
import { Users, Shield, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  // Calculate stats
  const totalMembers = teamMembers.length
  const adminCount = teamMembers.filter((m: any) => ['owner', 'admin'].includes(m.role)).length
  const totalCertifications = enhancedMembers.reduce((sum: number, m: any) => sum + (m.certifications?.length || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Team Directory</h1>
          <p className="text-white/50 text-sm mt-1">
            Manage your organization&apos;s team members, roles, and certifications
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Members */}
        <div className={cn(
          "relative rounded-xl p-5 overflow-hidden group",
          "bg-white/[0.02] border border-white/[0.06]",
          "hover:border-white/[0.1] transition-all duration-300"
        )}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Total Members</p>
              <p className="text-3xl font-bold text-white mt-1">{totalMembers}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Admins */}
        <div className={cn(
          "relative rounded-xl p-5 overflow-hidden group",
          "bg-white/[0.02] border border-amber-500/20",
          "hover:border-amber-500/40 transition-all duration-300"
        )}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Admins & Owners</p>
              <p className="text-3xl font-bold text-amber-400 mt-1">{adminCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Shield className="h-5 w-5 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className={cn(
          "relative rounded-xl p-5 overflow-hidden group",
          "bg-white/[0.02] border border-white/[0.06]",
          "hover:border-emerald-500/30 transition-all duration-300"
        )}>
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Certifications</p>
              <p className="text-3xl font-bold text-emerald-400 mt-1">{totalCertifications}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <Award className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Team Views Container */}
      <div className={cn(
        "rounded-xl overflow-hidden",
        "bg-white/[0.02] border border-white/[0.06]"
      )}>
        {/* Client Component for tabbed views */}
        <TeamViewTabs
          orgId={(org as any).id}
          orgSlug={orgSlug}
          teamMembers={teamMembers}
          enhancedMembers={enhancedMembers}
          isOwnerOrAdmin={isOwnerOrAdmin}
        />
      </div>
    </div>
  )
}

// Client component for tabbed views
import { TeamViewTabs } from './team-view-tabs'
