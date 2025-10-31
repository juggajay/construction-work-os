/**
 * Update Line Item
 * OpenSpec Change: enhance-budget-allocations-with-quotes-and-ai
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import { logger } from '@/lib/utils/logger'

export interface UpdateLineItemInput {
  lineItemId: string
  description?: string
  quantity?: number | null
  unit_of_measure?: string | null
  unit_price?: number | null
  line_total?: number
}

export async function updateLineItem(
  input: UpdateLineItemInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { lineItemId, ...updates } = input

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

    logger.debug('Updating line item', {
      action: 'updateLineItem',
      lineItemId,
      userId: user.id,
    })

    // Validate calculation if quantity and unit_price are provided
    if (
      updates.quantity !== undefined &&
      updates.unit_price !== undefined &&
      updates.quantity !== null &&
      updates.unit_price !== null
    ) {
      const calculated = updates.quantity * updates.unit_price
      if (updates.line_total && Math.abs(calculated - updates.line_total) > 0.01) {
        logger.warn('Line total mismatch, using calculated value', {
          action: 'updateLineItem',
          lineItemId,
          provided: updates.line_total,
          calculated,
        })
        updates.line_total = calculated
      } else if (!updates.line_total) {
        updates.line_total = calculated
      }
    }

    // Update line item
    const { data, error } = await supabase
      .from('budget_line_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lineItemId)
      .select('id')
      .single()

    if (error) {
      logger.error('Failed to update line item', new Error(error.message), {
        action: 'updateLineItem',
        lineItemId,
        userId: user.id,
      })
      return { success: false, error: error.message }
    }

    logger.info('Line item updated successfully', {
      action: 'updateLineItem',
      lineItemId: data.id,
      userId: user.id,
    })

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (error) {
    logger.error('Error in updateLineItem', error as Error, {
      action: 'updateLineItem',
      lineItemId: input.lineItemId,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update line item',
    }
  }
}
