'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CopyFromPreviousInput {
  projectId: string;
  reportDate: string; // YYYY-MM-DD for new report
}

export interface CopyFromPreviousResult {
  success: boolean;
  data?: {
    id: string;
    copiedFrom: string; // previous report date
    crewEntriesCopied: number;
    equipmentEntriesCopied: number;
  };
  error?: string;
}

/**
 * Create new daily report by copying crew/equipment from previous day
 * Does NOT copy: narrative, incidents, attachments, materials
 */
export async function copyFromPreviousReport(
  input: CopyFromPreviousInput
): Promise<CopyFromPreviousResult> {
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

    // Find most recent report before requested date
    const { data: previousReport, error: fetchError } = await supabase
      .from('daily_reports')
      .select(
        `
        *,
        crew_entries:daily_report_crew_entries(*),
        equipment_entries:daily_report_equipment_entries(*)
      `
      )
      .eq('project_id', input.projectId)
      .lt('report_date', input.reportDate)
      .order('report_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!previousReport) {
      return {
        success: false,
        error: 'No previous report found to copy from',
      };
    }

    // Type assertion for complex nested query
    const previousReportData = previousReport as any;

    // Create new draft report (type assertion needed for Supabase client)
    const { data: newReport, error: createError } = await (supabase as any)
      .from('daily_reports')
      .insert({
        project_id: input.projectId,
        report_date: input.reportDate,
        status: 'draft',
        created_by: user.id,
        work_hours_start: previousReportData.work_hours_start,
        work_hours_end: previousReportData.work_hours_end,
      })
      .select('id')
      .single();

    if (createError || !newReport) {
      return { success: false, error: createError?.message || 'Failed to create report' };
    }

    // Type assertion for newReport
    const newReportData = newReport as any;

    let crewEntriesCopied = 0;
    let equipmentEntriesCopied = 0;

    // Copy crew entries (without notes)
    if (previousReportData.crew_entries && previousReportData.crew_entries.length > 0) {
      const crewEntries = previousReportData.crew_entries.map((entry: any) => ({
        daily_report_id: newReportData.id,
        trade: entry.trade,
        csi_division: entry.csi_division,
        subcontractor_org_id: entry.subcontractor_org_id,
        headcount: entry.headcount,
        hours_worked: entry.hours_worked,
        classification: entry.classification,
        hourly_rate: entry.hourly_rate,
        notes: '', // Don't copy date-specific notes
      }));

      const { error: crewError } = await supabase
        .from('daily_report_crew_entries')
        .insert(crewEntries);

      if (!crewError) {
        crewEntriesCopied = crewEntries.length;
      }
    }

    // Copy equipment entries (without notes)
    if (
      previousReportData.equipment_entries &&
      previousReportData.equipment_entries.length > 0
    ) {
      const equipmentEntries = previousReportData.equipment_entries.map(
        (entry: any) => ({
          daily_report_id: newReportData.id,
          equipment_type: entry.equipment_type,
          equipment_id: entry.equipment_id,
          operator_name: entry.operator_name,
          hours_used: entry.hours_used,
          fuel_consumed: entry.fuel_consumed,
          rental_cost: entry.rental_cost,
          notes: '', // Don't copy date-specific notes
        })
      );

      const { error: equipmentError } = await supabase
        .from('daily_report_equipment_entries')
        .insert(equipmentEntries);

      if (!equipmentError) {
        equipmentEntriesCopied = equipmentEntries.length;
      }
    }

    // Revalidate paths
    revalidatePath(`/[orgSlug]/projects/${input.projectId}/daily-reports`);

    return {
      success: true,
      data: {
        id: newReportData.id,
        copiedFrom: previousReportData.report_date,
        crewEntriesCopied,
        equipmentEntriesCopied,
      },
    };
  } catch (error) {
    console.error('Error copying from previous report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
