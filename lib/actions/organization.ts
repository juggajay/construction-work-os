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
import { withAction, success, revalidateOrganization } from '@/lib/utils/server-actions'
import { ErrorMessages, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/utils/errors'

// ============================================================================
// CREATE ORGANIZATION
// ============================================================================

export const createOrganization = withAction(
  createOrganizationSchema,
  async (data: CreateOrganizationInput): Promise<ActionResponse<Organization>> => {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
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

    // Create organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: data.name,
        slug: data.slug,
      })
      .select()
      .single()

    if (orgError || !organization) {
      return {
        success: false,
        error: orgError?.message ?? ErrorMessages.OPERATION_FAILED,
      }
    }

    // Add creator as owner
    const { error: memberError } = await supabase.from('organization_members').insert({
      org_id: organization.id,
      user_id: user.id,
      role: 'owner',
      invited_by: user.id,
      joined_at: new Date().toISOString(),
    })

    if (memberError) {
      // Rollback organization creation
      await supabase.from('organizations').delete().eq('id', organization.id)

      return {
        success: false,
        error: memberError.message,
      }
    }

    revalidateOrganization(organization.slug)

    return success(organization)
  }
)

// ============================================================================
// UPDATE ORGANIZATION
// ============================================================================

export const updateOrganization = withAction(
  updateOrganizationSchema,
  async (
    data: UpdateOrganizationInput,
    orgId: string
  ): Promise<ActionResponse<Organization>> => {
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
        name: data.name,
        settings: data.settings,
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

    revalidateOrganization(organization.slug)

    return success(organization)
  }
)

// ============================================================================
// INVITE MEMBER
// ============================================================================

export const inviteMember = withAction(
  inviteMemberSchema,
  async (
    data: InviteMemberInput,
    orgId: string
  ): Promise<ActionResponse<OrganizationMember>> => {
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
      .eq('email', data.email)
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

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('org_id', orgId)
      .eq('user_id', invitedUser.id)
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
        user_id: invitedUser.id,
        role: data.role,
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

    // Get organization for revalidation
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', orgId)
      .single()

    if (org) {
      revalidateOrganization(org.slug)
    }

    return success(member)
  }
)

// ============================================================================
// UPDATE MEMBER ROLE
// ============================================================================

export const updateMemberRole = withAction(
  updateMemberRoleSchema,
  async (data: UpdateMemberRoleInput, orgId: string): Promise<ActionResponse<void>> => {
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
      .eq('id', data.memberId)
      .eq('org_id', orgId)
      .single()

    if (!member) {
      throw new NotFoundError(ErrorMessages.MEMBER_NOT_FOUND)
    }

    // Prevent changing own role
    if (member.user_id === user.id) {
      return {
        success: false,
        error: ErrorMessages.MEMBER_CANNOT_CHANGE_OWN_ROLE,
      }
    }

    // Update role
    const { error } = await supabase
      .from('organization_members')
      .update({ role: data.role })
      .eq('id', data.memberId)

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
      revalidateOrganization(org.slug)
    }

    return success(undefined)
  }
)

// ============================================================================
// REMOVE MEMBER
// ============================================================================

export const removeMember = withAction(
  removeMemberSchema,
  async (data: RemoveMemberInput, orgId: string): Promise<ActionResponse<void>> => {
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
      .eq('id', data.memberId)
      .eq('org_id', orgId)
      .single()

    if (!member) {
      throw new NotFoundError(ErrorMessages.MEMBER_NOT_FOUND)
    }

    // Prevent removing owner (unless remover is also owner)
    if (member.role === 'owner') {
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
      .eq('id', data.memberId)

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
      revalidateOrganization(org.slug)
    }

    return success(undefined)
  }
)

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
      revalidateOrganization(org.slug)
    }

    return success(undefined)
  }
)
