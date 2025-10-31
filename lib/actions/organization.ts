/**
 * Organization Server Actions
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
  acceptInvitationSchema,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
  type InviteMemberInput,
  type UpdateMemberRoleInput,
  type RemoveMemberInput,
  type AcceptInvitationInput,
} from '@/lib/schemas'
import type { ActionResponse, Organization, OrganizationMember } from '@/lib/types'
import { withAction, success, revalidateOrganization, toActionError } from '@/lib/utils/server-actions'
import { ErrorMessages, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/utils/errors'

// ============================================================================
// CREATE ORGANIZATION
// ============================================================================

export const createOrganization = withAction(
  createOrganizationSchema,
  async (data: CreateOrganizationInput): Promise<ActionResponse<Organization>> => {
    const supabase = await createClient()

    // Get user to verify authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Check if slug is available
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', data.slug)
      .single()

    if (existingOrg) {
      return {
        success: false,
        error: ErrorMessages.ORG_SLUG_IN_USE,
        fieldErrors: {
          slug: [ErrorMessages.ORG_SLUG_IN_USE],
        },
      }
    }

    // Create organization using Postgres function
    // This bypasses RLS issues with Server Actions in production
    const { data: orgData, error: orgError } = await supabase.rpc('create_organization_with_member', {
      p_name: data.name,
      p_slug: data.slug,
    })

    if (orgError || !orgData || (orgData as any[]).length === 0) {
      return {
        success: false,
        error: orgError?.message ?? 'Failed to create organization. Please try again.',
      }
    }

    // Get the created organization
    const result = (orgData as any[])[0]
    const org: Organization = {
      id: result.organization_id,
      name: result.organization_name,
      slug: result.organization_slug,
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    }

    revalidateOrganization(org.slug)

    return success(org)
  }
)

// ============================================================================
// UPDATE ORGANIZATION
// ============================================================================

export async function updateOrganization(
  data: UpdateOrganizationInput,
  orgId: string
): Promise<ActionResponse<Organization>> {
  try {
    const validatedData = updateOrganizationSchema.parse(data)
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_org_admin', {
      user_uuid: user.id,
      check_org_id: orgId,
    })

    if (!isAdmin) {
      throw new ForbiddenError(ErrorMessages.ORG_ADMIN_REQUIRED)
    }

    // Update organization
    const { data: organization, error } = await supabase
      .from('organizations')
      .update({
        name: validatedData.name,
        settings: validatedData.settings,
      })
      .eq('id', orgId)
      .select()
      .single()

    if (error || !organization) {
      return {
        success: false,
        error: error?.message ?? ErrorMessages.OPERATION_FAILED,
      }
    }

    const org = organization as unknown as Organization
    revalidateOrganization(org.slug)

    return success(org)
  } catch (error) {
    return toActionError(error)
  }
}

// ============================================================================
// INVITE MEMBER
// ============================================================================

export async function inviteMember(
  data: InviteMemberInput,
  orgId: string
): Promise<ActionResponse<OrganizationMember>> {
  try {
    const validatedData = inviteMemberSchema.parse(data)
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_org_admin', {
      user_uuid: user.id,
      check_org_id: orgId,
    })

    if (!isAdmin) {
      throw new ForbiddenError(ErrorMessages.ORG_ADMIN_REQUIRED)
    }

    // Find user by email
    const { data: invitedUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', validatedData.email)
      .single()

    if (!invitedUser) {
      return {
        success: false,
        error: 'User not found with this email address',
        fieldErrors: {
          email: ['User not found with this email address'],
        },
      }
    }

    const user_id = (invitedUser as unknown as { id: string }).id

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('org_id', orgId)
      .eq('user_id', user_id)
      .is('deleted_at', null)
      .single()

    if (existingMember) {
      return {
        success: false,
        error: ErrorMessages.MEMBER_ALREADY_EXISTS,
      }
    }

    // Create invitation
    const { data: member, error } = await supabase
      .from('organization_members')
      .insert({
        org_id: orgId,
        user_id: user_id,
        role: validatedData.role,
        invited_by: user.id,
        // joined_at is NULL until invitation is accepted
      })
      .select()
      .single()

    if (error || !member) {
      return {
        success: false,
        error: error?.message ?? ErrorMessages.OPERATION_FAILED,
      }
    }

    const orgMember = member as unknown as OrganizationMember

    // Get organization for revalidation
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', orgId)
      .single()

    if (org) {
      revalidateOrganization((org as unknown as { slug: string }).slug)
    }

    return success(orgMember)
  } catch (error) {
    return toActionError(error)
  }
}

// ============================================================================
// UPDATE MEMBER ROLE
// ============================================================================

export async function updateMemberRole(
  data: UpdateMemberRoleInput,
  orgId: string
): Promise<ActionResponse<void>> {
  try {
    const validatedData = updateMemberRoleSchema.parse(data)
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_org_admin', {
      user_uuid: user.id,
      check_org_id: orgId,
    })

    if (!isAdmin) {
      throw new ForbiddenError(ErrorMessages.ORG_ADMIN_REQUIRED)
    }

    // Get member details
    const { data: member } = await supabase
      .from('organization_members')
      .select('user_id, role')
      .eq('id', validatedData.memberId)
      .eq('org_id', orgId)
      .single()

    if (!member) {
      throw new NotFoundError(ErrorMessages.MEMBER_NOT_FOUND)
    }

    const memberData = member as unknown as { user_id: string; role: string }

    // Prevent changing own role
    if (memberData.user_id === user.id) {
      return {
        success: false,
        error: ErrorMessages.MEMBER_CANNOT_CHANGE_OWN_ROLE,
      }
    }

    // Update role
    const { error } = await supabase
      .from('organization_members')
      .update({ role: validatedData.role })
      .eq('id', validatedData.memberId)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Get organization for revalidation
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', orgId)
      .single()

    if (org) {
      revalidateOrganization((org as unknown as { slug: string }).slug)
    }

    return success(undefined)
  } catch (error) {
    return toActionError(error)
  }
}

// ============================================================================
// REMOVE MEMBER
// ============================================================================

export async function removeMember(
  data: RemoveMemberInput,
  orgId: string
): Promise<ActionResponse<void>> {
  try {
    const validatedData = removeMemberSchema.parse(data)
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_org_admin', {
      user_uuid: user.id,
      check_org_id: orgId,
    })

    if (!isAdmin) {
      throw new ForbiddenError(ErrorMessages.ORG_ADMIN_REQUIRED)
    }

    // Get member details
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('id', validatedData.memberId)
      .eq('org_id', orgId)
      .single()

    if (!member) {
      throw new NotFoundError(ErrorMessages.MEMBER_NOT_FOUND)
    }

    const memberData = member as unknown as { role: string }

    // Prevent removing owner (unless remover is also owner)
    if (memberData.role === 'owner') {
      const { data: isOwner } = await supabase
        .from('organization_members')
        .select('id')
        .eq('org_id', orgId)
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .single()

      if (!isOwner) {
        return {
          success: false,
          error: ErrorMessages.MEMBER_CANNOT_REMOVE_OWNER,
        }
      }
    }

    // Soft delete member
    const { error } = await supabase
      .from('organization_members')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', validatedData.memberId)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Get organization for revalidation
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', orgId)
      .single()

    if (org) {
      revalidateOrganization((org as unknown as { slug: string }).slug)
    }

    return success(undefined)
  } catch (error) {
    return toActionError(error)
  }
}

// ============================================================================
// ACCEPT INVITATION
// ============================================================================

export const acceptInvitation = withAction(
  acceptInvitationSchema,
  async (data: AcceptInvitationInput): Promise<ActionResponse<void>> => {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Update membership to set joined_at
    const { error } = await supabase
      .from('organization_members')
      .update({ joined_at: new Date().toISOString() })
      .eq('org_id', data.orgId)
      .eq('user_id', user.id)
      .is('joined_at', null)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Get organization for revalidation
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', data.orgId)
      .single()

    if (org) {
      revalidateOrganization((org as unknown as { slug: string }).slug)
    }

    return success(undefined)
  }
)
