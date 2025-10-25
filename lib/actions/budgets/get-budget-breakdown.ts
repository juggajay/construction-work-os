/**
 * Get Budget Breakdown
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import { getBudgetBreakdownSchema, type GetBudgetBreakdownInput } from '@/lib/schemas'
import type { Database } from '@/lib/types/supabase'

type BudgetCategory = Database['public']['Enums']['project_budget_category']

export interface BudgetBreakdown {
  category: BudgetCategory
  allocated: number
  spent: number
  remaining: number
  percentSpent: number
}

export async function getBudgetBreakdown(
  input: GetBudgetBreakdownInput
): Promise<ActionResponse<BudgetBreakdown[]>> {
  try {
    // Validate input
    const validatedInput = getBudgetBreakdownSchema.parse(input)
    const { projectId } = validatedInput

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Verify project access
    const { data: access, error: accessError } = await supabase
      .from('project_access')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle()

    if (accessError || !access) {
      throw new UnauthorizedError('You do not have access to this project')
    }

    // Fetch budget breakdown from materialized view
    const { data: budgetData, error: budgetError } = await supabase
      .from('project_cost_summary')
      .select('category, allocated_amount, spent_amount, remaining_amount, spent_percentage')
      .eq('project_id', projectId)

    if (budgetError) {
      return { success: false, error: budgetError.message }
    }

    // Transform data
    const breakdown: BudgetBreakdown[] = (budgetData || []).map((item) => ({
      category: item.category,
      allocated: Number(item.allocated_amount),
      spent: Number(item.spent_amount),
      remaining: Number(item.remaining_amount),
      percentSpent: Number(item.spent_percentage),
    }))

    return { success: true, data: breakdown }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch budget breakdown',
    }
  }
}
