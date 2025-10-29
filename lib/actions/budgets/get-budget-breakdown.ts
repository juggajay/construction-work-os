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
  budget_id: string
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

    // Fetch budget allocations from project_budgets table
    const { data: budgetData, error: budgetError } = await supabase
      .from('project_budgets')
      .select('id, category, allocated_amount')
      .eq('project_id', projectId)
      .is('deleted_at', null)

    if (budgetError) {
      return { success: false, error: budgetError.message }
    }

    // For each budget, calculate spent amount from project_costs
    const breakdown: BudgetBreakdown[] = []

    for (const budget of budgetData || []) {
      // Get total spent for this category
      const { data: costs } = await supabase
        .from('project_costs')
        .select('amount')
        .eq('project_id', projectId)
        .eq('category', budget.category)
        .is('deleted_at', null)

      const spent = costs?.reduce((sum, cost) => sum + Number(cost.amount), 0) || 0
      const allocated = Number(budget.allocated_amount)
      const remaining = allocated - spent
      const percentSpent = allocated > 0 ? (spent / allocated) * 100 : 0

      breakdown.push({
        budget_id: budget.id,
        category: budget.category as BudgetCategory,
        allocated,
        spent,
        remaining,
        percentSpent,
      })
    }

    return { success: true, data: breakdown }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch budget breakdown',
    }
  }
}
