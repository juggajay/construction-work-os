/**
 * Cancel Change Order (preserves audit trail)
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export interface CancelChangeOrderInput {
  changeOrderId: string
  reason: string
}

export async function cancelChangeOrder(input: CancelChangeOrderInput): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    if (!input.reason || input.reason.trim().length === 0) {
      return { success: false, error: 'Cancellation reason is required' }
    }

    // Get change order
    const { data: co } = await supabase
      .from('change_orders')
      .select('status')
      .eq('id', input.changeOrderId)
      .single()

    if (!co) {
      return { success: false, error: 'Change order not found' }
    }

    // Cannot cancel if already invoiced
    if (co.status === 'invoiced') {
      return { success: false, error: 'Cannot cancel invoiced change orders' }
    }

    // Update status to cancelled
    // Store cancellation reason in custom_fields
    const { error } = await supabase
      .from('change_orders')
      .update({
        status: 'cancelled',
        custom_fields: { cancellation_reason: input.reason },
      })
      .eq('id', input.changeOrderId)

    if (error) {
      return { success: false, error: error.message }
    }

    // If was approved, trigger will subtract from cumulative_contract_value
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel change order',
    }
  }
}
