/**
 * Submit RFI Server Action
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { submitRFISchema, type SubmitRFIInput } from '@/lib/schemas'
import type { ActionResponse } from '@/lib/types'
import { withAction } from '@/lib/utils/server-actions'
import { ErrorMessages, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/utils/errors'
import { sendRFIAssignmentEmail } from '@/lib/email/send-rfi-assignment'

export const submitRFI = withAction(
  submitRFISchema,
  async (data: SubmitRFIInput): Promise<ActionResponse<any>> => {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Get RFI to check status (and fetch data for email)
    const { data: existingRFI, error: fetchError } = await supabase
      .from('rfis')
      .select(`
        status,
        created_by,
        number,
        title,
        description,
        priority,
        project_id,
        projects!inner (
          id,
          name,
          organization_id
        ),
        creator:profiles!created_by (
          id,
          full_name
        )
      `)
      .eq('id', data.rfiId)
      .single()

    if (fetchError || !existingRFI) {
      throw new NotFoundError('RFI not found')
    }

    // Can only submit draft RFIs
    if ((existingRFI as any).status !== 'draft') {
      return {
        success: false,
        error: 'Only draft RFIs can be submitted',
      }
    }

    // Check if user is creator
    if ((existingRFI as any).created_by !== user.id) {
      throw new ForbiddenError('Only the creator can submit this RFI')
    }

    // Update RFI status to submitted
    const updateData: any = {
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    }

    if (data.assignedToId) updateData.assigned_to_id = data.assignedToId
    if (data.assignedToOrg) updateData.assigned_to_org = data.assignedToOrg
    if (data.responseDueDate) updateData.response_due_date = data.responseDueDate

    const { data: rfi, error: updateError } = await supabase
      .from('rfis')
      .update(updateData)
      .eq('id', data.rfiId)
      .select(`
        *,
        assigned_to:profiles!assigned_to_id (
          id,
          email,
          full_name
        )
      `)
      .single()

    if (updateError || !rfi) {
      return {
        success: false,
        error: updateError?.message ?? ErrorMessages.OPERATION_FAILED,
      }
    }

    // Send email notification to assignee if assigned to a user
    if (data.assignedToId && (rfi as any).assigned_to?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const orgId = (existingRFI as any).projects?.organization_id
      const projectId = (existingRFI as any).project_id
      const viewUrl = `${appUrl}/${orgId}/projects/${projectId}/rfis/${data.rfiId}`

      await sendRFIAssignmentEmail({
        to: (rfi as any).assigned_to.email,
        rfiNumber: (existingRFI as any).number,
        rfiTitle: (existingRFI as any).title,
        rfiDescription: (existingRFI as any).description,
        assignedBy: (existingRFI as any).creator?.full_name || user.email || 'Unknown',
        dueDate: data.responseDueDate || undefined,
        priority: (existingRFI as any).priority,
        projectName: (existingRFI as any).projects?.name || 'Unknown Project',
        viewUrl,
      })
      // Note: Email failures are logged but don't fail the action
    }

    return {
      success: true,
      data: rfi,
    }
  }
)
