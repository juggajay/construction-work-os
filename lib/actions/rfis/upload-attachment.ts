/**
 * Upload Attachment Server Action
 * Note: File upload to Supabase Storage happens client-side
 * This action only records the attachment metadata in the database
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { uploadAttachmentSchema, type UploadAttachmentInput } from '@/lib/schemas'
import type { ActionResponse } from '@/lib/types'
import { withAction } from '@/lib/utils/server-actions'
import { ErrorMessages, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/utils/errors'

export const uploadAttachment = withAction(
  uploadAttachmentSchema,
  async (data: UploadAttachmentInput): Promise<ActionResponse<any>> => {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Get RFI to check access
    const { data: rfi, error: fetchError } = await supabase
      .from('rfis')
      .select('project_id')
      .eq('id', data.rfiId)
      .single()

    if (fetchError || !rfi) {
      throw new NotFoundError('RFI not found')
    }

    // Check if user has access to this project
    const { data: projectIds } = await supabase.rpc('user_project_ids', {
      user_uuid: user.id,
    })

    const projectIdStrings = ((projectIds as any) || []).map((p: any) => p.project_id)
    if (!projectIds || !projectIdStrings.includes((rfi as any).project_id)) {
      throw new ForbiddenError('You do not have access to this project')
    }

    // Insert attachment metadata
    const { data: attachment, error: insertError } = await supabase
      .from('rfi_attachments')
      .insert({
        rfi_id: data.rfiId,
        response_id: data.responseId,
        file_path: data.filePath,
        file_name: data.fileName,
        file_size: data.fileSize,
        file_type: data.fileType,
        drawing_sheet: data.drawingSheet,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (insertError || !attachment) {
      return {
        success: false,
        error: insertError?.message ?? ErrorMessages.OPERATION_FAILED,
      }
    }

    return {
      success: true,
      data: attachment,
    }
  }
)
