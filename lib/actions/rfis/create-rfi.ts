/**
 * Create RFI Server Action
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { createRFISchema, type CreateRFIInput } from '@/lib/schemas'
import type { ActionResponse } from '@/lib/types'
import { withAction } from '@/lib/utils/server-actions'
import { ErrorMessages, UnauthorizedError, ForbiddenError } from '@/lib/utils/errors'

export const createRFI = withAction(
  createRFISchema,
  async (data: CreateRFIInput): Promise<ActionResponse<any>> => {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Note: Access control is handled by RLS policies
    // The policies check both project_access and organization membership

    // Generate RFI number using Postgres function
    // @ts-ignore - Supabase RPC types not generated
    const { data: rfiNumber, error: numberError } = await supabase.rpc('next_rfi_number', {
      p_project_id: data.projectId,
    })

    if (numberError || !rfiNumber) {
      return {
        success: false,
        error: numberError?.message ?? 'Failed to generate RFI number',
      }
    }

    // Insert RFI
    const { data: rfi, error: insertError } = await supabase
      .from('rfis')
      // @ts-ignore - RFI types recently added, may not be in generated types
      .insert({
        project_id: data.projectId,
        number: rfiNumber,
        title: data.title,
        description: data.description,
        discipline: data.discipline,
        spec_section: data.specSection,
        drawing_reference: data.drawingReference,
        status: 'draft',
        priority: data.priority || 'medium',
        assigned_to_id: data.assignedToId,
        assigned_to_org: data.assignedToOrg,
        created_by: user.id,
        due_date: data.dueDate,
        response_due_date: data.responseDueDate,
        cost_impact: data.costImpact,
        schedule_impact: data.scheduleImpact,
      })
      .select()
      .single()

    if (insertError || !rfi) {
      return {
        success: false,
        error: insertError?.message ?? ErrorMessages.OPERATION_FAILED,
      }
    }

    return {
      success: true,
      data: rfi,
    }
  }
)
