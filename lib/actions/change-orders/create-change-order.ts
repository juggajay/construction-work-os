/**
 * Create Change Order Server Action
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse, ChangeOrderInsert } from '@/lib/types'
import { UnauthorizedError, ForbiddenError } from '@/lib/utils/errors'

export interface CreateChangeOrderInput {
  projectId: string
  title: string
  description?: string
  type: string
  status?: string
  originatingEventType?: string | null
  originatingEventId?: string | null
  costImpact?: number
  scheduleImpactDays?: number
}

export async function createChangeOrder(
  input: CreateChangeOrderInput
): Promise<ActionResponse<{ id: string; number: string }>> {
  try {
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

    if (!projectIds || !(projectIds as any[]).some((p: any) => p.project_id === input.projectId)) {
      throw new ForbiddenError('You do not have access to this project')
    }

    // Insert change order (number will be auto-assigned by trigger)
    const changeOrderData = {
      project_id: input.projectId,
      title: input.title,
      description: input.description || null,
      type: input.type as any,
      status: (input.status as any) || 'contemplated',
      originating_event_type: input.originatingEventType as any,
      originating_event_id: input.originatingEventId || null,
      cost_impact: input.costImpact || 0,
      schedule_impact_days: input.scheduleImpactDays || 0,
      created_by: user.id,
    }

    const { data: changeOrder, error: insertError } = await supabase
      .from('change_orders')
      .insert(changeOrderData as any)
      .select('id, number')
      .single()

    if (insertError) {
      console.error('Create change order error:', insertError)
      return {
        success: false,
        error: insertError.message || 'Failed to create change order',
      }
    }

    return {
      success: true,
      data: {
        id: changeOrder.id,
        number: changeOrder.number,
      },
    }
  } catch (error) {
    console.error('Create change order error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create change order',
    }
  }
}
