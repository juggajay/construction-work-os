'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { DeleteAttachmentSchema } from './schemas';
import { z } from 'zod';

export type DeleteAttachmentInput = z.infer<typeof DeleteAttachmentSchema>;

export interface DeleteAttachmentResult {
  success: boolean;
  data?: {
    deleted: boolean;
  };
  error?: string;
}

/**
 * Delete attachment from draft submittal
 * Deletes both database record and file from Supabase Storage
 */
export async function deleteAttachment(
  input: unknown
): Promise<DeleteAttachmentResult> {
  try {
    // Validate input
    const validated = DeleteAttachmentSchema.parse(input);

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get attachment and verify permissions
    const { data: attachment, error: fetchError } = (await supabase
      .from('submittal_attachments')
      .select('id, file_path, uploaded_by, submittal_id, submittals!inner(status, project_id)')
      .eq('id', validated.attachmentId)
      .single()) as any;

    if (fetchError || !attachment) {
      return { success: false, error: 'Attachment not found' };
    }

    // Permission check: must be uploader
    if (attachment.uploaded_by !== user.id) {
      return {
        success: false,
        error: 'Only the uploader can delete this attachment',
      };
    }

    // Status check: submittal must be draft
    const submittal = (attachment as any).submittals;
    if (submittal.status !== 'draft') {
      return {
        success: false,
        error: 'Cannot delete attachments from submitted submittals',
      };
    }

    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from('submittals')
      .remove([attachment.file_path]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue anyway, delete database record
    }

    // Delete database record
    const { error: deleteError } = await supabase
      .from('submittal_attachments')
      .delete()
      .eq('id', validated.attachmentId);

    if (deleteError) {
      console.error('Error deleting attachment record:', deleteError);
      return { success: false, error: 'Failed to delete attachment' };
    }

    // Revalidate submittal detail page
    revalidatePath(`/[orgSlug]/projects/${submittal.project_id}/submittals/${attachment.submittal_id}`);

    return {
      success: true,
      data: {
        deleted: true,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation failed',
      };
    }

    console.error('Unexpected error deleting attachment:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
