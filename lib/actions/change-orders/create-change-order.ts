/**
 * Create Change Order Server Action
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/utils/errors'
import { createChangeOrderSchema, type CreateChangeOrderInput } from '@/lib/schemas'
import { ZodError } from 'zod'
import { logger } from '@/lib/utils/logger'

export async function createChangeOrder(
  input: unknown
): Promise<ActionResponse<{ id: string; number: string }>> {
  try {
    // Validate input
    const validatedInput = createChangeOrderSchema.parse(input)

    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in to create change orders')
    }

    // Check project access
    const { data: projectIds } = await supabase.rpc('user_project_ids')

    if (!projectIds || !(projectIds as any[]).some((p: any) => p.project_id === validatedInput.projectId)) {
      throw new ForbiddenError('You do not have access to this project')
    }

    // Insert change order (number will be auto-assigned by trigger)
    const changeOrderData = {
      project_id: validatedInput.projectId,
      title: validatedInput.title,
      description: validatedInput.description || null,
      type: validatedInput.type as any,
      status: (validatedInput.status as any) || 'contemplated',
      originating_event_type: validatedInput.originatingEventType as any,
      originating_event_id: validatedInput.originatingEventId || null,
      cost_impact: validatedInput.costImpact || 0,
      schedule_impact_days: validatedInput.scheduleImpactDays || 0,
      new_completion_date: validatedInput.newCompletionDate || null,
      created_by: user.id,
    }

    const { data: changeOrder, error: insertError } = await supabase
      .from('change_orders')
      .insert(changeOrderData as any)
      .select('id, number')
      .single()

    if (insertError) {
      logger.error('Failed to create change order', new Error(insertError.message), {
        action: 'createChangeOrder',
        projectId: validatedInput.projectId,
        userId: user.id,
      })
      return {
        success: false,
        error: insertError.message || 'Failed to create change order',
      }
    }

    logger.info('Change order created successfully', {
      action: 'createChangeOrder',
      changeOrderId: changeOrder.id,
      changeOrderNumber: changeOrder.number,
      projectId: validatedInput.projectId,
      userId: user.id,
    })

    return {
      success: true,
      data: {
        id: changeOrder.id,
        number: changeOrder.number,
      },
    }
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      logger.warn('Change order validation failed', {
        action: 'createChangeOrder',
        validationErrors: error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message
        })),
      })
      const errorMessage = error.issues.map(issue => issue.message).join(', ')
      return {
        success: false,
        error: `Validation failed: ${errorMessage}`,
      }
    }

    logger.error('Unexpected error creating change order', error as Error, {
      action: 'createChangeOrder',
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create change order',
    }
  }
}
