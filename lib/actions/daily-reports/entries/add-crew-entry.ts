'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface AddCrewEntryInput {
  dailyReportId: string;
  trade: string;
  csiDivision?: string;
  subcontractorOrgId?: string;
  headcount: number;
  hoursWorked: number;
  classification?: string;
  hourlyRate?: number;
  notes?: string;
}

export interface AddCrewEntryResult {
  success: boolean;
  data?: { id: string };
  error?: string;
}

/**
 * Add crew entry to daily report (draft status only)
 */
export async function addCrewEntry(
  input: AddCrewEntryInput
): Promise<AddCrewEntryResult> {
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
        error: 'Cannot add entries to non-draft reports',
      };
    }

    // Validate input
    if (!input.trade || input.trade.trim().length === 0) {
      return { success: false, error: 'Trade is required' };
    }

    if (input.headcount <= 0) {
      return { success: false, error: 'Headcount must be greater than 0' };
    }

    if (input.hoursWorked < 0) {
      return { success: false, error: 'Hours worked cannot be negative' };
    }

    // Insert crew entry (type assertion needed for Supabase client)
    const { data: entry, error: insertError } = await (supabase as any)
      .from('daily_report_crew_entries')
      .insert({
        daily_report_id: input.dailyReportId,
        trade: input.trade.trim(),
        csi_division: input.csiDivision,
        subcontractor_org_id: input.subcontractorOrgId,
        headcount: input.headcount,
        hours_worked: input.hoursWorked,
        classification: input.classification,
        hourly_rate: input.hourlyRate,
        notes: input.notes,
      })
      .select('id')
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Type assertion for entry data
    const entryData = entry as any;

    // Revalidate paths
    revalidatePath(`/[orgSlug]/projects/${reportData.project_id}/daily-reports/${input.dailyReportId}`);

    return { success: true, data: { id: entryData.id } };
  } catch (error) {
    console.error('Error adding crew entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
