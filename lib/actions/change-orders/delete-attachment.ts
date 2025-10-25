/**
 * Delete Attachment from Change Order
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export async function deleteAttachment(attachmentId: string): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Get attachment to get file path
    const { data: attachment } = await supabase
      .from('change_order_attachments')
      .select('file_path, uploaded_by')
      .eq('id', attachmentId)
      .single()

    if (!attachment) {
      return { success: false, error: 'Attachment not found' }
    }

    // Only uploader can delete (or we could add manager check)
    if (attachment.uploaded_by !== user.id) {
      return { success: false, error: 'Only the uploader can delete this attachment' }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('change_order_attachments')
      .delete()
      .eq('id', attachmentId)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('change-order-attachments')
      .remove([attachment.file_path])

    if (storageError) {
      console.error('Failed to delete file from storage:', storageError)
      // Don't fail the whole operation if storage delete fails
    }

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete attachment',
    }
  }
}
