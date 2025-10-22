'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface DeleteAttachmentInput {
  attachmentId: string;
  dailyReportId: string; // For revalidation
}

export interface DeleteAttachmentResult {
  success: boolean;
  error?: string;
}

/**
 * Delete attachment from daily report (draft status only)
 * Removes both database record and storage file
 */
export async function deleteAttachment(
  input: DeleteAttachmentInput
): Promise<DeleteAttachmentResult> {
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

    // Type assertion for query result
    const reportData = report as any;

    if (reportData.status !== 'draft') {
      return {
        success: false,
        error: 'Cannot delete attachments from non-draft reports',
      };
    }

    // Get attachment details
    const { data: attachment, error: attachmentError } = await supabase
      .from('daily_report_attachments')
      .select('id, storage_path, daily_report_id')
      .eq('id', input.attachmentId)
      .eq('daily_report_id', input.dailyReportId)
      .single();

    if (attachmentError || !attachment) {
      return { success: false, error: 'Attachment not found' };
    }

    // Type assertion for attachment data
    const attachmentData = attachment as any;

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('daily-report-photos')
      .remove([attachmentData.storage_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete database record
    const { error: deleteError } = await supabase
      .from('daily_report_attachments')
      .delete()
      .eq('id', input.attachmentId)
      .eq('daily_report_id', input.dailyReportId); // Safety check

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Revalidate paths
    revalidatePath(
      `/[orgSlug]/projects/${reportData.project_id}/daily-reports/${input.dailyReportId}`
    );

    return { success: true };
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete multiple attachments in bulk
 */
export async function deleteAttachments(
  attachmentIds: string[],
  dailyReportId: string
): Promise<DeleteAttachmentResult> {
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
      .eq('id', dailyReportId)
      .single();

    if (fetchError || !report) {
      return { success: false, error: 'Daily report not found' };
    }

    // Type assertion for query result
    const reportData = report as any;

    if (reportData.status !== 'draft') {
      return {
        success: false,
        error: 'Cannot delete attachments from non-draft reports',
      };
    }

    // Get all attachment storage paths
    const { data: attachments, error: attachmentsError } = await supabase
      .from('daily_report_attachments')
      .select('storage_path')
      .in('id', attachmentIds)
      .eq('daily_report_id', dailyReportId);

    if (attachmentsError) {
      return { success: false, error: attachmentsError.message };
    }

    if (!attachments || attachments.length === 0) {
      return { success: false, error: 'No attachments found' };
    }

    // Type assertion for attachments data
    const attachmentsData = attachments as any[];

    // Delete from storage (bulk)
    const storagePaths = attachmentsData.map((a) => a.storage_path);
    const { error: storageError } = await supabase.storage
      .from('daily-report-photos')
      .remove(storagePaths);

    if (storageError) {
      console.error('Bulk storage deletion error:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete database records (bulk)
    const { error: deleteError } = await supabase
      .from('daily_report_attachments')
      .delete()
      .in('id', attachmentIds)
      .eq('daily_report_id', dailyReportId); // Safety check

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Revalidate paths
    revalidatePath(
      `/[orgSlug]/projects/${reportData.project_id}/daily-reports/${dailyReportId}`
    );

    return { success: true };
  } catch (error) {
    console.error('Error deleting attachments:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
