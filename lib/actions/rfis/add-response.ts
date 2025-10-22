/**
 * Add Response Server Action
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { addResponseSchema, type AddResponseInput } from '@/lib/schemas'
import type { ActionResponse } from '@/lib/types'
import { withAction } from '@/lib/utils/server-actions'
import { ErrorMessages, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/utils/errors'
import { sendRFIResponseEmail } from '@/lib/email/send-rfi-response'

export const addResponse = withAction(
  addResponseSchema,
  async (data: AddResponseInput): Promise<ActionResponse<any>> => {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Get RFI to check access (and fetch data for email)
    const { data: rfi, error: fetchError } = await supabase
      .from('rfis')
      .select(`
        project_id,
        status,
        created_by,
        assigned_to_id,
        number,
        title,
        projects!inner (
          id,
          name,
          organization_id
        ),
        creator:profiles!created_by (
          id,
          email,
          full_name
        )
      `)
      .eq('id', data.rfiId)
      .single()

    if (fetchError || !rfi) {
      throw new NotFoundError('RFI not found')
    }

    // Check if user has access to this project
    // @ts-ignore - Supabase RPC types not generated
    const { data: projectIds } = await supabase.rpc('user_project_ids', {
      user_uuid: user.id,
    })

    const rfiProjectId = (rfi as any).project_id
    if (!projectIds || !(projectIds as string[]).includes(rfiProjectId)) {
      throw new ForbiddenError('You do not have access to this project')
    }

    // Get responder profile for email
    const { data: responder } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    // Insert response
    const { data: response, error: insertError } = await supabase
      .from('rfi_responses')
      // @ts-ignore - RFI types recently added
      .insert({
        rfi_id: data.rfiId,
        author_id: user.id,
        content: data.content,
        is_official_answer: data.isOfficialAnswer,
      })
      .select()
      .single()

    if (insertError || !response) {
      return {
        success: false,
        error: insertError?.message ?? ErrorMessages.OPERATION_FAILED,
      }
    }

    // If this is the official answer, update RFI status
    if (data.isOfficialAnswer) {
      await supabase
        .from('rfis')
        // @ts-ignore - RFI types recently added
        .update({
          status: 'answered',
          answered_at: new Date().toISOString(),
        })
        .eq('id', data.rfiId)
    }

    // Send email notification to RFI creator (unless they are the one responding)
    const creatorEmail = (rfi as any).creator?.email
    if (creatorEmail && (rfi as any).created_by !== user.id) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const orgId = (rfi as any).projects?.organization_id
      const projectId = (rfi as any).project_id
      const viewUrl = `${appUrl}/${orgId}/projects/${projectId}/rfis/${data.rfiId}`

      await sendRFIResponseEmail({
        to: creatorEmail,
        rfiNumber: (rfi as any).number,
        rfiTitle: (rfi as any).title,
        responderName: (responder as any)?.full_name || user.email || 'Unknown',
        responseText: data.content,
        isOfficialAnswer: data.isOfficialAnswer,
        projectName: (rfi as any).projects?.name || 'Unknown Project',
        viewUrl,
      })
      // Note: Email failures are logged but don't fail the action
    }

    return {
      success: true,
      data: response,
    }
  }
)
