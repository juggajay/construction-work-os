/**
 * Delete Line Item (Soft Delete)
 * OpenSpec Change: enhance-budget-allocations-with-quotes-and-ai
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import { logger } from '@/lib/utils/logger'

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

    logger.debug('Soft deleting line item', {
      action: 'deleteLineItem',
      lineItemId,
      userId: user.id,
    })

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
      logger.error('Failed to delete line item', new Error(error.message), {
        action: 'deleteLineItem',
        lineItemId,
        userId: user.id,
      })
      return { success: false, error: error.message }
    }

    logger.info('Line item soft deleted successfully', {
      action: 'deleteLineItem',
      lineItemId: data.id,
      userId: user.id,
    })

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (error) {
    logger.error('Error in deleteLineItem', error as Error, {
      action: 'deleteLineItem',
      lineItemId: input.lineItemId,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete line item',
    }
  }
}
