/**
 * Organization Member Management Actions
 * View and manage organization team members
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export type OrgRole = 'owner' | 'admin' | 'member'

export interface OrgTeamMember {
  id: string // organization_members.id
  userId: string
  orgId: string
  role: OrgRole
  joinedAt: string | null
  invitedBy: string | null
  user: {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
  }
  invitedByUser: {
    fullName: string | null
  } | null
}

/**
 * Get all members of an organization
 */
export async function getOrganizationMembers(
  orgId: string
): Promise<ActionResponse<OrgTeamMember[]>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Query organization members with user profiles
    const { data, error } = await supabase
      .from('organization_members')
      .select(
        `
        id,
        user_id,
        org_id,
        role,
        joined_at,
        invited_by,
        user:profiles!organization_members_user_id_fkey (
          id,
          email,
          full_name,
          avatar_url
        ),
        invited_by_user:profiles!organization_members_invited_by_fkey (
          full_name
        )
      `
      )
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    // Transform to OrgTeamMember type
    const teamMembers: OrgTeamMember[] = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      orgId: row.org_id,
      role: row.role,
      joinedAt: row.joined_at,
      invitedBy: row.invited_by,
      user: {
        id: row.user.id,
        email: row.user.email,
        fullName: row.user.full_name,
        avatarUrl: row.user.avatar_url,
      },
      invitedByUser: row.invited_by_user
        ? { fullName: row.invited_by_user.full_name }
        : null,
    }))

    return { success: true, data: teamMembers }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch organization members',
    }
  }
}
