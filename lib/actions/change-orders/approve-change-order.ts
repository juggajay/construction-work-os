/**
 * Approve Change Order
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export async function approveChangeOrder(
  approvalId: string,
  notes?: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Update approval status
    const { error } = await supabase
      .from('change_order_approvals')
      .update({
        status: 'approved',
        decision_at: new Date().toISOString(),
        notes: notes || null,
      })
      .eq('id', approvalId)
      .eq('status', 'pending')

    if (error) {
      return { success: false, error: error.message }
    }

    // Trigger will automatically advance to next stage or mark CO as approved

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve change order',
    }
  }
}
