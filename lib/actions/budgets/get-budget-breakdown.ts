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

    // Verify project access (check project_access first, then org membership)
    const { data: access, error: accessError } = await supabase
      .from('project_access')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle()

    if (accessError) {
      throw new UnauthorizedError('Failed to check project access')
    }

    // If no project access, check organization membership as fallback
    if (!access) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('org_id')
        .eq('id', projectId)
        .is('deleted_at', null)
        .single()

      if (projectError || !project) {
        throw new UnauthorizedError('You do not have access to this project')
      }

      const { data: orgMember, error: orgMemberError } = await supabase
        .from('organization_members')
        .select('id')
        .eq('org_id', project.org_id)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle()

      if (orgMemberError || !orgMember) {
        throw new UnauthorizedError('You do not have access to this project')
      }
    }

    // Fetch budget breakdown from materialized view
    const { data: budgetData, error: budgetError } = await supabase
      .from('project_cost_summary')
      .select('category, allocated_amount, spent_amount, remaining_amount, spent_percentage')
      .eq('project_id', projectId)

    if (budgetError) {
      return { success: false, error: budgetError.message }
    }

    // Fetch budget IDs from project_budgets table
    const { data: budgetIds, error: budgetIdsError } = await supabase
      .from('project_budgets')
      .select('id, category')
      .eq('project_id', projectId)
      .is('deleted_at', null)

    if (budgetIdsError) {
      return { success: false, error: budgetIdsError.message }
    }

    // Create a map of category to budget_id
    const categoryToBudgetId = new Map(
      (budgetIds || []).map((b) => [b.category, b.id])
    )

    // Transform data (filter out null categories)
    const breakdown: BudgetBreakdown[] = (budgetData || [])
      .filter((item) => item.category !== null)
      .map((item) => ({
        budget_id: categoryToBudgetId.get(item.category as BudgetCategory) || '',
        category: item.category as BudgetCategory,
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
