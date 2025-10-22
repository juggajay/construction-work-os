'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { SubmitDailyReportSchema } from './schemas';
import { z } from 'zod';

export type SubmitDailyReportInput = z.infer<typeof SubmitDailyReportSchema>;

interface SubmitDailyReportResult {
  success: boolean;
  error?: string;
}

/**
 * Submit daily report (draft → submitted)
 * Validates required fields before submission
 * Enforces one-report-per-date constraint
 */
export async function submitDailyReport(
  input: unknown
): Promise<SubmitDailyReportResult> {
  try {
    // Validate input
    const validated = SubmitDailyReportSchema.parse(input);

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get report with entries count
    const { data: report, error: fetchError } = await supabase
      .from('daily_reports')
      .select(
        `
        *,
        crew_count:daily_report_crew_entries(count),
        equipment_count:daily_report_equipment_entries(count)
      `
      )
      .eq('id', validated.dailyReportId)
      .single();

    if (fetchError || !report) {
      return { success: false, error: 'Daily report not found' };
    }

    // Only creator can submit
    if (report.created_by !== user.id) {
      return { success: false, error: 'Only the creator can submit this report' };
    }

    // Check status
    if (report.status !== 'draft') {
      return {
        success: false,
        error: `Cannot submit report with status: ${report.status}`,
      };
    }

    // Validate required fields
    if (!report.weather_condition) {
      return {
        success: false,
        error: 'Weather condition is required before submission',
      };
    }

    // At least one of: crew entries, equipment entries, or narrative
    const hasCrewEntries = report.crew_count?.[0]?.count > 0;
    const hasEquipmentEntries = report.equipment_count?.[0]?.count > 0;
    const hasNarrative = report.narrative && report.narrative.trim().length > 0;

    if (!hasCrewEntries && !hasEquipmentEntries && !hasNarrative) {
      return {
        success: false,
        error:
          'Report must have crew entries, equipment entries, or a narrative before submission',
      };
    }

    // Check for duplicate submission (unique constraint will catch this, but provide friendly error)
    const { data: existingReport } = await supabase
      .from('daily_reports')
      .select('id, submitted_by')
      .eq('project_id', report.project_id)
      .eq('report_date', report.report_date)
      .in('status', ['submitted', 'approved', 'archived'])
      .neq('id', validated.dailyReportId) // Exclude current report
      .maybeSingle();

    if (existingReport) {
      // Get submitter name
      const { data: submitter } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', existingReport.submitted_by)
        .single();

      return {
        success: false,
        error: `A report for this date has already been submitted by ${submitter?.full_name || 'another user'}`,
      };
    }

    // Submit report
    const { error: updateError } = await supabase
      .from('daily_reports')
      .update({
        status: 'submitted',
        submitted_by: user.id,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', validated.dailyReportId);

    if (updateError) {
      // Check if unique constraint violation
      if (updateError.code === '23505') {
        return {
          success: false,
          error: 'A report for this date has already been submitted',
        };
      }
      return { success: false, error: updateError.message };
    }

    // Revalidate paths
    revalidatePath(`/[orgSlug]/projects/${report.project_id}/daily-reports`);
    revalidatePath(
      `/[orgSlug]/projects/${report.project_id}/daily-reports/${validated.dailyReportId}`
    );

    // TODO: Send notification to project manager

    return { success: true };
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(', '),
      };
    }

    console.error('Error submitting daily report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
