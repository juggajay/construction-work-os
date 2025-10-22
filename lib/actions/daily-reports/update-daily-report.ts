'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface UpdateDailyReportInput {
  id: string;
  narrative?: string;
  delays?: string;
  visitors?: string;
  inspections?: string;
  workHoursStart?: string; // HH:MM
  workHoursEnd?: string; // HH:MM
  weatherCondition?: string;
  temperatureHigh?: number;
  temperatureLow?: number;
  precipitation?: number;
  windSpeed?: number;
  humidity?: number;
}

interface UpdateDailyReportResult {
  success: boolean;
  error?: string;
}

/**
 * Update daily report (draft status only)
 * Cannot update reports after submission
 */
export async function updateDailyReport(
  input: UpdateDailyReportInput
): Promise<UpdateDailyReportResult> {
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

    // Get current report to check status and ownership
    const { data: report, error: fetchError } = await supabase
      .from('daily_reports')
      .select('status, created_by, project_id')
      .eq('id', input.id)
      .single();

    if (fetchError || !report) {
      return { success: false, error: 'Daily report not found' };
    }

    // Only allow updates to draft reports
    if (report.status !== 'draft') {
      return {
        success: false,
        error: 'Cannot edit daily report after submission',
      };
    }

    // Only creator can update draft reports
    if (report.created_by !== user.id) {
      return {
        success: false,
        error: 'Only the creator can update this draft report',
      };
    }

    // Build update object (only include provided fields)
    const updateData: any = {};

    if (input.narrative !== undefined) updateData.narrative = input.narrative;
    if (input.delays !== undefined) updateData.delays = input.delays;
    if (input.visitors !== undefined) updateData.visitors = input.visitors;
    if (input.inspections !== undefined)
      updateData.inspections = input.inspections;
    if (input.workHoursStart !== undefined)
      updateData.work_hours_start = input.workHoursStart;
    if (input.workHoursEnd !== undefined)
      updateData.work_hours_end = input.workHoursEnd;
    if (input.weatherCondition !== undefined)
      updateData.weather_condition = input.weatherCondition;
    if (input.temperatureHigh !== undefined)
      updateData.temperature_high = input.temperatureHigh;
    if (input.temperatureLow !== undefined)
      updateData.temperature_low = input.temperatureLow;
    if (input.precipitation !== undefined)
      updateData.precipitation = input.precipitation;
    if (input.windSpeed !== undefined) updateData.wind_speed = input.windSpeed;
    if (input.humidity !== undefined) updateData.humidity = input.humidity;

    // Update daily report
    const { error: updateError } = await supabase
      .from('daily_reports')
      .update(updateData)
      .eq('id', input.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Revalidate paths
    revalidatePath(`/[orgSlug]/projects/${report.project_id}/daily-reports`);
    revalidatePath(
      `/[orgSlug]/projects/${report.project_id}/daily-reports/${input.id}`
    );

    return { success: true };
  } catch (error) {
    console.error('Error updating daily report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
