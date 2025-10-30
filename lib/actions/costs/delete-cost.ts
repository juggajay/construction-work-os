/**
 * Delete Manual Cost Entry (Soft Delete)
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import { deleteCostSchema, type DeleteCostInput } from '@/lib/schemas'

export async function deleteCost(
  input: DeleteCostInput
): Promise<ActionResponse<void>> {
  try {
    // Validate input
    const validatedInput = deleteCostSchema.parse(input)
    const { costId } = validatedInput

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Get cost to verify access
    const { data: cost, error: costError } = await supabase
      .from('project_costs')
      .select('project_id')
      .eq('id', costId)
      .is('deleted_at', null)
      .single()

    if (costError || !cost) {
      return { success: false, error: 'Cost entry not found' }
    }

    // Verify project access (manager only OR org owner)
    const { data: access, error: accessError } = await supabase
      .from('project_access')
      .select('role')
      .eq('project_id', cost.project_id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    // If no project_access record, check organization ownership as fallback
    if (accessError?.code === 'PGRST116' || !access) {
      // Get project's organization
      const { data: projectOrg, error: projectOrgError } = await supabase
        .from('projects')
        .select('org_id')
        .eq('id', cost.project_id)
        .is('deleted_at', null)
        .single()

      if (projectOrgError || !projectOrg) {
        throw new UnauthorizedError('Only managers can delete costs')
      }

      // Check if user is owner of the organization
      const { data: orgMember, error: orgMemberError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('org_id', projectOrg.org_id)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single()

      if (orgMemberError || !orgMember || orgMember.role !== 'owner') {
        throw new UnauthorizedError('Only managers can delete costs')
      }
    } else if (accessError) {
      throw new UnauthorizedError('Only managers can delete costs')
    } else if (access.role !== 'manager') {
      throw new UnauthorizedError('Only managers can delete costs')
    }

    // Soft delete cost entry
    const { error: deleteError } = await supabase
      .from('project_costs')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', costId)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete cost entry',
    }
  }
}
