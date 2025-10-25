/**
 * Delete Line Item
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export async function deleteLineItem(lineItemId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Get line item and check if CO is editable
    const { data: lineItem } = await supabase
      .from('change_order_line_items')
      .select('change_order_id')
      .eq('id', lineItemId)
      .single()

    if (!lineItem) {
      return { success: false, error: 'Line item not found' }
    }

    const { data: co } = await supabase
      .from('change_orders')
      .select('status')
      .eq('id', lineItem.change_order_id)
      .single()

    if (co?.status === 'approved' || co?.status === 'invoiced') {
      return { success: false, error: 'Cannot delete line items of approved/invoiced change orders' }
    }

    const { error } = await supabase
      .from('change_order_line_items')
      .delete()
      .eq('id', lineItemId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Trigger will automatically recalculate CO cost_impact
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete line item',
    }
  }
}
