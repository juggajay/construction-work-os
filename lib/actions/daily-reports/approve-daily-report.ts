'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ApproveDailyReportInput {
  id: string;
}

export interface ApproveDailyReportResult {
  success: boolean;
  error?: string;
}

/**
 * Approve daily report (submitted → approved)
 * Authorization handled at application layer (check user role before calling)
 */
export async function approveDailyReport(
  input: ApproveDailyReportInput
): Promise<ApproveDailyReportResult> {
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

    // Get report
    const { data: report, error: fetchError } = await supabase
      .from('daily_reports')
      .select('status, project_id')
      .eq('id', input.id)
      .single();

    if (fetchError || !report) {
      return { success: false, error: 'Daily report not found' };
    }

    // Type assertion for query result
    const reportData = report as any;

    // Check status
    if (reportData.status !== 'submitted') {
      return {
        success: false,
        error: `Cannot approve report with status: ${reportData.status}`,
      };
    }

    // Approve report (type assertion needed for Supabase client)
    const { error: updateError } = await (supabase as any)
      .from('daily_reports')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', input.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Revalidate paths
    revalidatePath(`/[orgSlug]/projects/${reportData.project_id}/daily-reports`);
    revalidatePath(
      `/[orgSlug]/projects/${reportData.project_id}/daily-reports/${input.id}`
    );

    // TODO: Send notification to submitter

    return { success: true };
  } catch (error) {
    console.error('Error approving daily report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
