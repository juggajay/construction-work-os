/**
 * Search Line Items (Full-Text Search)
 * OpenSpec Change: enhance-budget-allocations-with-quotes-and-ai
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import type { Database } from '@/lib/types/supabase'
import { logger } from '@/lib/utils/logger'

type BudgetCategory = Database['public']['Enums']['project_budget_category']

export interface SearchLineItemsInput {
  projectId: string
  query: string
  category?: BudgetCategory | null
  minAmount?: number | null
  maxAmount?: number | null
}

export interface SearchLineItemResult {
  line_item_id: string
  budget_category: BudgetCategory
  description: string
  quantity: number | null
  unit_of_measure: string | null
  unit_price: number | null
  line_total: number
  quote_file_path: string | null
  relevance_rank: number
}

export async function searchLineItems(
  input: SearchLineItemsInput
): Promise<ActionResponse<{ results: SearchLineItemResult[]; count: number }>> {
  try {
    const { projectId, query, category, minAmount, maxAmount } = input

    if (!projectId || !query || query.trim().length === 0) {
      return { success: false, error: 'Project ID and search query are required' }
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    logger.debug('Searching line items', {
      action: 'searchLineItems',
      projectId,
      query,
      category: category || 'all',
      minAmount,
      maxAmount,
    })

    // Call the database search function
    const { data, error } = await supabase.rpc('search_budget_line_items', {
      p_project_id: projectId,
      p_search_query: query,
      p_category: category || undefined,
      p_min_amount: minAmount || undefined,
      p_max_amount: maxAmount || undefined,
    })

    if (error) {
      logger.error('Failed to search line items', new Error(error.message), {
        action: 'searchLineItems',
        projectId,
        userId: user.id,
      })
      return { success: false, error: error.message }
    }

    const results = (data || []) as unknown as SearchLineItemResult[]

    logger.debug('Line items search completed', {
      action: 'searchLineItems',
      resultCount: results.length,
    })

    return {
      success: true,
      data: {
        results,
        count: results.length,
      },
    }
  } catch (error) {
    logger.error('Error in searchLineItems', error as Error, {
      action: 'searchLineItems',
      projectId: input.projectId,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search line items',
    }
  }
}
