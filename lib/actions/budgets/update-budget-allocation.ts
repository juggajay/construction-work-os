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
  console.log('💾 updateBudgetAllocation: Starting budget allocation update')

  try {
    // Validate input
    console.log('💾 updateBudgetAllocation: Validating input...')
    const validatedInput = updateBudgetAllocationSchema.parse(input)
    const { projectId, allocations, reason } = validatedInput

    console.log('💾 updateBudgetAllocation: Input validated', {
      projectId,
      allocationCount: allocations.length,
      categories: allocations.map(a => a.category),
      totalAmount: allocations.reduce((sum, a) => sum + a.amount, 0),
      hasReason: !!reason,
    })

    const supabase = await createClient()
    console.log('💾 updateBudgetAllocation: Supabase client created')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('❌ updateBudgetAllocation: No user found')
      throw new UnauthorizedError('You must be logged in')
    }

    console.log('💾 updateBudgetAllocation: User authenticated:', user.id)

    // Verify project access (must be manager or supervisor OR org member)
    console.log('💾 updateBudgetAllocation: Checking project access...')
    const { data: access, error: accessError } = await supabase
      .from('project_access')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    console.log('💾 updateBudgetAllocation: Access query result', {
      hasError: !!accessError,
      errorMessage: accessError?.message,
      errorCode: accessError?.code,
      hasAccess: !!access,
      role: access?.role,
    })

    // If no project_access record, check organization membership as fallback
    if (accessError?.code === 'PGRST116' || !access) {
      console.log('💾 updateBudgetAllocation: No project access found, checking org membership...')

      // Get project's organization
      const { data: projectOrg, error: projectOrgError } = await supabase
        .from('projects')
        .select('org_id')
        .eq('id', projectId)
        .is('deleted_at', null)
        .single()

      if (projectOrgError || !projectOrg) {
        console.error('❌ updateBudgetAllocation: Could not fetch project organization')
        throw new UnauthorizedError('Only project managers and supervisors can update budget allocations')
      }

      // Check if user is member of the organization
      const { data: orgMember, error: orgMemberError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('org_id', projectOrg.org_id)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single()

      console.log('💾 updateBudgetAllocation: Org membership result', {
        hasError: !!orgMemberError,
        errorMessage: orgMemberError?.message,
        isMember: !!orgMember,
        orgRole: orgMember?.role,
      })

      if (orgMemberError || !orgMember) {
        console.error('❌ updateBudgetAllocation: Access denied - not an org member')
        throw new UnauthorizedError('Only project managers and supervisors can update budget allocations')
      }

      console.log('✅ updateBudgetAllocation: Access verified via org membership, role:', orgMember.role)
    } else if (accessError) {
      console.error('❌ updateBudgetAllocation: Access query error', {
        error: accessError,
      })
      throw new UnauthorizedError('Only project managers and supervisors can update budget allocations')
    } else if (!['manager', 'supervisor'].includes(access.role)) {
      console.error('❌ updateBudgetAllocation: Access denied - insufficient role', {
        role: access.role,
        requiredRoles: ['manager', 'supervisor'],
      })
      throw new UnauthorizedError('Only project managers and supervisors can update budget allocations')
    } else {
      console.log('✅ updateBudgetAllocation: Access verified via project access, role:', access.role)
    }

    // Get project total budget
    console.log('💾 updateBudgetAllocation: Fetching project budget...')
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('budget')
      .eq('id', projectId)
      .is('deleted_at', null)
      .single()

    if (projectError || !project) {
      console.error('❌ updateBudgetAllocation: Project not found', {
        projectError: projectError?.message,
      })
      return { success: false, error: 'Project not found' }
    }

    console.log('💾 updateBudgetAllocation: Project found', {
      hasBudget: !!project.budget,
      budget: project.budget,
    })

    // Validate: Sum of allocations must not exceed total budget
    const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0)
    console.log('💾 updateBudgetAllocation: Validating total allocation', {
      totalAllocated,
      projectBudget: project.budget,
      isOverBudget: project.budget ? totalAllocated > project.budget : false,
    })

    if (!project.budget) {
      console.warn('⚠️ updateBudgetAllocation: No project budget set, skipping budget validation')
    } else if (totalAllocated > project.budget) {
      console.error('❌ updateBudgetAllocation: Over budget', {
        totalAllocated,
        projectBudget: project.budget,
        difference: totalAllocated - project.budget,
      })
      return {
        success: false,
        error: `Total allocation ($${totalAllocated.toFixed(2)}) exceeds project budget ($${project.budget.toFixed(2)})`,
      }
    }

    console.log('💾 updateBudgetAllocation: Budget validation passed')

    // Update or create budget allocations
    console.log('💾 updateBudgetAllocation: Processing allocations...')
    let updatedCount = 0
    let createdCount = 0
    let historyCount = 0

    for (const allocation of allocations) {
      const { category, amount } = allocation
      console.log(`💾 updateBudgetAllocation: Processing ${category}: $${amount}`)

      // Check if allocation exists
      const { data: existing, error: existingError } = await supabase
        .from('project_budgets')
        .select('id, allocated_amount')
        .eq('project_id', projectId)
        .eq('category', category)
        .is('deleted_at', null)
        .single()

      if (existingError && existingError.code !== 'PGRST116') {
        console.error(`❌ updateBudgetAllocation: Error checking existing allocation for ${category}`, {
          error: existingError.message,
        })
        return { success: false, error: `Failed to check existing ${category} budget: ${existingError.message}` }
      }

      if (existing) {
        console.log(`💾 updateBudgetAllocation: Updating existing ${category} allocation`, {
          oldAmount: existing.allocated_amount,
          newAmount: amount,
        })

        // Update existing allocation
        const { error: updateError } = await supabase
          .from('project_budgets')
          .update({
            allocated_amount: amount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error(`❌ updateBudgetAllocation: Failed to update ${category}`, {
            error: updateError.message,
          })
          return { success: false, error: `Failed to update ${category} budget: ${updateError.message}` }
        }

        updatedCount++
        console.log(`✅ updateBudgetAllocation: Updated ${category} allocation`)

        // Track in budget history if amount changed
        if (existing.allocated_amount !== amount) {
          console.log(`💾 updateBudgetAllocation: Recording budget history for ${category}`)
          const { error: historyError } = await supabase.from('project_budget_history').insert({
            project_budget_id: existing.id,
            old_amount: existing.allocated_amount,
            new_amount: amount,
            reason: reason || null,
            changed_by: user.id,
          })

          if (historyError) {
            console.error(`❌ updateBudgetAllocation: Failed to record history for ${category}`, {
              error: historyError.message,
            })
            return { success: false, error: `Failed to record budget history for ${category}: ${historyError.message}` }
          }

          historyCount++
          console.log(`✅ updateBudgetAllocation: Recorded history for ${category}`)
        }
      } else {
        console.log(`💾 updateBudgetAllocation: Creating new ${category} allocation`)

        // Create new allocation
        const { error: insertError } = await supabase.from('project_budgets').insert({
          project_id: projectId,
          category,
          allocated_amount: amount,
        })

        if (insertError) {
          console.error(`❌ updateBudgetAllocation: Failed to create ${category}`, {
            error: insertError.message,
          })
          return { success: false, error: `Failed to create ${category} budget: ${insertError.message}` }
        }

        createdCount++
        console.log(`✅ updateBudgetAllocation: Created ${category} allocation`)
      }
    }

    console.log('✅ updateBudgetAllocation: All allocations processed successfully', {
      updatedCount,
      createdCount,
      historyCount,
    })

    console.log('✅ updateBudgetAllocation: Budget allocation update completed successfully')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('❌ updateBudgetAllocation: Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update budget allocation',
    }
  }
}
