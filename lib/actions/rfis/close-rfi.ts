/**
 * Close RFI Server Action
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { closeRFISchema, type CloseRFIInput } from '@/lib/schemas'
import type { ActionResponse } from '@/lib/types'
import { withAction } from '@/lib/utils/server-actions'
import { ErrorMessages, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/utils/errors'

export const closeRFI = withAction(
  closeRFISchema,
  async (data: CloseRFIInput): Promise<ActionResponse<any>> => {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Get RFI
    const { data: rfi, error: fetchError } = await supabase
      .from('rfis')
      .select('project_id, status, created_by')
      .eq('id', data.rfiId)
      .single()

    if (fetchError || !rfi) {
      throw new NotFoundError('RFI not found')
    }

    // Can only close answered RFIs
    if ((rfi as any).status !== 'answered') {
      return {
        success: false,
        error: 'RFI must be answered before closing',
      }
    }

    // Check if user is creator or project manager
    const isCreator = (rfi as any).created_by === user.id

    const { data: isManager } = await supabase.rpc('is_project_manager', {
      user_uuid: user.id,
      check_project_id: (rfi as any).project_id,
    })

    if (!isCreator && !isManager) {
      throw new ForbiddenError('Only the creator or project manager can close this RFI')
    }

    // Close RFI
    const { data: closedRFI, error: updateError } = await supabase
      .from('rfis')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        assigned_to_id: null, // Clear ball-in-court
        assigned_to_org: null,
      })
      .eq('id', data.rfiId)
      .select()
      .single()

    if (updateError || !closedRFI) {
      return {
        success: false,
        error: updateError?.message ?? ErrorMessages.OPERATION_FAILED,
      }
    }

    return {
      success: true,
      data: closedRFI,
    }
  }
)
