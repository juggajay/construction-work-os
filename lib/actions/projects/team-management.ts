/**
 * Project Team Management Actions
 * Allows organization owners and admins to manage project team membership
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

// Types
export type ProjectRole = 'manager' | 'supervisor' | 'viewer'

export interface TeamMember {
  id: string // project_access.id
  userId: string
  projectId: string
  role: ProjectRole
  trade: string | null
  grantedBy: string | null
  grantedAt: string | null
  user: {
    id: string
    email: string
    fullName: string | null
    avatarUrl: string | null
  }
  grantedByUser: {
    fullName: string | null
  } | null
}

export interface OrgMember {
  id: string // user_id
  email: string
  fullName: string | null
  avatarUrl: string | null
  orgRole: 'owner' | 'admin' | 'member'
}

/**
 * Get all team members for a project
 */
export async function getProjectTeam(
  projectId: string
): Promise<ActionResponse<TeamMember[]>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Query project team with user profiles
    const { data, error } = await supabase
      .from('project_access')
      .select(
        `
        id,
        user_id,
        project_id,
        role,
        trade,
        granted_by,
        granted_at,
        user:profiles!project_access_user_id_fkey (
          id,
          email,
          full_name,
          avatar_url
        ),
        granted_by_user:profiles!project_access_granted_by_fkey (
          full_name
        )
      `
      )
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    // Transform to TeamMember type
    const teamMembers: TeamMember[] = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      projectId: row.project_id,
      role: row.role,
      trade: row.trade,
      grantedBy: row.granted_by,
      grantedAt: row.granted_at,
      user: {
        id: row.user.id,
        email: row.user.email,
        fullName: row.user.full_name,
        avatarUrl: row.user.avatar_url,
      },
      grantedByUser: row.granted_by_user
        ? { fullName: row.granted_by_user.full_name }
        : null,
    }))

    return { success: true, data: teamMembers }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project team',
    }
  }
}

/**
 * Add a team member to a project
 */
export async function addTeamMember(params: {
  projectId: string
  userId: string
  role: ProjectRole
  trade?: string
}): Promise<ActionResponse<{ id: string }>> {
  try {
    const { projectId, userId, role, trade } = params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Verify caller is owner/admin
    const { data: orgMember, error: orgError } = await supabase
      .from('organization_members')
      .select('role, org_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (orgError || !orgMember || !['owner', 'admin'].includes(orgMember.role)) {
      throw new UnauthorizedError(
        'Only organization owners and admins can manage project teams'
      )
    }

    // Verify target user is an org member
    const { data: targetMember, error: targetError } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('user_id', userId)
      .eq('org_id', orgMember.org_id)
      .is('deleted_at', null)
      .single()

    if (targetError || !targetMember) {
      return {
        success: false,
        error: 'User must be an organization member before being added to projects',
      }
    }

    // Check if user already on project
    const { data: existing, error: existingError } = await supabase
      .from('project_access')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle()

    if (existingError) {
      return { success: false, error: existingError.message }
    }

    if (existing) {
      return {
        success: false,
        error: 'User is already a member of this project',
      }
    }

    // Insert new project access
    const { data: projectAccess, error: insertError } = await supabase
      .from('project_access')
      .insert({
        project_id: projectId,
        user_id: userId,
        role,
        trade: trade || null,
        granted_by: user.id,
        granted_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    return { success: true, data: { id: projectAccess.id } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add team member',
    }
  }
}

/**
 * Update a team member's role
 */
export async function updateTeamMemberRole(params: {
  projectAccessId: string
  newRole: ProjectRole
}): Promise<ActionResponse<void>> {
  try {
    const { projectAccessId, newRole } = params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Get the project access record
    const { data: projectAccess, error: accessError } = await supabase
      .from('project_access')
      .select('project_id, role')
      .eq('id', projectAccessId)
      .is('deleted_at', null)
      .single()

    if (accessError || !projectAccess) {
      return { success: false, error: 'Project access record not found' }
    }

    // If changing from manager to non-manager, check if this is the last manager
    if (projectAccess.role === 'manager' && newRole !== 'manager') {
      const { data: managers, error: managersError } = await supabase
        .from('project_access')
        .select('id')
        .eq('project_id', projectAccess.project_id)
        .eq('role', 'manager')
        .is('deleted_at', null)

      if (managersError) {
        return { success: false, error: managersError.message }
      }

      if (managers && managers.length <= 1) {
        return {
          success: false,
          error: 'Cannot remove the last project manager. Assign another manager first.',
        }
      }
    }

    // Update role
    const { error: updateError } = await supabase
      .from('project_access')
      .update({ role: newRole })
      .eq('id', projectAccessId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update team member role',
    }
  }
}

/**
 * Remove a team member from a project (soft delete)
 */
export async function removeTeamMember(
  projectAccessId: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Get the project access record
    const { data: projectAccess, error: accessError } = await supabase
      .from('project_access')
      .select('project_id, role')
      .eq('id', projectAccessId)
      .is('deleted_at', null)
      .single()

    if (accessError || !projectAccess) {
      return { success: false, error: 'Project access record not found' }
    }

    // If removing a manager, check if this is the last manager
    if (projectAccess.role === 'manager') {
      const { data: managers, error: managersError } = await supabase
        .from('project_access')
        .select('id')
        .eq('project_id', projectAccess.project_id)
        .eq('role', 'manager')
        .is('deleted_at', null)

      if (managersError) {
        return { success: false, error: managersError.message }
      }

      if (managers && managers.length <= 1) {
        return {
          success: false,
          error: 'Cannot remove the last project manager. Assign another manager first.',
        }
      }
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('project_access')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', projectAccessId)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove team member',
    }
  }
}

/**
 * Get organization members who can be added to a project
 */
export async function getAvailableOrgMembers(params: {
  orgId: string
  projectId: string
}): Promise<ActionResponse<OrgMember[]>> {
  try {
    const { orgId, projectId } = params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Get org members who are NOT already on the project
    const { data, error } = await supabase
      .from('organization_members')
      .select(
        `
        user_id,
        role,
        profiles!organization_members_user_id_fkey (
          id,
          email,
          full_name,
          avatar_url
        )
      `
      )
      .eq('org_id', orgId)
      .is('deleted_at', null)

    if (error) {
      return { success: false, error: error.message }
    }

    // Get current project team members
    const { data: projectTeam, error: teamError } = await supabase
      .from('project_access')
      .select('user_id')
      .eq('project_id', projectId)
      .is('deleted_at', null)

    if (teamError) {
      return { success: false, error: teamError.message }
    }

    const projectUserIds = new Set((projectTeam || []).map((m: any) => m.user_id))

    // Filter out users already on project
    const availableMembers: OrgMember[] = (data || [])
      .filter((row: any) => !projectUserIds.has(row.user_id))
      .map((row: any) => ({
        id: row.user_id,
        email: row.profiles.email,
        fullName: row.profiles.full_name,
        avatarUrl: row.profiles.avatar_url,
        orgRole: row.role,
      }))
      .sort((a, b) => {
        // Sort by name, then email
        if (a.fullName && b.fullName) {
          return a.fullName.localeCompare(b.fullName)
        }
        if (a.fullName) return -1
        if (b.fullName) return 1
        return a.email.localeCompare(b.email)
      })

    return { success: true, data: availableMembers }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch available org members',
    }
  }
}
