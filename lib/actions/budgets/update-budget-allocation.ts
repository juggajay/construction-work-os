/**
 * Update Budget Allocation
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import { updateBudgetAllocationSchema, type UpdateBudgetAllocationInput } from '@/lib/schemas'
import { logger } from '@/lib/utils/logger'

export async function updateBudgetAllocation(
  input: UpdateBudgetAllocationInput
): Promise<ActionResponse<void>> {
  logger.debug('Starting budget allocation update', {
    action: 'updateBudgetAllocation',
  })

  try {
    // Validate input
    const validatedInput = updateBudgetAllocationSchema.parse(input)
    const { projectId, allocations, reason } = validatedInput

    logger.debug('Input validated', {
      action: 'updateBudgetAllocation',
      projectId,
      allocationCount: allocations.length,
      categories: allocations.map(a => a.category),
      totalAmount: allocations.reduce((sum, a) => sum + a.amount, 0),
      hasReason: !!reason,
    })

    const supabase = await createClient()
    logger.debug('Supabase client created', {
      action: 'updateBudgetAllocation',
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      logger.error('No user found', new Error('Authentication required'), {
        action: 'updateBudgetAllocation',
      })
      throw new UnauthorizedError('You must be logged in')
    }

    logger.debug('User authenticated', {
      action: 'updateBudgetAllocation',
      userId: user.id,
    })

    // Verify project access (must be manager or supervisor OR org member)
    logger.debug('Checking project access', {
      action: 'updateBudgetAllocation',
      projectId,
      userId: user.id,
    })
    const { data: access, error: accessError } = await supabase
      .from('project_access')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    logger.debug('Access query result', {
      action: 'updateBudgetAllocation',
      hasError: !!accessError,
      errorCode: accessError?.code,
      hasAccess: !!access,
      role: access?.role,
    })

    // If no project_access record, check organization membership as fallback
    if (accessError?.code === 'PGRST116' || !access) {
      logger.debug('No project access found, checking org membership', {
        action: 'updateBudgetAllocation',
        projectId,
      })

      // Get project's organization
      const { data: projectOrg, error: projectOrgError } = await supabase
        .from('projects')
        .select('org_id')
        .eq('id', projectId)
        .is('deleted_at', null)
        .single()

      if (projectOrgError || !projectOrg) {
        logger.error('Could not fetch project organization', projectOrgError || new Error('Project not found'), {
          action: 'updateBudgetAllocation',
          projectId,
        })
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

      logger.debug('Org membership result', {
        action: 'updateBudgetAllocation',
        hasError: !!orgMemberError,
        isMember: !!orgMember,
        orgRole: orgMember?.role,
      })

      if (orgMemberError || !orgMember) {
        logger.error('Access denied - not an org member', orgMemberError || new Error('Not authorized'), {
          action: 'updateBudgetAllocation',
          projectId,
          userId: user.id,
        })
        throw new UnauthorizedError('Only project managers and supervisors can update budget allocations')
      }

      logger.info('Access verified via org membership', {
        action: 'updateBudgetAllocation',
        role: orgMember.role,
      })
    } else if (accessError) {
      logger.error('Access query error', accessError, {
        action: 'updateBudgetAllocation',
      })
      throw new UnauthorizedError('Only project managers and supervisors can update budget allocations')
    } else if (!['manager', 'supervisor'].includes(access.role)) {
      logger.error('Access denied - insufficient role', new Error('Insufficient permissions'), {
        action: 'updateBudgetAllocation',
        role: access.role,
        requiredRoles: ['manager', 'supervisor'],
      })
      throw new UnauthorizedError('Only project managers and supervisors can update budget allocations')
    } else {
      logger.info('Access verified via project access', {
        action: 'updateBudgetAllocation',
        role: access.role,
      })
    }

    // Get project total budget
    logger.debug('Fetching project budget', {
      action: 'updateBudgetAllocation',
      projectId,
    })
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('budget')
      .eq('id', projectId)
      .is('deleted_at', null)
      .single()

    if (projectError || !project) {
      logger.error('Project not found', projectError || new Error('Project not found'), {
        action: 'updateBudgetAllocation',
        projectId,
      })
      return { success: false, error: 'Project not found' }
    }

    logger.debug('Project found', {
      action: 'updateBudgetAllocation',
      hasBudget: !!project.budget,
      budget: project.budget,
    })

    // Validate: Sum of allocations must not exceed total budget
    const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0)
    logger.debug('Validating total allocation', {
      action: 'updateBudgetAllocation',
      totalAllocated,
      projectBudget: project.budget,
      isOverBudget: project.budget ? totalAllocated > project.budget : false,
    })

    if (!project.budget) {
      logger.warn('No project budget set, skipping budget validation', {
        action: 'updateBudgetAllocation',
        projectId,
      })
    } else if (totalAllocated > project.budget) {
      logger.error('Total allocation exceeds budget', new Error('Over budget'), {
        action: 'updateBudgetAllocation',
        totalAllocated,
        projectBudget: project.budget,
        difference: totalAllocated - project.budget,
      })
      return {
        success: false,
        error: `Total allocation ($${totalAllocated.toFixed(2)}) exceeds project budget ($${project.budget.toFixed(2)})`,
      }
    }

    logger.debug('Budget validation passed', {
      action: 'updateBudgetAllocation',
    })

    // Update or create budget allocations
    logger.debug('Processing allocations', {
      action: 'updateBudgetAllocation',
      allocationCount: allocations.length,
    })
    let updatedCount = 0
    let createdCount = 0
    let historyCount = 0

    for (const allocation of allocations) {
      const { category, amount } = allocation
      logger.debug('Processing allocation', {
        action: 'updateBudgetAllocation',
        category,
        amount,
      })

      // Check if allocation exists
      const { data: existing, error: existingError } = await supabase
        .from('project_budgets')
        .select('id, allocated_amount')
        .eq('project_id', projectId)
        .eq('category', category)
        .is('deleted_at', null)
        .single()

      if (existingError && existingError.code !== 'PGRST116') {
        logger.error('Error checking existing allocation', existingError, {
          action: 'updateBudgetAllocation',
          category,
        })
        return { success: false, error: `Failed to check existing ${category} budget: ${existingError.message}` }
      }

      if (existing) {
        logger.debug('Updating existing allocation', {
          action: 'updateBudgetAllocation',
          category,
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
          logger.error('Failed to update allocation', updateError, {
            action: 'updateBudgetAllocation',
            category,
          })
          return { success: false, error: `Failed to update ${category} budget: ${updateError.message}` }
        }

        updatedCount++
        logger.debug('Updated allocation', {
          action: 'updateBudgetAllocation',
          category,
        })

        // Track in budget history if amount changed
        if (existing.allocated_amount !== amount) {
          logger.debug('Recording budget history', {
            action: 'updateBudgetAllocation',
            category,
          })
          const { error: historyError } = await supabase.from('project_budget_history').insert({
            project_budget_id: existing.id,
            old_amount: existing.allocated_amount,
            new_amount: amount,
            reason: reason || null,
            changed_by: user.id,
          })

          if (historyError) {
            logger.error('Failed to record history', historyError, {
              action: 'updateBudgetAllocation',
              category,
            })
            return { success: false, error: `Failed to record budget history for ${category}: ${historyError.message}` }
          }

          historyCount++
          logger.debug('Recorded history', {
            action: 'updateBudgetAllocation',
            category,
          })
        }
      } else {
        logger.debug('Creating new allocation', {
          action: 'updateBudgetAllocation',
          category,
        })

        // Create new allocation
        const { error: insertError } = await supabase.from('project_budgets').insert({
          project_id: projectId,
          category,
          allocated_amount: amount,
        })

        if (insertError) {
          logger.error('Failed to create allocation', insertError, {
            action: 'updateBudgetAllocation',
            category,
          })
          return { success: false, error: `Failed to create ${category} budget: ${insertError.message}` }
        }

        createdCount++
        logger.debug('Created allocation', {
          action: 'updateBudgetAllocation',
          category,
        })
      }
    }

    logger.info('All allocations processed successfully', {
      action: 'updateBudgetAllocation',
      updatedCount,
      createdCount,
      historyCount,
    })

    logger.info('Budget allocation update completed successfully', {
      action: 'updateBudgetAllocation',
      projectId,
    })
    return { success: true, data: undefined }
  } catch (error) {
    logger.error('Unexpected error during budget allocation update', error as Error, {
      action: 'updateBudgetAllocation',
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update budget allocation',
    }
  }
}
