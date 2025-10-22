'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface UploadPhotoInput {
  dailyReportId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  caption?: string;
  category?: 'progress' | 'safety' | 'quality' | 'site_conditions' | 'other';

  // EXIF metadata (extracted client-side)
  latitude?: number;
  longitude?: number;
  dateTaken?: string; // ISO string
  cameraMake?: string;
  cameraModel?: string;
}

export interface UploadPhotoResult {
  success: boolean;
  data?: {
    id: string;
    uploadUrl: string; // Presigned URL for client to upload to
    storagePath: string;
  };
  error?: string;
}

/**
 * Create attachment record and generate presigned upload URL
 * Client will compress photo and upload to the URL
 */
export async function uploadPhoto(
  input: UploadPhotoInput
): Promise<UploadPhotoResult> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate daily report is draft
    const { data: report, error: fetchError } = await supabase
      .from('daily_reports')
      .select('status, project_id')
      .eq('id', input.dailyReportId)
      .single();

    if (fetchError || !report) {
      return { success: false, error: 'Daily report not found' };
    }

    if (report.status !== 'draft') {
      return {
        success: false,
        error: 'Cannot upload photos to non-draft reports',
      };
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(input.contentType)) {
      return { success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are supported.' };
    }

    // Validate file size (max 10MB after compression)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (input.fileSize > maxSize) {
      return { success: false, error: 'File size exceeds 10MB limit' };
    }

    // Generate unique storage path
    const fileExtension = input.fileName.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const storagePath = `daily-reports/${input.dailyReportId}/${timestamp}-${randomStr}.${fileExtension}`;

    // Create attachment record
    const { data: attachment, error: insertError } = await supabase
      .from('daily_report_attachments')
      .insert({
        daily_report_id: input.dailyReportId,
        file_name: input.fileName,
        file_size: input.fileSize,
        content_type: input.contentType,
        storage_path: storagePath,
        attachment_type: 'photo',
        caption: input.caption,
        category: input.category || 'other',
        gps_latitude: input.latitude,
        gps_longitude: input.longitude,
        photo_taken_at: input.dateTaken ? new Date(input.dateTaken) : undefined,
        camera_make: input.cameraMake,
        camera_model: input.cameraModel,
        uploaded_by: user.id,
      })
      .select('id')
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Generate presigned upload URL (valid for 5 minutes)
    const { data: uploadData, error: urlError } = await supabase.storage
      .from('daily-report-photos')
      .createSignedUploadUrl(storagePath);

    if (urlError || !uploadData) {
      // Clean up attachment record
      await supabase
        .from('daily_report_attachments')
        .delete()
        .eq('id', attachment.id);

      return { success: false, error: 'Failed to generate upload URL' };
    }

    // Revalidate paths
    revalidatePath(
      `/[orgSlug]/projects/${report.project_id}/daily-reports/${input.dailyReportId}`
    );

    return {
      success: true,
      data: {
        id: attachment.id,
        uploadUrl: uploadData.signedUrl,
        storagePath,
      },
    };
  } catch (error) {
    console.error('Error uploading photo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Confirm photo upload after client uploads to presigned URL
 */
export async function confirmPhotoUpload(
  attachmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify attachment exists and belongs to user
    const { data: attachment, error: fetchError } = await supabase
      .from('daily_report_attachments')
      .select('id, storage_path, daily_report_id')
      .eq('id', attachmentId)
      .eq('uploaded_by', user.id)
      .single();

    if (fetchError || !attachment) {
      return { success: false, error: 'Attachment not found' };
    }

    // Verify file exists in storage
    const { data: file, error: storageError } = await supabase.storage
      .from('daily-report-photos')
      .list(attachment.storage_path.split('/').slice(0, -1).join('/'), {
        search: attachment.storage_path.split('/').pop(),
      });

    if (storageError || !file || file.length === 0) {
      return { success: false, error: 'File not found in storage' };
    }

    // Photo upload confirmed - no additional updates needed
    // The attachment record was already created in uploadPhoto()

    return { success: true };
  } catch (error) {
    console.error('Error confirming photo upload:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
