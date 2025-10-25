/**
 * Update Budget Allocation
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import { updateBudgetAllocationSchema, type UpdateBudgetAllocationInput } from '@/lib/schemas'

export async function updateBudgetAllocation(
  input: UpdateBudgetAllocationInput
): Promise<ActionResponse<void>> {
  try {
    // Validate input
    const validatedInput = updateBudgetAllocationSchema.parse(input)
    const { projectId, allocations, reason } = validatedInput

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Verify project access (must be manager)
    const { data: access, error: accessError } = await supabase
      .from('project_access')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (accessError || !access || access.role !== 'manager') {
      throw new UnauthorizedError('Only project managers can update budget allocations')
    }

    // Get project total budget
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('budget')
      .eq('id', projectId)
      .is('deleted_at', null)
      .single()

    if (projectError || !project) {
      return { success: false, error: 'Project not found' }
    }

    // Validate: Sum of allocations must not exceed total budget
    const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0)

    if (project.budget && totalAllocated > project.budget) {
      return {
        success: false,
        error: `Total allocation ($${totalAllocated.toFixed(2)}) exceeds project budget ($${project.budget})`,
      }
    }

    // Update or create budget allocations
    for (const allocation of allocations) {
      const { category, amount } = allocation

      // Check if allocation exists
      const { data: existing } = await supabase
        .from('project_budgets')
        .select('id, allocated_amount')
        .eq('project_id', projectId)
        .eq('category', category)
        .is('deleted_at', null)
        .single()

      if (existing) {
        // Update existing allocation
        const { error: updateError } = await supabase
          .from('project_budgets')
          .update({
            allocated_amount: amount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (updateError) {
          return { success: false, error: `Failed to update ${category} budget: ${updateError.message}` }
        }

        // Track in budget history if amount changed
        if (existing.allocated_amount !== amount) {
          await supabase.from('project_budget_history').insert({
            project_budget_id: existing.id,
            old_amount: existing.allocated_amount,
            new_amount: amount,
            reason: reason || null,
            changed_by: user.id,
          })
        }
      } else {
        // Create new allocation
        const { error: insertError } = await supabase.from('project_budgets').insert({
          project_id: projectId,
          category,
          allocated_amount: amount,
        })

        if (insertError) {
          return { success: false, error: `Failed to create ${category} budget: ${insertError.message}` }
        }
      }
    }

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update budget allocation',
    }
  }
}
