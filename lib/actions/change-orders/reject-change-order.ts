/**
 * Reject Change Order
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export async function rejectChangeOrder(
  approvalId: string,
  reason: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    if (!reason || reason.trim().length === 0) {
      return { success: false, error: 'Rejection reason is required' }
    }

    // Update approval status
    const { error } = await supabase
      .from('change_order_approvals')
      .update({
        status: 'rejected',
        decision_at: new Date().toISOString(),
        notes: reason,
      })
      .eq('id', approvalId)
      .eq('status', 'pending')

    if (error) {
      return { success: false, error: error.message }
    }

    // Trigger will automatically update CO status to rejected

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject change order',
    }
  }
}
