/**
 * Update RFI Server Action
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { updateRFISchema, type UpdateRFIInput } from '@/lib/schemas'
import type { ActionResponse } from '@/lib/types'
import { withAction } from '@/lib/utils/server-actions'
import { ErrorMessages, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/utils/errors'

export const updateRFI = withAction(
  updateRFISchema,
  async (data: UpdateRFIInput): Promise<ActionResponse<any>> => {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Get RFI to check status and permissions
    const { data: existingRFI, error: fetchError } = await supabase
      .from('rfis')
      .select('status, created_by, project_id')
      .eq('id', data.rfiId)
      .single()

    if (fetchError || !existingRFI) {
      throw new NotFoundError('RFI not found')
    }

    // Only draft RFIs can be edited (content changes)
    if ((existingRFI as any).status !== 'draft') {
      return {
        success: false,
        error: 'Only draft RFIs can be edited',
      }
    }

    // Check if user is creator or project manager
    const isCreator = (existingRFI as any).created_by === user.id

    const { data: isManager } = await supabase.rpc('is_project_manager', {
      user_uuid: user.id,
      check_project_id: (existingRFI as any).project_id,
    })

    if (!isCreator && !isManager) {
      throw new ForbiddenError('Only the creator or project manager can edit this RFI')
    }

    // Update RFI
    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.discipline !== undefined) updateData.discipline = data.discipline
    if (data.specSection !== undefined) updateData.spec_section = data.specSection
    if (data.drawingReference !== undefined) updateData.drawing_reference = data.drawingReference
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.costImpact !== undefined) updateData.cost_impact = data.costImpact
    if (data.scheduleImpact !== undefined) updateData.schedule_impact = data.scheduleImpact

    const { data: rfi, error: updateError } = await supabase
      .from('rfis')
      .update(updateData)
      .eq('id', data.rfiId)
      .select()
      .single()

    if (updateError || !rfi) {
      return {
        success: false,
        error: updateError?.message ?? ErrorMessages.OPERATION_FAILED,
      }
    }

    return {
      success: true,
      data: rfi,
    }
  }
)
