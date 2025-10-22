/**
 * Assign RFI Server Action
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { assignRFISchema, type AssignRFIInput } from '@/lib/schemas'
import type { ActionResponse } from '@/lib/types'
import { withAction } from '@/lib/utils/server-actions'
import { ErrorMessages, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/utils/errors'
import { sendRFIAssignmentEmail } from '@/lib/email/send-rfi-assignment'

export const assignRFI = withAction(
  assignRFISchema,
  async (data: AssignRFIInput): Promise<ActionResponse<any>> => {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Get RFI (with additional data for email)
    const { data: existingRFI, error: fetchError } = await supabase
      .from('rfis')
      .select(`
        project_id,
        status,
        number,
        title,
        description,
        priority,
        response_due_date,
        projects!inner (
          id,
          name,
          organization_id
        ),
        assigner:profiles!created_by (
          id,
          full_name
        )
      `)
      .eq('id', data.rfiId)
      .single()

    if (fetchError || !existingRFI) {
      throw new NotFoundError('RFI not found')
    }

    // Check if user is project manager
    // @ts-ignore - Supabase RPC types not generated
    const { data: isManager } = await supabase.rpc('is_project_manager', {
      user_uuid: user.id,
      check_project_id: (existingRFI as any).project_id,
    })

    if (!isManager) {
      throw new ForbiddenError('Only project managers can assign RFIs')
    }

    // Update assignment
    const { data: rfi, error: updateError } = await supabase
      .from('rfis')
      // @ts-ignore - RFI types recently added
      .update({
        assigned_to_id: data.assignedToId || null,
        assigned_to_org: data.assignedToOrg || null,
      })
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

    // Send email notification if RFI is submitted/under review and assigned to a user
    const rfiStatus = (existingRFI as any).status
    if (
      (rfiStatus === 'submitted' || rfiStatus === 'under_review') &&
      data.assignedToId &&
      (rfi as any).assigned_to?.email
    ) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const orgId = (existingRFI as any).projects?.organization_id
      const projectId = (existingRFI as any).project_id
      const viewUrl = `${appUrl}/${orgId}/projects/${projectId}/rfis/${data.rfiId}`

      await sendRFIAssignmentEmail({
        to: (rfi as any).assigned_to.email,
        rfiNumber: (existingRFI as any).number,
        rfiTitle: (existingRFI as any).title,
        rfiDescription: (existingRFI as any).description,
        assignedBy: user.email || 'Project Manager',
        dueDate: (existingRFI as any).response_due_date || undefined,
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
