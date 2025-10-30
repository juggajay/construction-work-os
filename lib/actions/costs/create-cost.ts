/**
 * Create Manual Cost Entry
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import { createCostSchema, type CreateCostInput } from '@/lib/schemas'

export async function createCost(
  input: CreateCostInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Validate input
    const validatedInput = createCostSchema.parse(input)
    const { projectId, category, amount, description, costDate, attachments } = validatedInput

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Verify project access (manager or supervisor OR org member)
    const { data: access, error: accessError } = await supabase
      .from('project_access')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    // If no project_access record, check organization membership as fallback
    if (accessError?.code === 'PGRST116' || !access) {
      // Get project's organization
      const { data: projectOrg, error: projectOrgError } = await supabase
        .from('projects')
        .select('org_id')
        .eq('id', projectId)
        .is('deleted_at', null)
        .single()

      if (projectOrgError || !projectOrg) {
        throw new UnauthorizedError('Only managers and supervisors can add costs')
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
        throw new UnauthorizedError('Only managers and supervisors can add costs')
      }
    } else if (accessError) {
      throw new UnauthorizedError('Only managers and supervisors can add costs')
    } else if (!['manager', 'supervisor'].includes(access.role)) {
      throw new UnauthorizedError('Only managers and supervisors can add costs')
    }

    // Handle file uploads if attachments provided
    let attachmentPaths: { file_path: string; file_name: string }[] = []

    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        const timestamp = Date.now()
        const fileName = `${timestamp}-${file.name}`
        const filePath = `${projectId}/costs/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('project-invoices')
          .upload(filePath, file)

        if (uploadError) {
          return { success: false, error: `Failed to upload attachment: ${uploadError.message}` }
        }

        attachmentPaths.push({
          file_path: filePath,
          file_name: file.name,
        })
      }
    }

    // Create cost entry
    const { data: cost, error: costError } = await supabase
      .from('project_costs')
      .insert({
        project_id: projectId,
        budget_category: category,
        amount,
        description,
        cost_date: costDate,
        attachments: attachmentPaths,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (costError) {
      return { success: false, error: costError.message }
    }

    return { success: true, data: { id: cost.id } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create cost entry',
    }
  }
}
