/**
 * Team Members Actions
 * Enhanced team management with certifications and project assignments
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import { UpdateTeamMemberProfileSchema } from '@/lib/validations/team'
import { z } from 'zod'

export interface Certification {
  name: string
  issuer: string
  issuedDate: string
  expiryDate?: string
}

export interface EnhancedTeamMember {
  id: string
  fullName: string | null
  email: string
  phone: string | null
  avatarUrl: string | null
  jobTitle: string | null
  company: string | null
  role: string
  certifications: Certification[]
  projectAssignments: string[]
}

// TypeScript types for Supabase query results
type OrgMemberRow = {
  id: string
  user_id: string
  role: string
  profiles: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    phone: string | null
    job_title: string | null
    company: string | null
    certifications: unknown
  }
}

type ProjectAccessRow = {
  user_id: string
  projects: {
    id: string
    name: string
    org_id: string
  }
}

/**
 * Get all team members for an organization with enhanced info
 */
export async function getEnhancedTeamMembers(
  orgId: string
): Promise<ActionResponse<EnhancedTeamMember[]>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Optimize: Get organization members with profiles AND project assignments in a single parallel query
    const [orgMembersResult, projectAccessResult] = await Promise.all([
      supabase
        .from('organization_members')
        .select(
          `
          id,
          user_id,
          role,
          profiles!organization_members_user_id_fkey (
            id,
            email,
            full_name,
            avatar_url,
            phone,
            job_title,
            company,
            certifications
          )
        `
        )
        .eq('org_id', orgId)
        .is('deleted_at', null),
      // Get all project access for this organization in parallel
      supabase
        .from('project_access')
        .select(
          `
          user_id,
          projects!inner (
            id,
            name,
            org_id
          )
        `
        )
        .eq('projects.org_id', orgId)
        .is('deleted_at', null),
    ])

    if (orgMembersResult.error) {
      return { success: false, error: orgMembersResult.error.message }
    }

    const orgMembers = orgMembersResult.data
    const projectAccess = projectAccessResult.data

    // If project query fails, continue without assignments rather than failing entire request
    if (projectAccessResult.error) {
      // Log error but don't fail the entire request
      // In production, use proper logging service
      console.warn('Failed to fetch project assignments:', projectAccessResult.error)
    }

    // Build project assignments map
    const projectAssignmentsMap = new Map<string, string[]>()
    // Type assertion for project access results
    ;(projectAccess || []).forEach((pa: any) => {
      if (!projectAssignmentsMap.has(pa.user_id)) {
        projectAssignmentsMap.set(pa.user_id, [])
      }
      projectAssignmentsMap.get(pa.user_id)?.push(pa.projects.name)
    })

    // Transform to EnhancedTeamMember
    // Using 'any' temporarily until migration is applied and types regenerated
    const enhancedMembers: EnhancedTeamMember[] = (orgMembers || []).map((member: any) => {
      const profile = member.profiles
      const certifications = profile.certifications || []

      return {
        id: member.user_id,
        fullName: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        avatarUrl: profile.avatar_url,
        jobTitle: profile.job_title || null,
        company: profile.company || null,
        role: member.role.charAt(0).toUpperCase() + member.role.slice(1),
        certifications: Array.isArray(certifications) ? certifications : [],
        projectAssignments: projectAssignmentsMap.get(member.user_id) || [],
      }
    })

    return { success: true, data: enhancedMembers }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch team members',
    }
  }
}

/**
 * Update team member profile (certifications, job title, company)
 * Only allows users to update their own profile OR organization admins to update any profile
 */
export async function updateTeamMemberProfile(params: {
  userId: string
  jobTitle?: string
  company?: string
  certifications?: Certification[]
}): Promise<ActionResponse<void>> {
  try {
    // Validate input
    const validated = UpdateTeamMemberProfileSchema.parse(params)
    const { userId, jobTitle, company, certifications } = validated

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Authorization check: Users can only update their own profile OR admins can update anyone
    if (user.id !== userId) {
      // Check if user is an organization admin/owner
      const { data: adminCheck, error: adminError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin'])
        .is('deleted_at', null)
        .maybeSingle()

      if (adminError || !adminCheck) {
        throw new UnauthorizedError(
          'You can only update your own profile. Organization admins can update any profile.'
        )
      }
    }

    // Build update object with proper typing
    const updateData: Partial<{
      job_title: string
      company: string
      certifications: Certification[]
    }> = {}

    if (jobTitle !== undefined) updateData.job_title = jobTitle
    if (company !== undefined) updateData.company = company
    if (certifications !== undefined) updateData.certifications = certifications

    // Update profile
    // Type assertion needed until migration is applied and types regenerated
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData as any)
      .eq('id', userId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(', '),
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update team member profile',
    }
  }
}
