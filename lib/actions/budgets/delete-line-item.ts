/**
 * Delete Line Item (Soft Delete)
 * OpenSpec Change: enhance-budget-allocations-with-quotes-and-ai
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export interface DeleteLineItemInput {
  lineItemId: string
}

export async function deleteLineItem(
  input: DeleteLineItemInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { lineItemId } = input

    if (!lineItemId) {
      return { success: false, error: 'Line item ID is required' }
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    console.log('🗑️  deleteLineItem: Soft deleting line item:', lineItemId)

    // Soft delete by setting deleted_at timestamp
    const { data, error } = await supabase
      .from('budget_line_items')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', lineItemId)
      .select('id')
      .single()

    if (error) {
      console.error('❌ deleteLineItem: Delete failed:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ deleteLineItem: Line item soft deleted successfully')

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (error) {
    console.error('❌ deleteLineItem: Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete line item',
    }
  }
}
