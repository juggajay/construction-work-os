/**
 * Update Manual Cost Entry
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import { updateCostSchema, type UpdateCostInput } from '@/lib/schemas'

export async function updateCost(
  input: UpdateCostInput
): Promise<ActionResponse<void>> {
  try {
    // Validate input
    const validatedInput = updateCostSchema.parse(input)
    const { costId, ...updates } = validatedInput

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

    // Verify project access (manager or supervisor OR org member)
    const { data: access, error: accessError } = await supabase
      .from('project_access')
      .select('role')
      .eq('project_id', cost.project_id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    // If no project_access record, check organization membership as fallback
    if (accessError?.code === 'PGRST116' || !access) {
      // Get project's organization
      const { data: projectOrg, error: projectOrgError } = await supabase
        .from('projects')
        .select('org_id')
        .eq('id', cost.project_id)
        .is('deleted_at', null)
        .single()

      if (projectOrgError || !projectOrg) {
        throw new UnauthorizedError('Only managers and supervisors can update costs')
      }

      // Check if user is member of the organization
      const { data: orgMember, error: orgMemberError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('org_id', projectOrg.org_id)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single()

      if (orgMemberError || !orgMember) {
        throw new UnauthorizedError('Only managers and supervisors can update costs')
      }
    } else if (accessError) {
      throw new UnauthorizedError('Only managers and supervisors can update costs')
    } else if (!['manager', 'supervisor'].includes(access.role)) {
      throw new UnauthorizedError('Only managers and supervisors can update costs')
    }

    // Update cost entry
    const { error: updateError } = await supabase
      .from('project_costs')
      .update({
        ...updates,
        budget_category: updates.category,
        updated_at: new Date().toISOString(),
      })
      .eq('id', costId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update cost entry',
    }
  }
}
