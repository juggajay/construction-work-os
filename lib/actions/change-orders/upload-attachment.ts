/**
 * Upload Attachment to Change Order
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse, ChangeOrderAttachmentInsert, AttachmentCategory } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export interface UploadAttachmentInput {
  changeOrderId: string
  file: File
  category?: AttachmentCategory
}

export async function uploadAttachment(
  changeOrderId: string,
  projectId: string,
  file: File,
  category: AttachmentCategory = 'other'
): Promise<ActionResponse<{ id: string; path: string }>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Validate file size (max 50MB)
    if (file.size > 52428800) {
      return { success: false, error: 'File size must be less than 50MB' }
    }

    // Generate unique file path
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${projectId}/${changeOrderId}/${timestamp}_${sanitizedFileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('change-order-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return { success: false, error: uploadError.message }
    }

    // Create attachment record
    const attachmentData: ChangeOrderAttachmentInsert = {
      change_order_id: changeOrderId,
      file_path: uploadData.path,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type || null,
      category: category,
      uploaded_by: user.id,
    }

    const { data: attachment, error: insertError } = await supabase
      .from('change_order_attachments')
      .insert(attachmentData)
      .select('id')
      .single()

    if (insertError) {
      // Try to delete uploaded file if database insert fails
      await supabase.storage.from('change-order-attachments').remove([uploadData.path])
      return { success: false, error: insertError.message }
    }

    return {
      success: true,
      data: { id: attachment.id, path: uploadData.path },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload attachment',
    }
  }
}
