/**
 * Reorder Line Items (for drag-and-drop)
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export interface ReorderLineItemsInput {
  changeOrderId: string
  lineItemIds: string[] // Array of line item IDs in new order
}

export async function reorderLineItems(input: ReorderLineItemsInput): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Check if CO is editable
    const { data: co } = await supabase
      .from('change_orders')
      .select('status')
      .eq('id', input.changeOrderId)
      .single()

    if (co?.status === 'approved' || co?.status === 'invoiced') {
      return { success: false, error: 'Cannot reorder line items of approved/invoiced change orders' }
    }

    // Update sort_order for each line item
    const updates = input.lineItemIds.map((id, index) =>
      supabase
        .from('change_order_line_items')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('change_order_id', input.changeOrderId)
    )

    const results = await Promise.all(updates)

    // Check for errors
    const errors = results.filter((r) => r.error)
    if (errors.length > 0) {
      return { success: false, error: 'Failed to reorder some line items' }
    }

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder line items',
    }
  }
}
