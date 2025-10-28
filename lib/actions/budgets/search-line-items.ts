/**
 * Search Line Items (Full-Text Search)
 * OpenSpec Change: enhance-budget-allocations-with-quotes-and-ai
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import type { Database } from '@/lib/types/supabase'

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

    console.log('🔍 searchLineItems: Searching for:', query)
    console.log('   Project:', projectId)
    console.log('   Category filter:', category || 'all')
    console.log('   Amount range:', minAmount, '-', maxAmount)

    // Call the database search function
    // @ts-ignore - Custom RPC function not in generated types yet
    const { data, error } = await supabase.rpc('search_budget_line_items', {
      p_project_id: projectId,
      p_search_query: query,
      p_category: category || null,
      p_min_amount: minAmount || null,
      p_max_amount: maxAmount || null,
    })

    if (error) {
      console.error('❌ searchLineItems: Search failed:', error)
      return { success: false, error: error.message }
    }

    const results = (data || []) as unknown as SearchLineItemResult[]

    console.log('✅ searchLineItems: Found', results.length, 'results')

    return {
      success: true,
      data: {
        results,
        count: results.length,
      },
    }
  } catch (error) {
    console.error('❌ searchLineItems: Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search line items',
    }
  }
}
