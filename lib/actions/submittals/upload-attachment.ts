'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { UploadAttachmentSchema } from './schemas';
import { z } from 'zod';

export type UploadAttachmentInput = z.infer<typeof UploadAttachmentSchema>;

export interface UploadAttachmentResult {
  success: boolean;
  data?: {
    id: string;
    fileName: string;
  };
  error?: string;
}

/**
 * Create attachment record after file upload to Supabase Storage
 * Note: File upload to storage should happen client-side, this just creates the database record
 */
export async function uploadAttachment(
  input: unknown
): Promise<UploadAttachmentResult> {
  try {
    // Validate input
    const validated = UploadAttachmentSchema.parse(input);

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify submittal exists and user has access
    const { data: submittal, error: fetchError } = await supabase
      .from('submittals')
      .select('id, project_id')
      .eq('id', validated.submittalId)
      .is('deleted_at', null)
      .single()) as any;

    if (fetchError || !submittal) {
      return { success: false, error: 'Submittal not found' };
    }

    // Validate file size (max 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    if (validated.fileSize > MAX_FILE_SIZE) {
      return {
        success: false,
        error: 'File size exceeds 50MB limit',
      };
    }

    // Insert attachment record
    const { data: attachment, error: insertError } = await supabase
      .from('submittal_attachments')
      .insert({
        submittal_id: validated.submittalId,
        version_number: validated.versionNumber,
        file_path: validated.filePath,
        file_name: validated.fileName,
        file_size: validated.fileSize,
        file_type: validated.fileType,
        attachment_type: validated.attachmentType,
        uploaded_by: user.id,
      })
      .select('id, file_name')
      .single()) as any;

    if (insertError) {
      console.error('Error creating attachment record:', insertError);
      return { success: false, error: 'Failed to create attachment record' };
    }

    if (!attachment) {
      return { success: false, error: 'Attachment created but no data returned' };
    }

    // Revalidate submittal detail page
    revalidatePath(`/[orgSlug]/projects/${submittal.project_id}/submittals/${validated.submittalId}`);

    return {
      success: true,
      data: {
        id: attachment.id,
        fileName: attachment.file_name,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation failed',
      };
    }

    console.error('Unexpected error uploading attachment:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
