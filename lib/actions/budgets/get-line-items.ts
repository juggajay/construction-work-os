/**
 * Get Line Items for a Budget
 * OpenSpec Change: enhance-budget-allocations-with-quotes-and-ai
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import type { Database } from '@/lib/types/supabase'
import { logger } from '@/lib/utils/logger'

type LineItem = Database['public']['Tables']['budget_line_items']['Row']

export interface GetLineItemsInput {
  budgetId: string
}

export async function getLineItems(
  input: GetLineItemsInput
): Promise<ActionResponse<{ lineItems: LineItem[] }>> {
  try {
    const { budgetId } = input

    if (!budgetId) {
      return { success: false, error: 'Budget ID is required' }
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Fetch line items with quote information
    const { data: lineItems, error } = await supabase
      .from('budget_line_items')
      .select(
        `
        *,
        project_quote:project_quotes(
          id,
          vendor_name,
          quote_number,
          file_path
        )
      `
      )
      .eq('project_budget_id', budgetId)
      .is('deleted_at', null)
      .order('line_number', { ascending: true })

    if (error) {
      logger.error('Failed to fetch line items', new Error(error.message), {
        action: 'getLineItems',
        budgetId,
        userId: user.id,
      })
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: { lineItems: lineItems || [] },
    }
  } catch (error) {
    logger.error('Error in getLineItems', error as Error, {
      action: 'getLineItems',
      budgetId: input.budgetId,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch line items',
    }
  }
}
