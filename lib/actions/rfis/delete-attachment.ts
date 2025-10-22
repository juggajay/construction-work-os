/**
 * Delete Attachment Server Action
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { deleteAttachmentSchema, type DeleteAttachmentInput } from '@/lib/schemas'
import type { ActionResponse } from '@/lib/types'
import { withAction } from '@/lib/utils/server-actions'
import { ErrorMessages, UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/utils/errors'

export const deleteAttachment = withAction(
  deleteAttachmentSchema,
  async (data: DeleteAttachmentInput): Promise<ActionResponse<any>> => {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.AUTH_REQUIRED)
    }

    // Get attachment to check ownership and RFI status
    const { data: attachment, error: fetchError } = await supabase
      .from('rfi_attachments')
      .select(`
        uploaded_by,
        file_path,
        rfis (
          status
        )
      `)
      .eq('id', data.attachmentId)
      .single()

    if (fetchError || !attachment) {
      throw new NotFoundError('Attachment not found')
    }

    // Check if user is the uploader
    if ((attachment as any).uploaded_by !== user.id) {
      throw new ForbiddenError('Only the uploader can delete this attachment')
    }

    // Can only delete attachments from draft RFIs
    const rfiStatus = (attachment as any).rfis?.status
    if (rfiStatus && rfiStatus !== 'draft') {
      return {
        success: false,
        error: 'Can only delete attachments from draft RFIs',
      }
    }

    // Delete from database (file deletion from Storage should happen client-side)
    const { error: deleteError } = await supabase
      .from('rfi_attachments')
      .delete()
      .eq('id', data.attachmentId)

    if (deleteError) {
      return {
        success: false,
        error: deleteError.message ?? ErrorMessages.OPERATION_FAILED,
      }
    }

    // TODO: Delete file from Supabase Storage

    return {
      success: true,
      data: { id: data.attachmentId, filePath: (attachment as any).file_path },
    }
  }
)
